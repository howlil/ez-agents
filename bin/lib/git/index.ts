/**
 * Git Operations Module
 */

export { isGitRepo, getGitStatus, getGitDiff, gitAdd, gitCommit, getCurrentBranch, createBranch } from './git-utils.js';
export type { GitStatus, GitDiffResult, GitCommitOptions } from './git-utils.js';

export { GitWorkflowEngine } from './git-workflow-engine.js';

// Git errors
export { 
  GitWorkflowError, 
  BranchExistsError, 
  BranchNotFoundError, 
  MergeConflictError, 
  ValidationFailedError, 
  type GitErrorOptions, 
  type GitErrorData 
} from './git-errors.js';
