/**
 * Logger Module
 */

export { Logger, defaultLogger, adapterLogger, createTraceContext } from './logger.js';
export type { TraceContext } from './logger.js';
export { LogRotation } from './log-rotation.js';
export { LockLogger } from './lock-logger.js';

// Default export
import { Logger } from './logger.js';
export default Logger;
