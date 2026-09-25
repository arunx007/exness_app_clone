export const MT5_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/client/login',
  },
  TRADING: {
    CHANGE_PASSWORD: '/api/v1/client/trading/change-password',
    HISTORY: '/api/v1/client/trading/history',
    POSITION: '/api/v1/client/trading/position',
    POSITIONS: '/api/v1/client/trading/positions',
    ORDER: '/api/v1/client/trading/order',
    ORDERS: '/api/v1/client/trading/orders',
    MARKET_ORDER: '/api/v1/client/trading/market-order',
    PROFILE: '/api/v1/client/trading/profile',
    SYMBOLS: '/api/v1/client/trading/symbols',
    TRANSFER: '/api/v1/client/trading/transfer',
    WITHDRAW: '/api/v1/client/trading/withdraw',
    DEPOSIT: '/api/v1/client/trading/deposit',
  },
  NOTIFICATIONS: {
    REGISTER_TOKEN: '/api/v1/notifications/register-token',
  },
  HUBS: {
    ACCOUNT: '/hubs/account',
    MARKET: '/hubs/market',
    TRADING: '/hubs/trading',
  },
} as const;
