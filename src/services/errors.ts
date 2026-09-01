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
  return new AppServiceError(userMessage, error);
}

export function throwIfSupabaseError(
  error: PostgrestError | Error | null,
  userMessage: string
) {
  if (error) {
    throw toServiceError(error, userMessage);
  }
}
