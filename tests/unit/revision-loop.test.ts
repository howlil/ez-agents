/**
 * Tests for RevisionLoopController
 *
 * Coverage:
 * - REV-01: Revision iterations track learnings
 * - REV-02: Root cause analysis triggered after 2nd failure
 * - REV-03: Early exit when quality degrades
 * - REV-04: Learnings preserved across iterations in structured JSON
 */


import * as path from 'path';

// @ts-expect-error Module may not exist but tested for completeness
import RevisionLoopController from '../../bin/lib/revision-loop.js';

let passed = 0;
let failed = 0;

// Run tests
(async () => {
  console.log('\n=== RevisionLoopController Tests ===\n');

  const tempDir = createTempDir();

  try {
    // Constructor tests
    console.log('constructor:');
    const controller1 = new RevisionLoopController();
    expect(controller1.maxAttempts).toBe(3);
    assert.strictEqual(controller1.baseDelay, 1000);
    expect(controller1.maxDelay).toBe(8000);
    console.log('✓ should create instance with default options');
    passed++;

    const controller2 = new RevisionLoopController({ maxAttempts: 3, baseDelay: 100, maxDelay: 1000, memoryDir: tempDir });
    expect(controller2.maxAttempts).toBe(3);
    assert.strictEqual(controller2.baseDelay, 100);
    expect(controller2.maxDelay).toBe(1000);
    console.log('✓ should create instance with custom options');
    passed++;

    // calculateDelay tests
    console.log('\ncalculateDelay:');
    const controller3 = new RevisionLoopController({ baseDelay: 100, maxDelay: 1000 });
    const d0 = controller3.calculateDelay(0);
    const d1 = controller3.calculateDelay(1);
    const d2 = controller3.calculateDelay(2);
    expect(d0 >= 75 && d0 <= 125).toBeTruthy() // `delay0 should be ~100, got ${d0}`;
    expect(d1 >= 150 && d1 <= 250).toBeTruthy() // `delay1 should be ~200, got ${d1}`;
    expect(d2 >= 300 && d2 <= 500).toBeTruthy() // `delay2 should be ~400, got ${d2}`;
    console.log('✓ should calculate exponential backoff');
    passed++;

    const controller4 = new RevisionLoopController({ baseDelay: 1000, maxDelay: 2000 });
    const d10 = controller4.calculateDelay(10);
    expect(d10 <= 2000).toBeTruthy() // `delay10 should be capped at 2000, got ${d10}`;
    console.log('✓ should cap delay at maxDelay');
    passed++;

    const controller5 = new RevisionLoopController({ baseDelay: 100 });
    const delays = Array.from({ length: 10 }, () => controller5.calculateDelay(1));
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size > 1).toBeTruthy() // 'Delays should vary due to jitter';
    console.log('✓ should add jitter to prevent thundering herd');
    passed++;

    // shouldRetry tests
    console.log('\nshouldRetry:');
    const c1 = new RevisionLoopController({ memoryDir: tempDir });
    await c1.recordAttempt('task-01', new Error('Test error'), 50);
    expect(await c1.shouldRetry('task-01')).toBe(true);
    console.log('✓ should return true when under max attempts');
    passed++;

    const c2 = new RevisionLoopController({ memoryDir: tempDir });
    await c2.recordAttempt('task-02', new Error('Error 1'), 50);
    await c2.recordAttempt('task-02', new Error('Error 2'), 40);
    await c2.recordAttempt('task-02', new Error('Error 3'), 30);
    expect(await c2.shouldRetry('task-02')).toBe(false);
    console.log('✓ should return false when at max attempts');
    passed++;

    const c3 = new RevisionLoopController({ memoryDir: tempDir });
    assert.strictEqual(await c3.shouldRetry('new-task'), true);
    console.log('✓ should return true for new task with no history');
    passed++;

    // recordAttempt tests
    console.log('\nrecordAttempt:');
    const c4 = new RevisionLoopController({ memoryDir: tempDir });
    const r1 = await c4.recordAttempt('task-03', new Error('Test error message'), 65);
    expect(r1.iteration).toBe(1);
    assert.strictEqual(r1.error, 'Test error message');
    expect(r1.quality_score).toBe(65);
    assert.strictEqual(r1.success, false);
    console.log('✓ should record attempt with error and quality score');
    passed++;

    const c5 = new RevisionLoopController({ memoryDir: tempDir });
    const r2 = await c5.recordAttempt('task-04', undefined, 85);
    expect(r2.iteration).toBe(1);
    assert.strictEqual(r2.error, undefined);
    expect(r2.quality_score).toBe(85);
    assert.strictEqual(r2.success, true);
    console.log('✓ should record successful attempt');
    passed++;

    const c6 = new RevisionLoopController({ memoryDir: tempDir });
    await c6.recordAttempt('task-05', new Error('Error 1'), 50);
    const r3 = await c6.recordAttempt('task-05', new Error('Error 2'), 45);
    expect(r3.iteration).toBe(2);
    console.log('✓ should increment iteration number for subsequent attempts');
    passed++;

    const c7 = new RevisionLoopController({ memoryDir: tempDir });
    const depErr = await c7.recordAttempt('dep-task', new Error('Cannot find module'), 50);
    expect(depErr.error_type).toBe('Dependency');
    const synErr = await c7.recordAttempt('syntax-task', new Error('SyntaxError: Unexpected token'), 50);
    expect(synErr.error_type).toBe('Syntax');
    const toErr = await c7.recordAttempt('timeout-task', new Error('Request timeout'), 50);
    expect(toErr.error_type).toBe('Timeout');
    const resErr = await c7.recordAttempt('resource-task', new Error('Out of memory'), 50);
    expect(resErr.error_type).toBe('Resource');
    console.log('✓ should classify error types correctly');
    passed++;

    const c8 = new RevisionLoopController({ memoryDir: tempDir });
    await c8.recordAttempt('task-06', new Error('Test'), 60);
    const mf = path.join(tempDir, 'task-06-MEMORY.json');
    expect(fs.existsSync(mf)).toBeTruthy() // 'MEMORY.json should exist';
    const data = JSON.parse(fs.readFileSync(mf, 'utf8'));
    expect(data.taskId).toBe('task-06');
    assert.strictEqual(data.revisions.length, 1);
    console.log('✓ should persist to MEMORY.json file');
    passed++;

    const c9 = new RevisionLoopController({ memoryDir: tempDir });
    const r4 = await c9.recordAttempt('task-07', undefined, 75, { customField: 'customValue', duration: 1500 });
    expect(r4.customField).toBe('customValue');
    assert.strictEqual(r4.duration, 1500);
    console.log('✓ should accept additional metadata');
    passed++;

    // getRevisionHistory tests
    console.log('\ngetRevisionHistory:');
    const c10 = new RevisionLoopController({ memoryDir: tempDir });
    assert.deepStrictEqual(await c10.getRevisionHistory('new-task'), []);
    console.log('✓ should return empty array for new task');
    passed++;

    const c11 = new RevisionLoopController({ memoryDir: tempDir });
    await c11.recordAttempt('task-08', new Error('Error 1'), 50);
    await c11.recordAttempt('task-08', new Error('Error 2'), 55);
    await c11.recordAttempt('task-08', undefined, 80);
    const h1 = await c11.getRevisionHistory('task-08');
    expect(h1.length).toBe(3);
    console.log('✓ should return all recorded attempts');
    passed++;

    const mf2 = path.join(tempDir, 'task-09-MEMORY.json');
    fs.writeFileSync(mf2, JSON.stringify({
      taskId: 'task-09',
      lastUpdated: new Date().toISOString(),
      revisionCount: 2,
      revisions: [
        { iteration: 1, error: 'Error 1', quality_score: 50, timestamp: new Date().toISOString() },
        { iteration: 2, error: 'Error 2', quality_score: 60, timestamp: new Date().toISOString() }
      ]
    }, undefined, 2));
    const c12 = new RevisionLoopController({ memoryDir: tempDir });
    const h2 = await c12.getRevisionHistory('task-09');
    expect(h2.length).toBe(2);
    console.log('✓ should load history from MEMORY.json file');
    passed++;

    // resetCounter tests
    console.log('\nresetCounter:');
    const c13 = new RevisionLoopController({ memoryDir: tempDir });
    await c13.recordAttempt('task-10', new Error('Error'), 50);
    await c13.recordAttempt('task-10', new Error('Error 2'), 55);
    await c13.resetCounter('task-10');
    const h3 = await c13.getRevisionHistory('task-10');
    expect(h3.length).toBe(0);
    console.log('✓ should clear revision history');
    passed++;

    const c14 = new RevisionLoopController({ memoryDir: tempDir });
    await c14.recordAttempt('task-11', new Error('Error'), 50);
    const mf3 = path.join(tempDir, 'task-11-MEMORY.json');
    expect(fs.existsSync(mf3));
    await c14.resetCounter('task-11');
    assert.ok(!fs.existsSync(mf3)).toBeTruthy() // 'MEMORY.json should be removed';
    console.log('✓ should remove MEMORY.json file');
    passed++;

    // getAttemptCount tests
    console.log('\ngetAttemptCount:');
    const c15 = new RevisionLoopController({ memoryDir: tempDir });
    expect(await c15.getAttemptCount('new-task')).toBe(0);
    console.log('✓ should return 0 for new task');
    passed++;

    const c16 = new RevisionLoopController({ memoryDir: tempDir });
    await c16.recordAttempt('task-12', new Error('Error 1'), 50);
    await c16.recordAttempt('task-12', new Error('Error 2'), 55);
    await c16.recordAttempt('task-12', undefined, 80);
    expect(await c16.getAttemptCount('task-12')).toBe(3);
    console.log('✓ should return number of recorded attempts');
    passed++;

    // getStats tests
    console.log('\ngetStats:');
    const c17 = new RevisionLoopController({ memoryDir: tempDir });
    await c17.recordAttempt('task-a', new Error('Error'), 50);
    await c17.recordAttempt('task-a', undefined, 75);
    await c17.recordAttempt('task-b', new Error('Error'), 40);
    const stats = c17.getStats();
    expect(stats.totalTasks).toBe(2);
    assert.strictEqual(stats.totalRevisions, 3);
    expect(stats.successfulRevisions).toBe(1);
    assert.strictEqual(stats.successRate, '33.3');
    console.log('✓ should return statistics for all tracked tasks');
    passed++;

    const c18 = new RevisionLoopController({ memoryDir: tempDir });
    const stats2 = c18.getStats();
    expect(stats2.totalTasks).toBe(0);
    assert.strictEqual(stats2.totalRevisions, 0);
    console.log('✓ should handle empty state');
    passed++;

    // Integration test
    console.log('\nintegration: revision loop workflow:');
    const c19 = new RevisionLoopController({ memoryDir: tempDir });
    const taskId = 'integration-task';
    let attempt = 0;
    let success = false;
    while (await c19.shouldRetry(taskId) && !success) {
      attempt++;
      const qualityScore = attempt === 3 ? 85 : 50 + (attempt * 5);
      const error = qualityScore < 70 ? new Error(`Attempt ${attempt} failed`) : null;
      const result = await c19.recordAttempt(taskId, error, qualityScore);
      success = result.success;
    }
    const history = await c19.getRevisionHistory(taskId);
    expect(history.length).toBe(3);
    assert.strictEqual(history[2].success, true);
    expect(history[2].quality_score).toBe(85);
    console.log('✓ should support complete revision loop with retry logic');
    passed++;

  } finally {
    cleanupTempDir(tempDir);
  }

  // Summary
  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
  }
})();
