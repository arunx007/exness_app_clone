import { brokerRequest } from './client';
import {
  BROKER_AUTH_ENDPOINTS,
  pickBrokerTokens,
  type BrokerLoginRequest,
  type BrokerLoginResponse,
  type BrokerRefreshResponse,
  type BrokerRegisterRequest,
  type BrokerRegisterResponse,
  type BrokerUser,
  type BrokerVerifyOtpRequest,
  type BrokerVerifyOtpResponse,
} from './endpoints';
import { brokerSession } from './session';
import {
  MIN_AUTH_PASSWORD_LENGTH,
  normalizeEmail,
  validateLoginCredentials,
  validateOtpCode,
  validateSignupCredentials,
} from '../../utils/authValidation';
import { ApiError } from '../errors';

function assertClient(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new ApiError(message, { status: 400, kind: 'client' });
  }
}

/**
 * CRM auth — succeed-crm-b `/api/auth/*`
 *
 * Flow:
 * 1) register → OTP emailed
 * 2) verify-otp → access token + refresh token
 * 3) login → access token + refresh token
 */
export const brokerAuthService = {
  async register(payload: BrokerRegisterRequest): Promise<BrokerRegisterResponse> {
    const validationError = validateSignupCredentials({
      firstName: payload.first_name,
      lastName: payload.last_name,
      email: payload.email,
      password: payload.password,
    });
    assertClient(!validationError, 'Missing or invalid registration fields');
    assertClient(
      payload.password.length >= MIN_AUTH_PASSWORD_LENGTH,
      `Password must be at least ${MIN_AUTH_PASSWORD_LENGTH} characters`,
    );

    return brokerRequest<BrokerRegisterResponse>(BROKER_AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      skipAuth: true,
      body: {
        first_name: payload.first_name.trim(),
        last_name: payload.last_name.trim(),
        email: normalizeEmail(payload.email),
        password: payload.password,
        phone_code: payload.phone_code?.trim() || undefined,
        phone_number: payload.phone_number?.trim() || undefined,
        country: payload.country?.trim() || undefined,
        referral_code: payload.referral_code?.trim() || undefined,
        ib_plan_token: payload.ib_plan_token?.trim() || undefined,
      },
    });
  },

  async verifyOtp(payload: BrokerVerifyOtpRequest): Promise<BrokerVerifyOtpResponse> {
    const email = normalizeEmail(payload.email);
    assertClient(Boolean(email), 'Email is required');
    assertClient(!validateOtpCode(payload.otp), 'Enter a valid verification code');

    const response = await brokerRequest<BrokerVerifyOtpResponse>(
      BROKER_AUTH_ENDPOINTS.VERIFY_OTP,
      {
        method: 'POST',
        skipAuth: true,
        body: {
          email,
          otp: String(payload.otp || '').replace(/\D/g, ''),
        },
      },
    );

    const { token, refreshToken } = pickBrokerTokens(response);
    if (token) {
      brokerSession.setTokens(token, refreshToken);
    }

    return response;
  },

  async login(payload: BrokerLoginRequest): Promise<BrokerLoginResponse> {
    const validationError = validateLoginCredentials(payload.email, payload.password);
    assertClient(!validationError, 'Email and password are required');

    const response = await brokerRequest<BrokerLoginResponse>(BROKER_AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      skipAuth: true,
      body: {
        email: normalizeEmail(payload.email),
        password: payload.password,
      },
    });

    const { token, refreshToken } = pickBrokerTokens(response);
    if (token) {
      brokerSession.setTokens(token, refreshToken);
    }

    return response;
  },

  async refresh(): Promise<BrokerRefreshResponse> {
    const refreshToken = brokerSession.getRefreshToken();
    assertClient(Boolean(refreshToken), 'No refresh token');

    const response = await brokerRequest<BrokerRefreshResponse>(BROKER_AUTH_ENDPOINTS.REFRESH, {
      method: 'POST',
      skipAuth: true,
      body: { refreshToken },
    });

    const next = pickBrokerTokens(response);
    if (next.token) {
      brokerSession.setTokens(next.token, next.refreshToken ?? refreshToken);
    }

    return response;
  },

  /** Forgot password — sends 6-digit OTP to user email */
  async forgotPassword(email: string): Promise<{ message?: string; success?: boolean }> {
    const normEmail = normalizeEmail(email);
    assertClient(Boolean(normEmail), 'Email is required');
    return brokerRequest(BROKER_AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      skipAuth: true,
      body: { email: normEmail },
    });
  },

  /** Verify forgot password OTP — returns resetToken */
  async verifyResetOtp(email: string, otp: string): Promise<{ message?: string; resetToken: string; success?: boolean }> {
    const normEmail = normalizeEmail(email);
    const cleanOtp = String(otp || '').replace(/\D/g, '');
    assertClient(Boolean(normEmail), 'Email is required');
    assertClient(cleanOtp.length === 6, 'Enter a valid 6-digit code');
    return brokerRequest(BROKER_AUTH_ENDPOINTS.VERIFY_RESET_OTP, {
      method: 'POST',
      skipAuth: true,
      body: { email: normEmail, otp: cleanOtp },
    });
  },

  /** Reset password with resetToken and newPassword */
  async resetPassword(email: string, resetToken: string, newPassword: string): Promise<{ message?: string; success?: boolean }> {
    const normEmail = normalizeEmail(email);
    assertClient(Boolean(normEmail), 'Email is required');
    assertClient(Boolean(resetToken), 'Reset token is required');
    assertClient(
      newPassword.length >= MIN_AUTH_PASSWORD_LENGTH,
      `Password must be at least ${MIN_AUTH_PASSWORD_LENGTH} characters`,
    );
    return brokerRequest(BROKER_AUTH_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      skipAuth: true,
      body: { email: normEmail, resetToken, newPassword },
    });
  },

  /** Current user profile (`GET /auth/me`) — includes `kyc_status`. */
  async me(): Promise<BrokerUser> {
    return brokerRequest<BrokerUser>(BROKER_AUTH_ENDPOINTS.ME, { method: 'GET' });
  },

  logout(): void {
    brokerSession.clear();
  },
};
