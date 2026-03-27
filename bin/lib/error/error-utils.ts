/**
 * Error Type Guards and Utilities
 *
 * Provides type-safe error handling utilities for the core library.
 */

/**
 * Type guard to narrow unknown to Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error || (
    typeof value === 'object' &&
    value !== null &&
    'message' in value
  );
}

/**
 * Type guard to narrow unknown to Error with code
 */
export function isErrorWithCode(value: unknown): value is Error & { code: string } {
  return isError(value) && 'code' in value && typeof value.code === 'string';
}

/**
 * Type guard to narrow unknown to NodeJS.ErrnoException
 */
export function isErrnoException(value: unknown): value is NodeJS.ErrnoException {
  return isError(value) && 'code' in value;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(err: unknown): string {
  if (isError(err)) {
    return err.message;
  }
  return String(err);
}

/**
 * Safely extract error code from unknown error
 */
export function getErrorCode(err: unknown): string | null {
  if (isErrorWithCode(err)) {
    return err.code;
  }
  return null;
}
