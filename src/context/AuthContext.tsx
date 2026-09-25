import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  brokerAuthService,
  brokerSession,
  mt5Session,
  type BrokerUser,
  type BrokerLoginResponse,
  ApiError,
  toErrorMessage,
  pickBrokerTokens,
} from '../api';
import { validateLoginCredentials, normalizeEmail } from '../utils/authValidation';

const USER_STORAGE_KEY = 'exness-clone.user-session.v1';

export interface AuthContextType {
  user: BrokerUser | null;
  brokerToken: string | null;
  mt5Token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<BrokerLoginResponse>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<BrokerUser | null>;
  setMt5Tokens: (accessToken: string | null, refreshToken?: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BrokerUser | null>(null);
  const [brokerToken, setBrokerToken] = useState<string | null>(brokerSession.getToken());
  const [mt5Token, setMt5Token] = useState<string | null>(mt5Session.getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Sync token changes from sessions
  useEffect(() => {
    const unsubBroker = brokerSession.subscribe((tokens) => {
      setBrokerToken(tokens.accessToken);
    });
    const unsubMt5 = mt5Session.subscribe((tokens) => {
      setMt5Token(tokens.accessToken);
    });
    return () => {
      unsubBroker();
      unsubMt5();
    };
  }, []);

  const signOut = useCallback(async () => {
    brokerAuthService.logout();
    mt5Session.clear();
    setUser(null);
    setBrokerToken(null);
    setMt5Token(null);
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
      } catch {}
    }
  }, []);

  // Listen to session expiry (e.g. 401 on any API call) -> auto kick out!
  useEffect(() => {
    const unsubExpiry = brokerSession.onSessionExpired(() => {
      console.warn('[AuthContext] Session expired or unauthorized. Kicking out to Login screen.');
      void signOut();
    });
    return () => unsubExpiry();
  }, [signOut]);

  // Restore cached user and verify session on launch (Auto Login)
  useEffect(() => {
    let mounted = true;
    async function restore() {
      try {
        const tokens = await brokerSession.restore();
        if (Platform.OS !== 'web') {
          const storedUser = await SecureStore.getItemAsync(USER_STORAGE_KEY);
          if (storedUser && mounted) {
            setUser(JSON.parse(storedUser));
          }
        }
        if (tokens.accessToken) {
          if (mounted) setBrokerToken(tokens.accessToken);
          // Verify token is still accepted by server
          try {
            const profile = await brokerAuthService.me();
            if (mounted) {
              setUser(profile);
              if (Platform.OS !== 'web') {
                await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(profile));
              }
            }
          } catch (err) {
            // Token is expired or rejected by server — kick out immediately!
            if (mounted) {
              console.warn('[AuthContext] Stored token rejected by server, clearing session:', err);
              await signOut();
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Error restoring session:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    restore();
    return () => {
      mounted = false;
    };
  }, [signOut]);

  const signIn = useCallback(async (email: string, password: string): Promise<BrokerLoginResponse> => {
    const validationError = validateLoginCredentials(email, password);
    if (validationError) {
      const messages: Record<string, string> = {
        requiredEmail: 'Email is required.',
        invalidEmail: 'Enter a valid email address.',
        requiredPassword: 'Password is required.',
        invalidPassword: 'Password must be at least 8 characters.',
      };
      throw new Error(messages[validationError] || 'Invalid credentials');
    }

    const normEmail = normalizeEmail(email);
    try {
      const response = await brokerAuthService.login({
        email: normEmail,
        password,
      });

      const { token } = pickBrokerTokens(response);
      if (!token) {
        throw new Error('Login succeeded but no token was returned');
      }

      const loggedUser = response.user ?? {
        id: 'usr_' + Date.now(),
        email: normEmail,
      };

      setUser(loggedUser);
      setBrokerToken(token);
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(loggedUser));
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error(toErrorMessage(error, 'Sign in failed'));
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<BrokerUser | null> => {
    if (!brokerSession.getToken()) return null;
    try {
      const freshUser = await brokerAuthService.me();
      setUser(freshUser);
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(freshUser));
      }
      return freshUser;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new Error(toErrorMessage(error, 'Could not refresh profile'));
    }
  }, []);

  const setMt5Tokens = useCallback(
    (accessToken: string | null, refreshToken: string | null = null) => {
      mt5Session.setTokens(accessToken, refreshToken);
      setMt5Token(accessToken);
    },
    [],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      brokerToken,
      mt5Token,
      isAuthenticated: Boolean(brokerToken),
      isLoading,
      signIn,
      signOut,
      refreshUser,
      setMt5Tokens,
    }),
    [user, brokerToken, mt5Token, isLoading, signIn, signOut, refreshUser, setMt5Tokens],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
