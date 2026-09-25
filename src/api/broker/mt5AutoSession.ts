import { mt5Session } from '../mt5/session';
import { brokerMt5ClientService, type BrokerMt5SessionResponse } from './walletService';

function pickSessionTokens(payload: BrokerMt5SessionResponse | null | undefined): {
  accessToken: string;
  refreshToken: string | null;
} {
  const accessToken = String(payload?.accessToken || '').trim();
  const refreshToken = String(payload?.refreshToken || '').trim() || null;
  if (!accessToken) {
    throw new Error('MT5 access token is missing from session response.');
  }
  return { accessToken, refreshToken };
}

/** Start an MT5 client session via CRM and persist tokens. Throws on failure. */
export async function startMt5SessionFromCrm(accountNumber: string | number): Promise<void> {
  const login = String(accountNumber || '').trim();
  if (!login || login === '—') {
    throw new Error('Trading account number is required.');
  }
  const asNumber = Number(login);
  if (!Number.isFinite(asNumber) || asNumber <= 0) {
    throw new Error(`Invalid MT5 login: ${login}`);
  }
  const response = await brokerMt5ClientService.startSession(login);
  const { accessToken, refreshToken } = pickSessionTokens(response);
  mt5Session.setTokens(accessToken, refreshToken);
}

/**
 * Best-effort auto-session. Returns true when mt5Session has a fresh access token.
 * Leaves tokens unchanged on failure so the UI can fall back to password login.
 */
export async function ensureMt5Session(accountNumber: string | number): Promise<boolean> {
  try {
    await startMt5SessionFromCrm(accountNumber);
    return mt5Session.isAuthenticated();
  } catch {
    return false;
  }
}
