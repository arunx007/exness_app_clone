export const BROKER_AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/verify-otp',
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_RESET_OTP: '/auth/verify-reset-otp',
  RESET_PASSWORD: '/auth/reset-password',
  LOGOUT: '/auth/logout',
} as const;

export type BrokerRegisterRequest = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_code?: string;
  phone_number?: string;
  country?: string;
  referral_code?: string;
  ib_plan_token?: string;
};

export type BrokerRegisterResponse = {
  message?: string;
  email?: string;
  ok?: boolean;
  success?: boolean;
};

export type BrokerVerifyOtpRequest = {
  email: string;
  otp: string;
};

export type BrokerUser = {
  id: number | string;
  first_name?: string;
  last_name?: string;
  email: string;
  referral_code?: string;
  is_email_verified?: boolean;
  kyc_status?: string;
  phone_code?: string;
  phone_number?: string;
  country?: string;
  preferred_language?: string;
};

export type BrokerAuthTokens = {
  token: string;
  refreshToken?: string | null;
  refresh_token?: string | null;
};

export type BrokerVerifyOtpResponse = BrokerAuthTokens & {
  message?: string;
  redirectUrl?: string;
  user: BrokerUser;
  ok?: boolean;
  success?: boolean;
};

export type BrokerLoginRequest = {
  email: string;
  password: string;
};

export type BrokerLoginResponse = BrokerAuthTokens & {
  message?: string;
  redirectUrl?: string;
  user: BrokerUser;
  ok?: boolean;
  success?: boolean;
};

export type BrokerRefreshResponse = BrokerAuthTokens & {
  message?: string;
  ok?: boolean;
  success?: boolean;
};

/** Normalize access + refresh from CRM auth payloads. */
export function pickBrokerTokens(payload: BrokerAuthTokens | null | undefined): {
  token: string;
  refreshToken: string | null;
} {
  const token = String(payload?.token || '').trim();
  const refreshToken =
    String(payload?.refreshToken || payload?.refresh_token || '').trim() || null;
  return { token, refreshToken };
}
