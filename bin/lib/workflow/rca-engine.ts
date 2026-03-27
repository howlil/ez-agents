/**
 * RCA Engine - Root Cause Analysis
 * 
 * Helps categorize and suggest fixes for common errors.
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  CONFIGURATION = 'CONFIGURATION',
  PERMISSIONS = 'PERMISSIONS',
  SYNTAX = 'SYNTAX',
  LOGIC = 'LOGIC',
  RESOURCE = 'RESOURCE',
  UNKNOWN = 'UNKNOWN'
}

export interface FixStrategy {
  title: string;
  description: string;
  steps: string[];
  confidence: number;
}

export interface RCAResult {
  category: ErrorCategory;
  description: string;
  rootCause: string;
  suggestedFixes: FixStrategy[];
}

export const FIX_STRATEGIES: Record<ErrorCategory, FixStrategy[]> = {
  [ErrorCategory.NETWORK]: [
    {
      title: 'Check Network Connectivity',
      description: 'Verify network connection and firewall rules',
      steps: [
        'Check if the target host is reachable',
        'Verify firewall settings',
        'Check proxy configuration'
      ],
      confidence: 0.9
    }
  ],
  [ErrorCategory.CONFIGURATION]: [
    {
      title: 'Review Configuration Files',
      description: 'Check for missing or incorrect configuration',
      steps: [
        'Verify all required config keys are present',
        'Check for typos in configuration values',
        'Ensure environment variables are set'
      ],
      confidence: 0.85
    }
  ],
  [ErrorCategory.PERMISSIONS]: [
    {
      title: 'Check File Permissions',
      description: 'Verify read/write permissions',
      steps: [
        'Check file ownership',
        'Verify permission bits',
        'Check SELinux/AppArmor policies'
      ],
      confidence: 0.8
    }
  ],
  [ErrorCategory.SYNTAX]: [
    {
      title: 'Fix Syntax Errors',
      description: 'Correct syntax issues in code',
      steps: [
        'Run linter to identify issues',
        'Check for missing brackets or semicolons',
        'Verify import/export statements'
      ],
      confidence: 0.95
    }
  ],
  [ErrorCategory.LOGIC]: [
    {
      title: 'Debug Logic Issues',
      description: 'Trace through code logic',
      steps: [
        'Add logging to trace execution',
        'Check edge cases',
        'Review conditional statements'
      ],
      confidence: 0.7
    }
  ],
  [ErrorCategory.RESOURCE]: [
    {
      title: 'Manage Resources',
      description: 'Handle resource constraints',
      steps: [
        'Check available memory',
        'Verify disk space',
        'Check file descriptor limits'
      ],
      confidence: 0.75
    }
  ],
  [ErrorCategory.UNKNOWN]: [
    {
      title: 'General Troubleshooting',
      description: 'Apply general debugging techniques',
      steps: [
        'Review error logs',
        'Search for similar issues',
        'Try reproducing in isolation'
      ],
      confidence: 0.5
    }
  ]
};

export class RCAEngine {
  static categorize(errorMessage: string): ErrorCategory {
    const lower = errorMessage.toLowerCase();
    
    if (lower.includes('network') || lower.includes('connection') || lower.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    if (lower.includes('config') || lower.includes('setting') || lower.includes('option')) {
      return ErrorCategory.CONFIGURATION;
    }
    if (lower.includes('permission') || lower.includes('access') || lower.includes('denied')) {
      return ErrorCategory.PERMISSIONS;
    }
    if (lower.includes('syntax') || lower.includes('parse') || lower.includes('unexpected')) {
      return ErrorCategory.SYNTAX;
    }
    if (lower.includes('memory') || lower.includes('disk') || lower.includes('resource')) {
      return ErrorCategory.RESOURCE;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  static analyze(errorMessage: string, context?: string): RCAResult {
    const category = this.categorize(errorMessage);
    
    return {
      category,
      description: errorMessage,
      rootCause: this.identifyRootCause(category, errorMessage),
      suggestedFixes: FIX_STRATEGIES[category] || FIX_STRATEGIES[ErrorCategory.UNKNOWN]
    };
  }

  private static identifyRootCause(category: ErrorCategory, errorMessage: string): string {
    switch (category) {
      case ErrorCategory.NETWORK:
        return 'Network connectivity issue preventing communication';
      case ErrorCategory.CONFIGURATION:
        return 'Invalid or missing configuration settings';
      case ErrorCategory.PERMISSIONS:
        return 'Insufficient permissions to perform operation';
      case ErrorCategory.SYNTAX:
        return 'Code syntax error preventing execution';
      case ErrorCategory.RESOURCE:
        return 'System resource constraints';
      default:
        return 'Unable to determine specific root cause';
    }
  }
}

export default RCAEngine;
