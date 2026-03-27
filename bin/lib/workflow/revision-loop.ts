/**
 * Revision Loop Controller
 * 
 * Manages iterative revision cycles for code improvements.
 */

export interface RevisionConfig {
  maxIterations: number;
  stopOnSuccess: boolean;
  validationCommand?: string;
}

export interface RevisionResult {
  success: boolean;
  iterations: number;
  changes: string[];
  errors: string[];
}

export class RevisionLoopController {
  private config: RevisionConfig;

  constructor(config?: Partial<RevisionConfig>) {
    this.config = {
      maxIterations: 5,
      stopOnSuccess: true,
      ...config
    };
  }

  async execute(
    workFn: (iteration: number) => Promise<boolean>,
    validateFn?: () => Promise<boolean>
  ): Promise<RevisionResult> {
    const changes: string[] = [];
    const errors: string[] = [];
    let iterations = 0;

    for (let i = 0; i < this.config.maxIterations; i++) {
      iterations++;
      
      try {
        const success = await workFn(i);
        
        if (success) {
          changes.push(`Iteration ${i + 1}: Success`);
          
          // Run validation if provided
          if (validateFn) {
            const valid = await validateFn();
            if (valid && this.config.stopOnSuccess) {
              break;
            }
          } else if (this.config.stopOnSuccess) {
            break;
          }
        } else {
          errors.push(`Iteration ${i + 1}: Failed`);
        }
      } catch (err) {
        errors.push(`Iteration ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      iterations,
      changes,
      errors
    };
  }

  async executeWithFeedback(
    workFn: (iteration: number, feedback?: string) => Promise<{ success: boolean; feedback?: string }>,
    validateFn?: () => Promise<boolean>
  ): Promise<RevisionResult> {
    const changes: string[] = [];
    const errors: string[] = [];
    let iterations = 0;
    let lastFeedback: string | undefined;

    for (let i = 0; i < this.config.maxIterations; i++) {
      iterations++;
      
      try {
        const result = await workFn(i, lastFeedback);
        
        if (result.success) {
          changes.push(`Iteration ${i + 1}: Success${result.feedback ? ` - ${result.feedback}` : ''}`);
          lastFeedback = result.feedback;
          
          if (validateFn && this.config.stopOnSuccess) {
            const valid = await validateFn();
            if (valid) break;
          } else if (this.config.stopOnSuccess) {
            break;
          }
        } else {
          const errorMsg = `Iteration ${i + 1}: Failed${result.feedback ? ` - ${result.feedback}` : ''}`;
          errors.push(errorMsg);
          lastFeedback = result.feedback;
        }
      } catch (err) {
        errors.push(`Iteration ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      iterations,
      changes,
      errors
    };
  }
}

export default RevisionLoopController;
