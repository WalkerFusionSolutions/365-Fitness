import { PostgrestError } from '@supabase/supabase-js';

export class AppServiceError extends Error {
  userMessage: string;
  cause?: unknown;

  constructor(userMessage: string, cause?: unknown) {
    super(userMessage);
    this.name = 'AppServiceError';
    this.userMessage = userMessage;
    this.cause = cause;
  }
}

export function toServiceError(
  error: unknown,
  userMessage = 'Something went wrong. Please try again.'
) {
  console.error(userMessage, error);
  return new AppServiceError(
    isJwtIssuedAtFutureError(error)
      ? 'Your session token is being rejected because the device clock appears out of sync. Set date and time to automatic, then sign in again.'
      : userMessage,
    error
  );
}

export function throwIfSupabaseError(
  error: PostgrestError | Error | null,
  userMessage: string
) {
  if (error) {
    throw toServiceError(error, userMessage);
  }
}

export function isJwtIssuedAtFutureError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeError = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    cause?: unknown;
  };

  const code = typeof maybeError.code === 'string' ? maybeError.code : '';
  const text = [
    maybeError.message,
    maybeError.details,
    maybeError.hint,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  return (
    code === 'PGRST303' ||
    text.includes('jwt issued at future') ||
    isJwtIssuedAtFutureError(maybeError.cause)
  );
}
