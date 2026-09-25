import { apiConfig } from '../config';
import { ApiError } from '../errors';
import { mt5Session } from './session';

import { type HttpMethod } from '../broker/client';

export type { HttpMethod };

export type Mt5RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

function buildUrl(path: string, query?: Mt5RequestOptions['query']): string {
  const base = `${apiConfig.mt5.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

/**
 * Low-level MT5 REST request.
 */
export async function mt5Request<T>(path: string, options: Mt5RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const cancelFromCaller = () => controller.abort();
  options.signal?.addEventListener('abort', cancelFromCaller, { once: true });
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? apiConfig.timeoutMs,
  );

  const headers: Record<string, string> = {
    ...apiConfig.defaultHeaders,
    ...options.headers,
  };

  if (!options.skipAuth) {
    const token = mt5Session.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data: unknown = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        if (response.ok) {
          throw new ApiError('MT5 returned invalid JSON', {
            status: response.status,
            kind: 'parse',
            body: raw,
          });
        }
      }
    }

    if (!response.ok) {
      if (response.status === 401 && !options.skipAuth) {
        mt5Session.clear();
      }
      throw new ApiError(extractMessage(data, `MT5 request failed (${response.status})`), {
        status: response.status,
        body: data,
      });
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      if (options.signal?.aborted) {
        throw new ApiError('MT5 request cancelled', { kind: 'cancelled' });
      }
      throw new ApiError('MT5 request timed out', { kind: 'timeout' });
    }
    throw new ApiError('Unable to reach the MT5 server', {
      kind: 'network',
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', cancelFromCaller);
  }
}

function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const candidate = record.message ?? record.error ?? record.detail;
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  }
  return fallback;
}
