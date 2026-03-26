/**
 * Validation Helper Functions
 *
 * Provides reusable validation functions for use with @ValidateInput decorator.
 * All functions throw descriptive errors on validation failure.
 *
 * @example
 * ```typescript
 * import { ValidateInput } from './decorators/ValidateInput.js';
 * import { notEmpty, isPositive, isInRange } from './decorators/validators.js';
 *
 * export class UserService {
 *   @ValidateInput((value: string) => notEmpty(value, 'username'))
 *   public set username(value: string) {
 *     this._username = value;
 *   }
 *
 *   @ValidateInput((value: number) => isPositive(value, 'age'))
 *   public set age(value: number) {
 *     this._age = value;
 *   }
 * }
 * ```
 */

/**
 * Validate that a string is not empty
 * @param value - String value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if value is empty or whitespace-only
 */
export function notEmpty(value: string, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
}

/**
 * Validate that a number is positive (> 0)
 * @param value - Number value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if value is not positive
 */
export function isPositive(value: number, fieldName: string): void {
  if (typeof value !== 'number' || value <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
}

/**
 * Validate that a number is non-negative (>= 0)
 * @param value - Number value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if value is negative
 */
export function isNonNegative(value: number, fieldName: string): void {
  if (typeof value !== 'number' || value < 0) {
    throw new Error(`${fieldName} must be non-negative`);
  }
}

/**
 * Validate that a number is within a range
 * @param value - Number value to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 * @param fieldName - Name of the field for error message
 * @throws Error if value is outside range
 */
export function isInRange(value: number, min: number, max: number, fieldName: string): void {
  if (typeof value !== 'number' || value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
}

/**
 * Validate that a value is a valid enum member
 * @param value - Value to validate
 * @param enumType - Enum type object
 * @param fieldName - Name of the field for error message
 * @throws Error if value is not a valid enum member
 */
export function isValidEnum<T extends string | number>(value: T, enumType: any, fieldName: string): void {
  const validValues = Object.values(enumType);
  if (!validValues.includes(value)) {
    const validString = validValues.map((v: any) => String(v)).join(', ');
    throw new Error(`${fieldName} must be one of: ${validString}`);
  }
}

/**
 * Validate that an array is not empty
 * @param value - Array value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if array is empty or null/undefined
 */
export function isNotEmptyArray<T>(value: T[], fieldName: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty array`);
  }
}

/**
 * Validate that a string matches a regex pattern
 * @param value - String value to validate
 * @param pattern - Regular expression pattern
 * @param fieldName - Name of the field for error message
 * @throws Error if value doesn't match pattern
 */
export function matchesPattern(value: string, pattern: RegExp, fieldName: string): void {
  if (!value || !pattern.test(value)) {
    throw new Error(`${fieldName} must match pattern: ${pattern.source}`);
  }
}

/**
 * Validate that a value is not null or undefined
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if value is null or undefined
 */
export function isDefined<T>(value: T, fieldName: string): void {
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} is required`);
  }
}

/**
 * Validate that a string has a minimum length
 * @param value - String value to validate
 * @param minLength - Minimum length required
 * @param fieldName - Name of the field for error message
 * @throws Error if string is too short
 */
export function hasMinLength(value: string, minLength: number, fieldName: string): void {
  if (!value || value.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
}

/**
 * Validate that a string has a maximum length
 * @param value - String value to validate
 * @param maxLength - Maximum length allowed
 * @param fieldName - Name of the field for error message
 * @throws Error if string is too long
 */
export function hasMaxLength(value: string, maxLength: number, fieldName: string): void {
  if (value && value.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters`);
  }
}

/**
 * Validate that a string is a valid email format
 * @param value - String value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if email format is invalid
 */
export function isEmail(value: string, fieldName: string): void {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!value || !emailPattern.test(value)) {
    throw new Error(`${fieldName} must be a valid email address`);
  }
}

/**
 * Validate that a string is a valid URL format
 * @param value - String value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if URL format is invalid
 */
export function isUrl(value: string, fieldName: string): void {
  const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  if (!value || !urlPattern.test(value)) {
    throw new Error(`${fieldName} must be a valid URL`);
  }
}

/**
 * Validate that a value is a string type
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if value is not a string
 */
export function isString(value: unknown, fieldName: string): void {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
}

/**
 * Validate that a value is a number type
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if value is not a number
 */
export function isNumber(value: unknown, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${fieldName} must be a number`);
  }
}

/**
 * Validate that a value is a boolean type
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if value is not a boolean
 */
export function isBoolean(value: unknown, fieldName: string): void {
  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} must be a boolean`);
  }
}

/**
 * Validate that an object has required properties
 * @param obj - Object to validate
 * @param requiredKeys - Array of required property names
 * @param fieldName - Name of the field for error message
 * @throws Error if object is missing required properties
 */
export function hasRequiredKeys(obj: Record<string, unknown>, requiredKeys: string[], fieldName: string): void {
  if (!obj || typeof obj !== 'object') {
    throw new Error(`${fieldName} must be an object`);
  }

  const missingKeys = requiredKeys.filter((key) => !(key in obj));
  if (missingKeys.length > 0) {
    throw new Error(`${fieldName} is missing required properties: ${missingKeys.join(', ')}`);
  }
}

/**
 * Validate a custom condition
 * @param value - Value to validate
 * @param condition - Predicate function that returns true if valid
 * @param errorMessage - Error message to throw if condition is false
 * @throws Error if condition is false
 */
export function custom<T>(value: T, condition: (value: T) => boolean, errorMessage: string): void {
  if (!condition(value)) {
    throw new Error(errorMessage);
  }
}
