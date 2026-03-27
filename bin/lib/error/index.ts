/**
 * Error Handling Module
 */

export { ErrorCache } from './error-cache.js';

export { 
  getErrorCode as getErrorCodeFromRegistry, 
  getAllCodes, 
  getSeverity, 
  getAllSeverities, 
  lookupByCode, 
  isValidCode 
} from './error-registry.js';
export type { ErrorCodeDefinition, ErrorCodeLookupResult, ErrorCategory, ERROR_CODES, SEVERITY } from './error-registry.js';

export { isError, isErrorWithCode, isErrnoException, getErrorMessage, getErrorCode } from './error-utils.js';
