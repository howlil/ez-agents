/**
 * EZ Agents Test Error Utilities
 *
 * Reusable error type guards and assertion helpers for tests.
 */

/**
 * Type guard to check if an error has a code property.
 * @param err - Unknown error from catch block
 * @returns True if error is an Error with a code property
 */
export function isErrorWithCode(err: unknown): err is Error & { code: string } {
  return err instanceof Error && 'code' in err && typeof err.code === 'string';
}

/**
 * Type guard to check if an error has a message property.
 * @param err - Unknown error from catch block
 * @returns True if error is an Error with a message property
 */
export function isError(err: unknown): err is Error {
  return err instanceof Error;
}

/**
 * Assert that a value is an Error.
 * @param err - Unknown error from catch block
 * @throws If err is not an Error
 */
export function assertError(err: unknown): asserts err is Error {
  if (!(err instanceof Error)) {
    throw new Error(`Expected Error but got ${typeof err}`);
  }
}

/**
 * Assert that an error has a specific code.
 * @param err - Unknown error from catch block
 * @param expectedCode - Expected error code
 * @throws If err doesn't have the expected code
 */
export function assertErrorCode(err: unknown, expectedCode: string): asserts err is Error & { code: string } {
  if (!isErrorWithCode(err)) {
    throw new Error(`Expected error with code '${expectedCode}' but got ${err instanceof Error ? err.message : typeof err}`);
  }
  if (err.code !== expectedCode) {
    throw new Error(`Expected error code '${expectedCode}' but got '${err.code}'`);
  }
}

/**
 * Assert that an error message contains a specific substring.
 * @param err - Unknown error from catch block
 * @param substring - Expected substring in error message
 * @throws If err message doesn't contain the substring
 */
export function assertErrorMessageContains(err: unknown, substring: string): asserts err is Error {
  if (!isError(err)) {
    throw new Error(`Expected Error but got ${typeof err}`);
  }
  if (!err.message.includes(substring)) {
    throw new Error(`Expected error message to contain '${substring}' but got '${err.message}'`);
  }
}
