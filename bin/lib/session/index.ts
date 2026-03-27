/**
 * Session Management Module
 * 
 * Handles session state, chaining, import/export.
 */

export { SessionManager } from './session-manager.js';
export type { SessionState as SessionManagerState, SessionExport as SessionManagerExport } from './session-manager.js';

export { SessionChain } from './session-chain.js';
export type { SessionMetadata, SessionContext, SessionState as SessionChainState, Session, SessionManagerLike, ChainRepairResult } from './session-chain.js';

export * from './session-errors.js';

export { SessionExport } from './session-export.js';
export { SessionImport } from './session-import.js';
