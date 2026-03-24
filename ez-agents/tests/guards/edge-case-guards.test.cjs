/**
 * Remaining Edge Case Guards Tests
 * Tests for EDGE-03, EDGE-04, EDGE-05, EDGE-06
 */

import { describe, it } from 'vitest';
import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the guards
import {
  checkHiddenState,
  listStateFiles,
  validatePersistence
} from '../../../bin/guards/hidden-state-guard.cjs';

import {
  checkIrreversibleOps,
  requiresHumanApproval,
  checkAutonomy
} from '../../../bin/guards/autonomy-guard.cjs';

import {
  checkToolCount,
  getActiveTools,
  checkToolSprawl
} from '../../../bin/guards/tool-sprawl-guard.cjs';

import {
  detectOrgChanges,
  checkTeamOverhead,
  flagTeamRestructure
} from '../../../bin/guards/team-overhead-guard.cjs';

describe('EDGE-03: Hidden State Guard', () => {
  describe('listStateFiles', () => {
    it('should return empty array when no .planning directory', () => {
      const result = listStateFiles(os.tmpdir());
      assert.ok(Array.isArray(result));
    });
    
    it('should find markdown files in .planning directory', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'state-test-'));
      const planningDir = path.join(tempDir, '.planning');
      fs.mkdirSync(planningDir);
      fs.writeFileSync(path.join(planningDir, 'test.md'), '# Test');
      fs.writeFileSync(path.join(planningDir, 'other.txt'), 'not markdown');
      
      try {
        const result = listStateFiles(tempDir);
        assert.strictEqual(result.length, 1);
        assert.ok(result[0].endsWith('test.md'));
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
  
  describe('checkHiddenState', () => {
    it('should return no hidden state for empty output', () => {
      const result = checkHiddenState('', os.tmpdir());
      assert.strictEqual(result.hasHiddenState, false);
    });
    
    it('should detect state references in output', () => {
      const output = 'Phase 1 is complete. Task 5-02 is done. Status: BLOCKED';
      const result = checkHiddenState(output, os.tmpdir());
      assert.ok(result.stateReferences.length > 0);
    });
  });
  
  describe('validatePersistence', () => {
    it('should validate persistence correctly', () => {
      const output = 'All state is documented';
      const result = validatePersistence(output, os.tmpdir());
      assert.ok('valid' in result);
      assert.ok('stateFiles' in result);
    });
  });
});

describe('EDGE-04: Autonomy Guard', () => {
  describe('checkIrreversibleOps', () => {
    it('should detect database drop as irreversible', () => {
      const result = checkIrreversibleOps('Drop the database and recreate it');
      assert.strictEqual(result.irreversible, true);
      assert.strictEqual(result.requiresApproval, true);
    });
    
    it('should detect production deploy as irreversible', () => {
      const result = checkIrreversibleOps('Deploy to production server');
      assert.strictEqual(result.irreversible, true);
      assert.strictEqual(result.requiresApproval, true);
    });
    
    it('should allow safe operations', () => {
      const result = checkIrreversibleOps('Read the configuration file');
      assert.strictEqual(result.irreversible, false);
      assert.strictEqual(result.requiresApproval, false);
    });
    
    it('should classify delete operations as irreversible', () => {
      const result = checkIrreversibleOps('Delete all records from users table');
      assert.strictEqual(result.irreversible, true);
    });
  });
  
  describe('requiresHumanApproval', () => {
    it('should require approval for irreversible ops', () => {
      assert.strictEqual(requiresHumanApproval('DROP DATABASE'), true);
      assert.strictEqual(requiresHumanApproval('truncate table'), true);
    });
    
    it('should not require approval for safe ops', () => {
      assert.strictEqual(requiresHumanApproval('SELECT * FROM users'), false);
      assert.strictEqual(requiresHumanApproval('read file'), false);
    });
  });
  
  describe('checkAutonomy', () => {
    it('should flag irreversible operations in output', () => {
      const output = 'Step 1: Drop the database. Step 2: Recreate schema.';
      const result = checkAutonomy(output, os.tmpdir());
      assert.strictEqual(result.requiresApproval, true);
      assert.ok(result.flaggedOperations.length > 0);
    });
  });
});

describe('EDGE-05: Tool Sprawl Guard', () => {
  describe('getActiveTools', () => {
    it('should extract tools from context', () => {
      const context = 'Using express for server and react for UI';
      const tools = getActiveTools(context);
      assert.ok(tools.includes('express'));
      assert.ok(tools.includes('react'));
    });
    
    it('should extract npm packages', () => {
      const context = 'Install @scope/package and another-lib';
      const tools = getActiveTools(context);
      assert.ok(tools.some(t => t.includes('@scope/package') || t === 'another-lib'));
    });
  });
  
  describe('checkToolCount', () => {
    it('should return optimal for 3-7 tools', () => {
      const tools = ['tool1', 'tool2', 'tool3', 'tool4', 'tool5'];
      const result = checkToolCount(tools);
      assert.strictEqual(result.status, 'optimal');
      assert.strictEqual(result.withinLimit, true);
    });
    
    it('should return exceeded for >7 tools', () => {
      const tools = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10'];
      const result = checkToolCount(tools);
      assert.strictEqual(result.status, 'exceeded');
      assert.strictEqual(result.withinLimit, false);
      assert.strictEqual(result.exceeded, 3);
    });
    
    it('should return below-recommended for <3 tools', () => {
      const tools = ['tool1'];
      const result = checkToolCount(tools);
      assert.strictEqual(result.status, 'below-recommended');
    });
  });
  
  describe('checkToolSprawl', () => {
    it('should analyze tool usage', () => {
      const context = 'Using vitest, playwright, and typescript for this task';
      const result = checkToolSprawl(context);
      assert.ok('count' in result);
      assert.ok('tools' in result);
      assert.ok('summary' in result);
    });
  });
});

describe('EDGE-06: Team Overhead Guard', () => {
  describe('detectOrgChanges', () => {
    it('should detect team structure suggestions', () => {
      const output = 'You should reorganize team into squads';
      const result = detectOrgChanges(output);
      assert.strictEqual(result.hasOrgChanges, true);
      assert.ok(result.suggestions.length > 0);
    });
    
    it('should detect meeting suggestions', () => {
      const output = 'Add a daily standup meeting';
      const result = detectOrgChanges(output);
      assert.strictEqual(result.hasOrgChanges, true);
    });
    
    it('should detect role suggestions', () => {
      const output = 'Create a new tech lead role';
      const result = detectOrgChanges(output);
      assert.strictEqual(result.hasOrgChanges, true);
    });
    
    it('should not flag technical suggestions', () => {
      const output = 'Add tests for the new feature';
      const result = detectOrgChanges(output);
      assert.strictEqual(result.hasOrgChanges, false);
    });
  });
  
  describe('flagTeamRestructure', () => {
    it('should flag restructuring suggestions', () => {
      const suggestion = 'Reorganize the team structure';
      const result = flagTeamRestructure(suggestion);
      assert.strictEqual(result.flagged, true);
    });
    
    it('should assign severity based on keyword count', () => {
      const suggestion = 'Reorganize team structure and create new roles and add meetings';
      const result = flagTeamRestructure(suggestion);
      assert.strictEqual(result.severity, 'high');
    });
  });
  
  describe('checkTeamOverhead', () => {
    it('should provide complete analysis', () => {
      const output = 'You should hire a new engineer and add sprint planning';
      const result = checkTeamOverhead(output);
      assert.strictEqual(result.hasOrgChanges, true);
      assert.ok('summary' in result);
      assert.ok('actionable' in result);
    });
  });
});
