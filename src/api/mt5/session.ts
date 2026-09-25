/**
 * MT5 session token holder with native secure persistence.
 *
 * The MT5 REST client and WebSocket/SignalR hubs read the MT5 access token from here.
 * Broker CRM authentication remains in broker/session.ts;
 * replacing this MT5 session never replaces the CRM login.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type Mt5SessionTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

type SessionListener = (tokens: Mt5SessionTokens) => void;

const STORAGE_KEY = 'exness-clone.mt5-session.v1';

let tokens: Mt5SessionTokens = { accessToken: null, refreshToken: null };
let mutationVersion = 0;
const listeners = new Set<SessionListener>();

function publish(next: Mt5SessionTokens): void {
  tokens = next;
  for (const listener of listeners) listener({ ...tokens });
}

async function persist(next: Mt5SessionTokens): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (!next.accessToken) {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('[mt5Session] Failed to persist MT5 session:', err);
  }
}

if (Platform.OS !== 'web') {
  const restoreVersion = mutationVersion;
  void SecureStore.getItemAsync(STORAGE_KEY)
    .then((stored) => {
      if (!stored || mutationVersion !== restoreVersion) return;
      const restored = JSON.parse(stored) as Partial<Mt5SessionTokens>;
      if (typeof restored.accessToken !== 'string' || !restored.accessToken.trim()) return;
      publish({
        accessToken: restored.accessToken.trim(),
        refreshToken:
          typeof restored.refreshToken === 'string'
            ? restored.refreshToken.trim() || null
            : null,
      });
    })
    .catch(() => undefined);
}

export const mt5Session = {
  getToken(): string | null {
    return tokens.accessToken;
  },

  getRefreshToken(): string | null {
    return tokens.refreshToken;
  },

  setToken(token: string | null): void {
    mt5Session.setTokens(token, tokens.refreshToken);
  },

  setTokens(accessToken: string | null, refreshToken: string | null = null): void {
    mutationVersion += 1;
    const next = {
      accessToken: accessToken?.trim() || null,
      refreshToken: refreshToken?.trim() || null,
    };
    publish(next);
    void persist(next).catch(() => undefined);
  },

  clear(): void {
    mt5Session.setTokens(null, null);
  },

  isAuthenticated(): boolean {
    return tokens.accessToken !== null;
  },

  /** Subscribe to token changes. Returns an unsubscribe function. */
  subscribe(listener: SessionListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
