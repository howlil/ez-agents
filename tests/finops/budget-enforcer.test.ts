/**
 * EZ Tools Tests - BudgetEnforcer Unit Tests
 *
 * Unit tests for budget-enforcer.cjs covering budget enforcement,
 * threshold alerts, and spending controls.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirements: COST-01, COST-03
 */



import * as path from 'path';
import * as fs from 'fs';

import { BudgetEnforcer } from '../../bin/lib/finops/budget-enforcer.js';

describe('BudgetEnforcer', () => {
  let tmpDir, enforcer;

  beforeEach(() => {
    tmpDir = createTempProject();
    enforcer = new BudgetEnforcer(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(enforcer).toBeTruthy() // 'BudgetEnforcer instance must be created without throwing';
  });

  test('setBudget() configures spending limit with optional warning threshold', async () => {
    const result = await enforcer.setBudget({
      ceiling: 100,
      warningThreshold: 80,
      period: 'monthly'
    });

    expect(result).toBeTruthy() // 'setBudget must return result';
    expect(result?.ceiling).toBe(100, 'ceiling must be 100');
    expect(result?.warningThreshold).toBe(80, 'warningThreshold must be 80');

    const configPath = path.join(tmpDir, '.planning', 'budget.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.ceiling).toBe(100, 'config ceiling must match');
    expect(config.warningThreshold).toBe(80, 'config warningThreshold must match');
  });

  test('checkBudget() returns status based on current spending', async () => {
    await enforcer.setBudget({ ceiling: 100, warningThreshold: 80 });
    await enforcer.recordSpending({ amount: 50, category: 'api_calls' });

    const status = enforcer.checkBudget();

    expect(status).toBeTruthy() // 'checkBudget must return status';
    expect(status.current).toBe(50, 'current spending must be 50');
    expect(status.ceiling).toBe(100, 'ceiling must be 100');
    expect(status.remaining).toBe(50, 'remaining must be 50');
    expect(status.percentUsed).toBe(50, 'percentUsed must be 50');
    expect(status.status).toBe('ok', 'status must be ok (below warning)');
  });

  test('checkBudget() returns warning when spending exceeds threshold', async () => {
    await enforcer.setBudget({ ceiling: 100, warningThreshold: 80 });
    await enforcer.recordSpending({ amount: 85, category: 'api_calls' });

    const status = enforcer.checkBudget();

    expect(status.status).toBe('warning', 'status must be warning (above 80%)');
    expect(status.percentUsed).toBe(85, 'percentUsed must be 85');
  });

  test('checkBudget() returns exceeded when spending exceeds ceiling', async () => {
    await enforcer.setBudget({ ceiling: 100, warningThreshold: 80 });
    await enforcer.recordSpending({ amount: 120, category: 'api_calls' });

    const status = enforcer.checkBudget();

    expect(status.status).toBe('exceeded', 'status must be exceeded (above ceiling)');
    expect(status.percentUsed).toBe(120, 'percentUsed must be 120');
    expect(status.overage).toBe(20, 'overage must be 20');
  });

  test('enforce() blocks operation when budget exceeded', async () => {
    await enforcer.setBudget({ ceiling: 100, warningThreshold: 80 });
    await enforcer.recordSpending({ amount: 110, category: 'api_calls' });

    const enforcement = enforcer.enforce({ operation: 'api_call', estimatedCost: 5 });

    expect(enforcement).toBeTruthy() // 'enforce must return enforcement result';
    expect(enforcement.allowed).toBe(false, 'operation must not be allowed');
    expect(enforcement.reason).toBe('budget_exceeded', 'reason must be budget_exceeded');
  });

  test('enforce() allows operation when within budget', async () => {
    await enforcer.setBudget({ ceiling: 100, warningThreshold: 80 });
    await enforcer.recordSpending({ amount: 50, category: 'api_calls' });

    const enforcement = enforcer.enforce({ operation: 'api_call', estimatedCost: 5 });

    expect(enforcement.allowed).toBe(true, 'operation must be allowed');
    expect(enforcement.estimatedRemaining).toBe(45, 'remaining after operation must be 45');
  });

  test('getSpendingByCategory() returns breakdown of spending', async () => {
    await enforcer.setBudget({ ceiling: 100 });
    await enforcer.recordSpending({ amount: 30, category: 'api_calls' });
    await enforcer.recordSpending({ amount: 20, category: 'storage' });
    await enforcer.recordSpending({ amount: 10, category: 'api_calls' });

    const breakdown = enforcer.getSpendingByCategory();

    expect(breakdown).toBeTruthy() // 'getSpendingByCategory must return data';
    expect(breakdown.api_calls).toBe(40, 'api_calls spending must be 40');
    expect(breakdown.storage).toBe(20, 'storage spending must be 20');
    expect(breakdown.total).toBe(60, 'total spending must be 60');
  });
});
