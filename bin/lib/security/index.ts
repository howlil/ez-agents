/**
 * Security Module
 */

export { 
  SecurityOpsError, 
  SecurityProviderError, 
  SecurityComplianceError, 
  SecurityAuditError, 
  type SecurityErrorContext, 
  type SecurityErrorData 
} from './security-errors.js';

export { authenticate, authorize, type AuthResult, type AuthOptions } from './auth.js';
