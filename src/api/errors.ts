/**
 * Shared API error types.
 *
 * All network layers throw one of these so callers can handle failures
 * uniformly (`instanceof ApiError`) instead of guessing at fetch internals.
 */

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'server'
  | 'client'
  | 'parse'
  | 'unknown';

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly body?: unknown;
  readonly code?: string;

  constructor(
    message: string,
    options: {
      status?: number;
      kind?: ApiErrorKind;
      body?: unknown;
      cause?: unknown;
      code?: string;
    } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.kind = options.kind ?? kindFromStatus(options.status ?? 0);
    this.body = options.body;
    this.code = options.code ?? codeFromBody(options.body);
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }

  /** True for auth failures the UI should treat as "session expired". */
  get isAuthError(): boolean {
    return this.kind === 'unauthorized' || this.kind === 'forbidden';
  }

  get needsEmailVerification(): boolean {
    return this.code === 'EMAIL_NOT_VERIFIED';
  }
}

function codeFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const code = (body as { code?: unknown }).code;
  return typeof code === 'string' && code.trim() ? code : undefined;
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status >= 500) return 'server';
  if (status >= 400) return 'client';
  return 'unknown';
}

/** Best-effort human-readable message from an unknown thrown value. */
export function toErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

/** Extract CRM error `code` when present. */
export function toErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.code;
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}
