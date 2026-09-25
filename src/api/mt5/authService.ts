import { apiConfig } from '../config';
import { MT5_ENDPOINTS } from './endpoints';
import { mt5Request } from './mt5Client';
import { mt5Session } from './session';
import type { Mt5LoginRequest, Mt5LoginResponse } from './types';

/**
 * MT5 authentication:
 * POST /api/v1/auth/client/login with login + password + managerApiKey,
 * then store returned access/refresh tokens in mt5Session.
 */
export const mt5AuthService = {
  async login(payload: Mt5LoginRequest): Promise<Mt5LoginResponse> {
    if (!payload.login || !payload.password) {
      throw new Error('MT5 login and password are required.');
    }
    if (!apiConfig.mt5.managerApiKey) {
      throw new Error('EXPO_PUBLIC_MT5_MANAGER_API_KEY is not set.');
    }

    const response = await mt5Request<Mt5LoginResponse>(MT5_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      skipAuth: true,
      body: {
        login: payload.login,
        password: payload.password,
        managerApiKey: apiConfig.mt5.managerApiKey,
        passwordType: payload.passwordType ?? 'Main',
      },
    });

    const accessToken =
      response.accessToken ||
      (response as { access_token?: string }).access_token;
    const refreshToken =
      response.refreshToken ||
      (response as { refresh_token?: string }).refresh_token ||
      null;

    if (!accessToken) {
      throw new Error('MT5 login succeeded but accessToken is missing.');
    }

    mt5Session.setTokens(accessToken, refreshToken);

    return {
      ...response,
      accessToken,
      refreshToken: refreshToken ?? undefined,
      login: payload.login,
    };
  },

  logout(): void {
    mt5Session.clear();
  },

  isAuthenticated(): boolean {
    return mt5Session.isAuthenticated();
  },
};
