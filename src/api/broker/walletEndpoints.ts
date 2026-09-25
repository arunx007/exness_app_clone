/**
 * CRM wallet + trading-account paths (succeed-crm-b).
 * Appended to `apiConfig.broker.baseUrl` (…/api).
 */
export const BROKER_WALLET_ENDPOINTS = {
  BALANCE: '/wallet/balance',
  TRANSACTIONS: '/wallet/transactions',
  SUMMARY: '/wallet/summary',
  TRANSFER: '/wallet/transfer',
} as const;

export const BROKER_TRADING_ACCOUNT_ENDPOINTS = {
  LIST: '/trading-accounts',
  AVAILABLE_GROUPS: '/trading-accounts/available-groups',
  CREATE: '/trading-accounts',
  CHANGE_PASSWORD: '/trading-accounts/change-password',
} as const;

export const BROKER_MT5_CLIENT_ENDPOINTS = {
  LOGIN: '/mt5-client/login',
  SESSION: '/mt5-client/session',
} as const;

export type BrokerMt5Group = {
  id: number | string;
  group_name: string;
  dedicated_name?: string | null;
  description?: string | null;
  is_demo?: boolean;
  globally_active?: boolean;
  has_entitlement?: boolean;
  minimumDeposit?: number | null;
  maximumDeposit?: number | null;
  spreadFrom?: string | null;
  maxLeverageDisplay?: string | null;
  commissions?: string | null;
  minLotSize?: string | null;
};

export type BrokerCreateTradingAccountRequest = {
  name: string;
  leverage: string | number;
  password: string;
  /** MT5 group_name from available-groups */
  group: string;
  investorPassword?: string;
  isDemo?: boolean;
  /** Required when isDemo — demo credit amount */
  demoTopUp?: number | string;
  city?: string;
  comment?: string;
};

export type BrokerWalletTransferType = 'wallet_to_mt5' | 'mt5_to_wallet' | 'mt5_to_mt5';

export type BrokerWalletTransferRequest = {
  type: BrokerWalletTransferType;
  amount: number | string;
  from_account?: string | number;
  to_account?: string | number;
};

export type BrokerWalletBalanceResponse = {
  balance: number | string;
  currency?: string;
  walletNumber?: string | null;
  ok?: boolean;
  success?: boolean;
  data?: unknown;
};

export type BrokerWalletSummaryResponse = {
  totalDeposits?: number | string;
  totalWithdrawals?: number | string;
  pendingCount?: number | string;
  data?: unknown;
};
