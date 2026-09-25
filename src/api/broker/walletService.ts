import { brokerRequest } from './client';
import {
  BROKER_MT5_CLIENT_ENDPOINTS,
  BROKER_TRADING_ACCOUNT_ENDPOINTS,
  BROKER_WALLET_ENDPOINTS,
  type BrokerCreateTradingAccountRequest,
  type BrokerMt5Group,
  type BrokerWalletBalanceResponse,
  type BrokerWalletSummaryResponse,
  type BrokerWalletTransferRequest,
} from './walletEndpoints';

export type BrokerTradingAccount = {
  id?: number | string;
  account_number: string | number;
  platform?: string;
  account_type?: string;
  leverage?: number | string;
  name?: string | null;
  currency?: string | null;
  trading_server?: string | null;
  balance?: number | string;
  equity?: number | string;
  credit?: number | string;
  free_margin?: number | string;
  is_demo?: boolean;
  account_status?: string | null;
  mt5_group?: string | null;
  operationLabel?: string | null;
};

export type BrokerWalletTransaction = {
  id: number | string;
  unique_id?: string;
  amount: number | string;
  type: string;
  status: string;
  description?: string | null;
  reference_id?: string | null;
  created_at?: string;
  deposit_to?: string | null;
  withdrawal_from?: string | null;
};

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function unwrapObject<T extends Record<string, unknown>>(payload: unknown): T {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {} as T;
  }
  const row = payload as Record<string, unknown>;
  if (row.data && typeof row.data === 'object' && !Array.isArray(row.data)) {
    return { ...row, ...(row.data as Record<string, unknown>) } as T;
  }
  return row as T;
}

/**
 * CRM wallet APIs — succeed-crm-b `/api/wallet/*`
 */
export const brokerWalletService = {
  async getBalance(): Promise<{
    balance: number;
    currency: string;
    walletNumber: string | null;
  }> {
    const raw = await brokerRequest<BrokerWalletBalanceResponse>(
      BROKER_WALLET_ENDPOINTS.BALANCE,
      { method: 'GET' },
    );
    const data = unwrapObject<BrokerWalletBalanceResponse>(raw);
    return {
      balance: asNumber(data.balance),
      currency: String(data.currency || 'USD'),
      walletNumber:
        data.walletNumber != null && String(data.walletNumber).trim()
          ? String(data.walletNumber)
          : null,
    };
  },

  async getTransactions(): Promise<BrokerWalletTransaction[]> {
    const raw = await brokerRequest<BrokerWalletTransaction[] | { data?: BrokerWalletTransaction[] }>(
      BROKER_WALLET_ENDPOINTS.TRANSACTIONS,
      { method: 'GET' },
    );
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
      return (raw as { data: BrokerWalletTransaction[] }).data;
    }
    return [];
  },

  async getSummary(): Promise<{
    totalDeposits: number;
    totalWithdrawals: number;
    pendingCount: number;
  }> {
    const raw = await brokerRequest<BrokerWalletSummaryResponse>(BROKER_WALLET_ENDPOINTS.SUMMARY, {
      method: 'GET',
    });
    const data = unwrapObject<BrokerWalletSummaryResponse>(raw);
    return {
      totalDeposits: asNumber(data.totalDeposits),
      totalWithdrawals: asNumber(data.totalWithdrawals),
      pendingCount: asNumber(data.pendingCount),
    };
  },

  async transfer(payload: BrokerWalletTransferRequest): Promise<{ message?: string }> {
    return brokerRequest(BROKER_WALLET_ENDPOINTS.TRANSFER, {
      method: 'POST',
      body: {
        type: payload.type,
        amount: payload.amount,
        from_account: payload.from_account,
        to_account: payload.to_account,
      },
    });
  },
};

/**
 * CRM trading accounts — succeed-crm-b `/api/trading-accounts`
 */
export const brokerTradingAccountsService = {
  async list(options?: { live?: boolean }): Promise<BrokerTradingAccount[]> {
    const raw = await brokerRequest<
      BrokerTradingAccount[] | { data?: BrokerTradingAccount[] }
    >(BROKER_TRADING_ACCOUNT_ENDPOINTS.LIST, {
      method: 'GET',
      query: options?.live ? { live: '1' } : undefined,
    });
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
      return (raw as { data: BrokerTradingAccount[] }).data;
    }
    return [];
  },

  /**
   * Groups the user can open (`GET /trading-accounts/available-groups`).
   */
  async listAvailableGroups(type?: 'demo' | 'live' | 'real'): Promise<BrokerMt5Group[]> {
    const raw = await brokerRequest<{ ok?: boolean; items?: BrokerMt5Group[] }>(
      BROKER_TRADING_ACCOUNT_ENDPOINTS.AVAILABLE_GROUPS,
      {
        method: 'GET',
        query: type ? { type } : undefined,
      },
    );
    if (raw && typeof raw === 'object' && Array.isArray(raw.items)) {
      return raw.items;
    }
    return [];
  },

  /** Open MT5 account (`POST /trading-accounts`) */
  async create(payload: BrokerCreateTradingAccountRequest): Promise<BrokerTradingAccount> {
    return brokerRequest<BrokerTradingAccount>(BROKER_TRADING_ACCOUNT_ENDPOINTS.CREATE, {
      method: 'POST',
      body: {
        name: payload.name.trim(),
        leverage: payload.leverage,
        password: payload.password,
        group: payload.group,
        investorPassword: payload.investorPassword,
        isDemo: Boolean(payload.isDemo),
        demoTopUp: payload.demoTopUp,
        city: payload.city,
        comment: payload.comment,
      },
    });
  },
};

export type BrokerMt5SessionResponse = {
  success: boolean;
  account?: unknown;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number;
};

function normalizeMt5SessionResponse(raw: unknown): BrokerMt5SessionResponse {
  const data = unwrapObject<Record<string, unknown>>(raw);
  const accessToken = String(
    data.accessToken ?? data.access_token ?? data.token ?? '',
  ).trim();
  const refreshToken =
    String(data.refreshToken ?? data.refresh_token ?? '').trim() || null;
  const expiresRaw = data.expiresIn ?? data.expires_in;
  const expiresIn = expiresRaw != null ? Number(expiresRaw) : undefined;

  return {
    success: data.success !== false,
    account: data.account,
    accessToken,
    refreshToken,
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : undefined,
  };
}

export const brokerMt5ClientService = {
  /** Authenticate a CRM-owned MT5 account with its main trading password. */
  async login(accountNumber: string, password: string): Promise<BrokerMt5SessionResponse> {
    const raw = await brokerRequest<unknown>(BROKER_MT5_CLIENT_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: { accountNumber, password },
    });
    const normalized = normalizeMt5SessionResponse(raw);
    if (!normalized.accessToken) {
      throw new Error('MT5 login succeeded but accessToken is missing.');
    }
    return normalized;
  },

  /** Authenticate a CRM-owned MT5 account using its encrypted server-side password. */
  async startSession(accountNumber: string): Promise<BrokerMt5SessionResponse> {
    const raw = await brokerRequest<unknown>(BROKER_MT5_CLIENT_ENDPOINTS.SESSION, {
      method: 'POST',
      body: { accountNumber },
    });
    const normalized = normalizeMt5SessionResponse(raw);
    if (!normalized.accessToken) {
      throw new Error('MT5 session succeeded but accessToken is missing.');
    }
    return normalized;
  },
};
