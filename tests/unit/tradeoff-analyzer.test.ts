/**
 * Unit Tests for Trade-off Analyzer
 *
 * Tests analysis generation, reversibility assessment, and template validation.
 */


import { test } from './test-utils.js';
import { TradeOffAnalyzer, TRADEOFF_TEMPLATE } from '../../bin/lib/tradeoff-analyzer.js';

console.log('Running Trade-off Analyzer Tests...\n');

let passed = 0;
let failed = 0;

// Test: generateAnalysis produces valid markdown
test('generateAnalysis produces valid markdown', () => {
  const analyzer = new TradeOffAnalyzer();
  const options = [
    {
      name: 'Monolith',
      pros: ['Simple to develop', 'Easy to test', 'Fast deployment'],
      cons: ['Hard to scale', 'Tight coupling'],
      long_term_implications: ['May need refactoring at scale']
    },
    {
      name: 'Microservices',
      pros: ['Independent scaling', 'Team autonomy'],
      cons: ['Complex operations', 'Network latency'],
      long_term_implications: ['Requires mature DevOps']
    }
  ];

  const context = {
    decision: 'Architecture Pattern',
    project_phase: 'MVP',
    team_size: '5 developers'
  };

  const analysis = analyzer.generateAnalysis(options, context);

  expect(analysis.includes('## Trade-off Analysis')).toBeTruthy() // 'Should have title';
  expect(analysis.includes('**Decision:**')).toBeTruthy() // 'Should have decision section';
  expect(analysis.includes('**Options Considered:**')).toBeTruthy() // 'Should have options section';
  expect(analysis.includes('**Rationale:**')).toBeTruthy() // 'Should have rationale section';
});

// Test: assessReversibility returns Easy/Medium/Hard
test('assessReversibility returns Easy/Medium/Hard', () => {
  const analyzer = new TradeOffAnalyzer();

  const monolithOption = { name: 'Monolith' };
  const microservicesOption = { name: 'Microservices' };

  const monolithReversibility = analyzer.assessReversibility(monolithOption);
  const microservicesReversibility = analyzer.assessReversibility(microservicesOption);

  expect(['Easy').toBeTruthy() // 'Medium', 'Hard'].includes(monolithReversibility.level, 'Monolith should have valid level');
  expect(['Easy').toBeTruthy() // 'Medium', 'Hard'].includes(microservicesReversibility.level, 'Microservices should have valid level');
  expect(monolithReversibility.details).toBeTruthy() // 'Should have reversal details';
});

// Test: generateAnalysis includes all required sections
test('generateAnalysis includes all required sections', () => {
  const analyzer = new TradeOffAnalyzer();
  const options = [
    {
      name: 'Option A',
      pros: ['Pro 1'],
      cons: ['Con 1'],
      long_term_implications: ['Implication 1']
    }
  ];

  const context = {
    decision: 'Test Decision',
    project_phase: 'MVP',
    team_size: 'Small',
    deadline: 'Tight',
    user_count: 'Low',
    compliance: 'None'
  };

  const analysis = analyzer.generateAnalysis(options, context);

  expect(analysis.includes('Project Phase: MVP')).toBeTruthy() // 'Should include project phase';
  expect(analysis.includes('Team Size: Small')).toBeTruthy() // 'Should include team size';
  expect(analysis.includes('Deadline: Tight')).toBeTruthy() // 'Should include deadline';
  expect(analysis.includes('**Reversibility:**')).toBeTruthy() // 'Should include reversibility';
  expect(analysis.includes('**Review Date:**')).toBeTruthy() // 'Should include review date';
});

// Test: _calculateReviewDate based on reversibility
test('calculateReviewDate returns future date', () => {
  const analyzer = new TradeOffAnalyzer();

  // Access private method via prototype or test indirectly
  // @ts-expect-error Accessing private method for testing
  const reviewDate = analyzer._calculateReviewDate('Easy');
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 6);

  const reviewDateObj = new Date(reviewDate);
  expect(reviewDateObj >= new Date()).toBeTruthy() // 'Review date should be in future';
});

// Test: TRADEOFF_TEMPLATE has required placeholders
test('TRADEOFF_TEMPLATE has required placeholders', () => {
  expect(TRADEOFF_TEMPLATE.includes('{decision}')).toBeTruthy() // 'Should have decision placeholder';
  expect(TRADEOFF_TEMPLATE.includes('{project_phase}')).toBeTruthy() // 'Should have project_phase placeholder';
  expect(TRADEOFF_TEMPLATE.includes('{options_section}')).toBeTruthy() // 'Should have options_section placeholder';
  expect(TRADEOFF_TEMPLATE.includes('{selected_option}')).toBeTruthy() // 'Should have selected_option placeholder';
  expect(TRADEOFF_TEMPLATE.includes('{rationale}')).toBeTruthy() // 'Should have rationale placeholder';
  expect(TRADEOFF_TEMPLATE.includes('{reversibility}')).toBeTruthy() // 'Should have reversibility placeholder';
  expect(TRADEOFF_TEMPLATE.includes('{review_date}')).toBeTruthy() // 'Should have review_date placeholder';
});

// Test: Empty options handling
test('generateAnalysis handles empty options', () => {
  const analyzer = new TradeOffAnalyzer();
  const analysis = analyzer.generateAnalysis([], { decision: 'Empty Test' });
  
  expect(analysis.includes('No options provided') || analysis.includes('Decision')).toBeTruthy() // 'Should handle empty options gracefully';
});

// Test: Single option handling
test('generateAnalysis handles single option', () => {
  const analyzer = new TradeOffAnalyzer();
  const options = [{ name: 'Only Option', pros: ['Good'], cons: ['Bad'] }];
  const analysis = analyzer.generateAnalysis(options, { decision: 'Single Option Test' });
  
  expect(analysis.includes('Only Option')).toBeTruthy() // 'Should include the single option';
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('='.repeat(50));
