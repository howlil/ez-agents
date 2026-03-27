/**
 * Executor Module
 *
 * Handles process execution, retries, and audit trails.
 */

export { spawnProcess, executeProcess } from './process-executor.js';
export type { ProcessResult } from './process-executor.js';

export { execWithTimeout } from './timeout-exec.js';

export { safeExec } from './safe-exec.js';

export { auditExec } from './audit-exec.js';
export type { AuditEntry, AuditExecOptions } from './audit-exec.js';

export { retry } from './retry.js';
export type { RetryOptions, RetryableError } from './retry.js';
