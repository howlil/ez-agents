/**
 * Type Utility Functions
 *
 * Provides reusable type guards and utilities for type-safe code.
 */

/**
 * Type guard to check if value is defined (not undefined)
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Type guard to check if value is non-null
 */
export function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Type guard to check if value is defined and non-null
 */
export function isDefinedAndNonNull<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Assert that value is defined, throwing an error if not
 */
export function assertDefined<T>(value: T | undefined, message?: string): asserts value is T {
  if (value === undefined) {
    throw new Error(message ?? 'Value is undefined');
  }
}

/**
 * Assert that value is non-null, throwing an error if null
 */
export function assertNotNull<T>(value: T | null, message?: string): asserts value is T {
  if (value === null) {
    throw new Error(message ?? 'Value is null');
  }
}
