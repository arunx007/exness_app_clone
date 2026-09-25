import { apiConfig } from '../config';
import { ApiError } from '../errors';
import { brokerSession } from './session';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type BrokerRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  /**
   * When true, logs full URL, request, and response.
   * Passwords / tokens are redacted in the console.
   */
  log?: boolean;
};

const SENSITIVE_KEYS = new Set([
  'password',
  'newPassword',
  'oldPassword',
  'token',
  'accessToken',
  'refreshToken',
  'refresh_token',
  'otp',
  'authorization',
]);

function buildUrl(path: string, query?: BrokerRequestOptions['query']): string {
  const base = `${apiConfig.broker.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const queryString = params.toString();
  return queryString ? `${base}?${queryString}` : base;
}

function messageFromBody(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const row = data as Record<string, unknown>;
  const msg = row.message ?? row.error;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

function codeFromBody(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const code = (data as { code?: unknown }).code;
  return typeof code === 'string' && code.trim() ? code : undefined;
}

function redactValue(key: string, value: unknown): unknown {
  if (!SENSITIVE_KEYS.has(key.toLowerCase()) && !SENSITIVE_KEYS.has(key)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return redactBody(value);
    }
    return value;
  }
  if (typeof value === 'string') {
    return value.length ? `[redacted length=${value.length}]` : '[empty]';
  }
  return '[redacted]';
}

function redactBody(body: unknown): unknown {
  if (body == null || typeof body !== 'object') return body;
  if (Array.isArray(body)) return body.map((item) => redactBody(item));
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    out[key] = redactValue(key, value);
  }
  return out;
}

function shouldLog(_path: string, options: BrokerRequestOptions): boolean {
  return Boolean(options.log);
}

/**
 * CRM / broker REST helper (`EXPO_PUBLIC_BROKER_API_BASE_URL`).
 * Separate from MT5 trading traffic.
 */
export async function brokerRequest<T>(
  path: string,
  options: BrokerRequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const cancelFromCaller = () => controller.abort();
  options.signal?.addEventListener('abort', cancelFromCaller, { once: true });
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? apiConfig.timeoutMs,
  );

  const method = options.method ?? 'GET';
  const url = buildUrl(path, options.query);
  const headers: Record<string, string> = {
    ...apiConfig.defaultHeaders,
    ...options.headers,
  };

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  // Let fetch set multipart boundary — do not force JSON Content-Type.
  if (isFormData) {
    delete headers['Content-Type'];
  }

  if (!options.skipAuth) {
    const token = brokerSession.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const enableLog = shouldLog(path, options);
  if (enableLog) {
    console.log('[BrokerAPI] REQUEST', {
      method,
      url,
      baseUrl: apiConfig.broker.baseUrl,
      path,
      skipAuth: Boolean(options.skipAuth),
      hasBearer: Boolean(headers.Authorization),
      body: isFormData ? '[FormData]' : redactBody(options.body),
    });
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body:
        options.body === undefined
          ? undefined
          : isFormData
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const raw = await response.text();
    let data: unknown = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        if (enableLog) {
          console.log('[BrokerAPI] RESPONSE (non-JSON)', {
            method,
            url,
            status: response.status,
            ok: response.ok,
            raw,
          });
        }
        if (response.ok) {
          throw new ApiError('Broker API returned invalid JSON', {
            status: response.status,
            kind: 'parse',
            body: raw,
          });
        }
      }
    }

    if (enableLog) {
      console.log('[BrokerAPI] RESPONSE', {
        method,
        url,
        status: response.status,
        ok: response.ok,
        body: redactBody(data ?? raw),
      });
    }

    if (!response.ok) {
      if (response.status === 401 && !options.skipAuth) {
        brokerSession.expire();
      }
      throw new ApiError(messageFromBody(data, `Request failed (${response.status})`), {
        status: response.status,
        body: data ?? raw,
        code: codeFromBody(data),
      });
    }

    return data as T;
  } catch (error) {
    if (enableLog) {
      console.log('[BrokerAPI] ERROR', {
        method,
        url,
        error:
          error instanceof ApiError
            ? { message: error.message, status: error.status, kind: error.kind, body: redactBody(error.body) }
            : error instanceof Error
              ? { name: error.name, message: error.message }
              : error,
      });
    }
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out', { kind: 'timeout', cause: error });
    }
    throw new ApiError('Network request failed', { kind: 'network', cause: error });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', cancelFromCaller);
  }
}
