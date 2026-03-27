/**
 * EZ Tools Tests - CostTracker Per-Agent Tracking Unit Tests
 *
 * Tests for COST-01: Per-agent cost tracking feature
 * Tests agent field in record() and by_agent aggregation
 */



import * as path from 'path';
import * as fs from 'fs';
import { createTempProject, cleanup } from '../helpers/index.js';
import CostTracker from '../../bin/lib/cost/cost-tracker.js';

describe('CostTracker - Per-Agent Tracking (COST-01)', () => {
  let tmpDir, ct;

  beforeEach(() => {
    tmpDir = createTempProject();
    ct = new CostTracker(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('record() accepts agent field in entry', async () => {
    await ct.record({
      phase: 44,
      milestone: 'v4.0',
      operation: 'test',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      agent: 'ez-planner',
      input_tokens: 100,
      output_tokens: 50,
      cost_usd: 0.001,
    });

    const metricsPath = path.join(tmpDir, '.planning', 'metrics.json');
    expect(fs.existsSync(metricsPath)).toBeTruthy()

    const data = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    const entry = data.entries[0];
    expect(entry.agent).toBe('ez-planner');
  });

  test('aggregate() without by_agent returns phase/provider breakdown only', async () => {
    await ct.record({
      phase: 44,
      milestone: 'v4.0',
      operation: 'test',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      agent: 'ez-planner',
      input_tokens: 100,
      output_tokens: 50,
      cost_usd: 0.001,
    });

    const agg = ct.aggregate();
    expect('by_phase' in agg).toBeTruthy()
    expect('by_provider' in agg).toBeTruthy()
    expect(!('by_agent' in agg)).toBeTruthy()
  });

  test('aggregate({ by_agent: true }) returns nested breakdown by agent', async () => {
    await ct.record({
      phase: 44,
      milestone: 'v4.0',
      operation: 'test1',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      agent: 'ez-planner',
      input_tokens: 100,
      output_tokens: 50,
      cost_usd: 0.001,
    });

    await ct.record({
      phase: 44,
      milestone: 'v4.0',
      operation: 'test2',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      agent: 'ez-executor',
      input_tokens: 200,
      output_tokens: 100,
      cost_usd: 0.002,
    });

    const agg = ct.aggregate({ by_agent: true });
    expect('by_agent' in agg).toBeTruthy()
    expect('ez-planner' in agg.by_agent).toBeTruthy()
    expect('ez-executor' in agg.by_agent).toBeTruthy()
    expect(agg.by_agent['ez-planner'].cost).toBe(0.001);
    expect(agg.by_agent['ez-executor'].cost).toBe(0.002);
  });

  test('aggregate({ by_agent: true }) handles entries without agent field', async () => {
    await ct.record({
      phase: 44,
      milestone: 'v4.0',
      operation: 'test1',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      agent: 'ez-planner',
      input_tokens: 100,
      output_tokens: 50,
      cost_usd: 0.001,
    });

    await ct.record({
      phase: 44,
      milestone: 'v4.0',
      operation: 'test2',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      // No agent field
      input_tokens: 200,
      output_tokens: 100,
      cost_usd: 0.002,
    });

    const agg = ct.aggregate({ by_agent: true });
    expect('by_agent' in agg).toBeTruthy()
    expect('ez-planner' in agg.by_agent).toBeTruthy()
    expect('unknown' in agg.by_agent).toBeTruthy()
    expect(agg.by_agent['unknown'].cost).toBe(0.002);
  });

  test('aggregate({ by_agent: true, phase: 44 }) filters by phase and groups by agent', async () => {
    await ct.record({
      phase: 44,
      milestone: 'v4.0',
      operation: 'test1',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      agent: 'ez-planner',
      input_tokens: 100,
      output_tokens: 50,
      cost_usd: 0.001,
    });

    await ct.record({
      phase: 45,
      milestone: 'v4.0',
      operation: 'test2',
      provider: 'claude',
      model: 'claude-sonnet-4-6',
      agent: 'ez-executor',
      input_tokens: 200,
      output_tokens: 100,
      cost_usd: 0.002,
    });

    const agg = ct.aggregate({ phase: 44, by_agent: true });
    expect('by_agent' in agg).toBeTruthy()
    expect('ez-planner' in agg.by_agent).toBeTruthy()
    expect(!('ez-executor' in agg.by_agent)).toBeTruthy()
    expect(agg.by_agent['ez-planner'].cost).toBe(0.001);
  });
});
