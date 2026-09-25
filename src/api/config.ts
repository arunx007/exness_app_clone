/**
 * Central API configuration.
 *
 * All hosts live here — never hardcode URLs in screens/services.
 * Values come from `EXPO_PUBLIC_*` env vars (see `.env.example`).
 *
 * Two backends:
 * - MT5 trading  → `mt5.*`   (REST + SignalR + quote WS)
 * - CRM / broker → `broker.*` (auth, wallet, KYC, trading-accounts DB)
 */

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

/** Ensure CRM base always ends with `/api` (routes are mounted under `/api/...`). */
function normalizeBrokerBaseUrl(raw: string): string {
  const base = trimTrailingSlash(raw);
  return base.endsWith('/api') ? base : `${base}/api`;
}

export const apiConfig = {
  /** MT5 trading API (REST + SignalR hubs). */
  mt5: {
    baseUrl: trimTrailingSlash(
      process.env.EXPO_PUBLIC_MT5_BASE_URL &&
      !process.env.EXPO_PUBLIC_MT5_BASE_URL.includes('thefincrm.net')
        ? process.env.EXPO_PUBLIC_MT5_BASE_URL
        : 'https://mtapi.broker-bros.com',
    ),
    /** Raw WebSocket for live quotes + chart candles. */
    socketUrl:
      process.env.EXPO_PUBLIC_MT5_WS_URL &&
      !process.env.EXPO_PUBLIC_MT5_WS_URL.includes('metaapi.zuperior.com') &&
      !process.env.EXPO_PUBLIC_MT5_WS_URL.includes('thefincrm.net')
        ? process.env.EXPO_PUBLIC_MT5_WS_URL
        : 'wss://chart.broker-bros.com/ws',
    /** Manager key required by MT5 client login. */
    managerApiKey:
      process.env.EXPO_PUBLIC_MT5_MANAGER_API_KEY &&
      !process.env.EXPO_PUBLIC_MT5_MANAGER_API_KEY.startsWith('TZos')
        ? process.env.EXPO_PUBLIC_MT5_MANAGER_API_KEY
        : 'b--Bj9CQStcOBdPb43FXoIAtN4za2N0kqHHXENFmZLjmEa6gxE-2KXe8mzcRUnqW',
    managerId: process.env.EXPO_PUBLIC_MT5_MANAGER_ID ?? '',
  },

  /**
   * Broker / CRM backend (succeed-crm-b).
   * Live: https://succeed-crm-b.onrender.com/api
   */
  broker: {
    baseUrl: normalizeBrokerBaseUrl(
      process.env.EXPO_PUBLIC_BROKER_API_BASE_URL ??
        'https://succeed-crm-b.onrender.com/api',
    ),
  },

  timeoutMs: 15_000,
  defaultHeaders: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  } as Record<string, string>,
} as const;

/** Convenience alias for the chart/quote socket URL. */
export const chartSocketUrl = apiConfig.mt5.socketUrl;
