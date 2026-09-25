/**
 * CRM session token manager with native secure persistence.
 *
 * Persists the broker access & refresh tokens via expo-secure-store.
 * Reads are synchronous from in-memory cache for fast header injection.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type BrokerSessionTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

type SessionListener = (tokens: BrokerSessionTokens) => void;
type ExpiryListener = () => void;

const STORAGE_KEY = 'exness-clone.broker-session.v1';

let tokens: BrokerSessionTokens = {
  accessToken: null,
  refreshToken: null,
};

let mutationVersion = 0;
const listeners = new Set<SessionListener>();
const expiryListeners = new Set<ExpiryListener>();

function publish(next: BrokerSessionTokens): void {
  tokens = next;
  for (const listener of listeners) {
    listener({ ...tokens });
  }
}

async function persist(next: BrokerSessionTokens): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (!next.accessToken) {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('[brokerSession] Failed to persist session:', err);
  }
}

export const brokerSession = {
  getToken(): string | null {
    return tokens.accessToken;
  },

  getRefreshToken(): string | null {
    return tokens.refreshToken;
  },

  setToken(token: string | null): void {
    brokerSession.setTokens(token, tokens.refreshToken);
  },

  setTokens(accessToken: string | null, refreshToken: string | null = null): void {
    mutationVersion += 1;
    const next: BrokerSessionTokens = {
      accessToken: accessToken?.trim() || null,
      refreshToken: refreshToken?.trim() || null,
    };
    publish(next);
    void persist(next).catch(() => undefined);
  },

  clear(): void {
    brokerSession.setTokens(null, null);
  },

  expire(): void {
    brokerSession.clear();
    for (const listener of expiryListeners) {
      try {
        listener();
      } catch (err) {
        console.warn('[brokerSession] Error in expiry listener:', err);
      }
    }
  },

  onSessionExpired(listener: ExpiryListener): () => void {
    expiryListeners.add(listener);
    return () => expiryListeners.delete(listener);
  },

  isAuthenticated(): boolean {
    return tokens.accessToken !== null;
  },

  /** Subscribe to session token changes */
  subscribe(listener: SessionListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Restore stored session tokens from SecureStore on startup */
  async restore(): Promise<BrokerSessionTokens> {
    if (Platform.OS === 'web') return tokens;
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        const restored = JSON.parse(stored) as Partial<BrokerSessionTokens>;
        if (typeof restored.accessToken === 'string' && restored.accessToken.trim()) {
          const next: BrokerSessionTokens = {
            accessToken: restored.accessToken.trim(),
            refreshToken:
              typeof restored.refreshToken === 'string'
                ? restored.refreshToken.trim() || null
                : null,
          };
          publish(next);
          return next;
        }
      }
    } catch (err) {
      console.warn('[brokerSession] Failed to restore session:', err);
    }
    return tokens;
  },
};

// Immediate background restore for fast startup
if (Platform.OS !== 'web') {
  void brokerSession.restore();
}
