/**
 * EZ Tools Tests - BudgetEnforcer Unit Tests
 *
 * Unit tests for budget-enforcer.cjs covering budget enforcement,
 * threshold alerts, and spending controls.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirements: COST-01, COST-03
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
import assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';

import BudgetEnforcer from '../../bin/lib/budget-enforcer.js';

describe('BudgetEnforcer', () => {
  let tmpDir, enforcer;

  beforeEach(() => {
    tmpDir = createTempProject();
    enforcer = new BudgetEnforcer(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    assert.ok(enforcer, 'BudgetEnforcer instance must be created without throwing');
  });

  test('setBudget() configures spending limit with optional warning threshold', async () => {
    const result = await enforcer.setBudget({
      ceiling: 100,
      warningThreshold: 80,
      period: 'monthly'
    });

    assert.ok(result, 'setBudget must return result');
    assert.strictEqual(result.ceiling, 100, 'ceiling must be 100');
    assert.strictEqual(result.warningThreshold, 80, 'warningThreshold must be 80');

    const configPath = path.join(tmpDir, '.planning', 'budget.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.strictEqual(config.ceiling, 100, 'config ceiling must match');
    assert.strictEqual(config.warningThreshold, 80, 'config warningThreshold must match');
  });

  test('checkBudget() returns status based on current spending', async () => {
    await enforcer.setBudget({ ceiling: 100, warningThreshold: 80 });
    await enforcer.recordSpending({ amount: 50, category: 'api_calls' });

    const status = enforcer.checkBudget();

    assert.ok(status, 'checkBudget must return status');
    assert.strictEqual(status.current, 50, 'current spending must be 50');
    assert.strictEqual(status.ceiling, 100, 'ceiling must be 100');
    assert.strictEqual(status.remaining, 50, 'remaining must be 50');
    assert.strictEqual(status.percentUsed, 50, 'percentUsed must be 50');
    assert.strictEqual(status.status, 'ok', 'status must be ok (below warning)');
  });

  test('checkBudget() returns warning when spending exceeds threshold', async () => {
    await enforcer.setBudget({ ceiling: 100, warningThreshold: 80 });
    await enforcer.recordSpending({ amount: 85, category: 'api_calls' });

    const status = enforcer.checkBudget();

    assert.strictEqual(status.status, 'warning', 'status must be warning (above 80%)');
    assert.strictEqual(status.percentUsed, 85, 'percentUsed must be 85');
  });

  test('checkBudget() returns exceeded when spending exceeds ceiling', async () => {
    await enforcer.setBudget({ ceiling: 100, warningThreshold: 80 });
    await enforcer.recordSpending({ amount: 120, category: 'api_calls' });

    const status = enforcer.checkBudget();

    assert.strictEqual(status.status, 'exceeded', 'status must be exceeded (above ceiling)');
    assert.strictEqual(status.percentUsed, 120, 'percentUsed must be 120');
    assert.strictEqual(status.overage, 20, 'overage must be 20');
  });

  test('enforce() blocks operation when budget exceeded', async () => {
    await enforcer.setBudget({ ceiling: 100, warningThreshold: 80 });
    await enforcer.recordSpending({ amount: 110, category: 'api_calls' });

    const enforcement = enforcer.enforce({ operation: 'api_call', estimatedCost: 5 });

    assert.ok(enforcement, 'enforce must return enforcement result');
    assert.strictEqual(enforcement.allowed, false, 'operation must not be allowed');
    assert.strictEqual(enforcement.reason, 'budget_exceeded', 'reason must be budget_exceeded');
  });

  test('enforce() allows operation when within budget', async () => {
    await enforcer.setBudget({ ceiling: 100, warningThreshold: 80 });
    await enforcer.recordSpending({ amount: 50, category: 'api_calls' });

    const enforcement = enforcer.enforce({ operation: 'api_call', estimatedCost: 5 });

    assert.strictEqual(enforcement.allowed, true, 'operation must be allowed');
    assert.strictEqual(enforcement.estimatedRemaining, 45, 'remaining after operation must be 45');
  });

  test('getSpendingByCategory() returns breakdown of spending', async () => {
    await enforcer.setBudget({ ceiling: 100 });
    await enforcer.recordSpending({ amount: 30, category: 'api_calls' });
    await enforcer.recordSpending({ amount: 20, category: 'storage' });
    await enforcer.recordSpending({ amount: 10, category: 'api_calls' });

    const breakdown = enforcer.getSpendingByCategory();

    assert.ok(breakdown, 'getSpendingByCategory must return data');
    assert.strictEqual(breakdown.api_calls, 40, 'api_calls spending must be 40');
    assert.strictEqual(breakdown.storage, 20, 'storage spending must be 20');
    assert.strictEqual(breakdown.total, 60, 'total spending must be 60');
  });
});
