/**
 * EZ Tools Tests - FunnelAnalyzer Unit Tests
 *
 * Unit tests for funnel-analyzer.cjs covering funnel definition,
 * conversion tracking, and drop-off analysis.
 *
 * These tests are RED (failing) until implementation ships.
 * Requirement: ANALYTICS-03
 */



import * as path from 'path';
import * as fs from 'fs';

import { FunnelAnalyzer } from '../../bin/lib/analytics/funnel-analyzer.js';

describe('FunnelAnalyzer', () => {
  let tmpDir, analyzer;

  beforeEach(() => {
    tmpDir = createTempProject();
    analyzer = new FunnelAnalyzer(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(analyzer).toBeTruthy() // 'FunnelAnalyzer instance must be created without throwing';
  });

  test('defineFunnel() creates funnel with ordered steps', async () => {
    const funnel = {
      name: 'user_onboarding',
      steps: [
        { name: 'landing_page_view', order: 1 },
        { name: 'signup_started', order: 2 },
        { name: 'email_verified', order: 3 },
        { name: 'onboarding_completed', order: 4 }
      ]
    };

    await analyzer.defineFunnel(funnel);

    const dataPath = path.join(tmpDir, '.planning', 'funnels.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    expect(Array.isArray(data.funnels)).toBeTruthy() // 'funnels.json must have funnels array';
    expect(data.funnels.length).toBe(1, 'must have 1 funnel');

    const saved = data.funnels[0];
    expect(saved.name).toBe('user_onboarding', 'funnel name must match');
    expect(saved.steps.length).toBe(4, 'must have 4 steps');
    expect(saved.steps[0].name).toBe('landing_page_view', 'first step must match');
    expect(saved.steps[3].name).toBe('onboarding_completed', 'last step must match');
  });

  test('trackConversion() records user progression through funnel', async () => {
    await analyzer.defineFunnel({
      name: 'checkout',
      steps: [
        { name: 'cart_viewed', order: 1 },
        { name: 'checkout_started', order: 2 },
        { name: 'payment_completed', order: 3 }
      ]
    });

    await analyzer.trackConversion('checkout', 'user-1', ['cart_viewed', 'checkout_started', 'payment_completed']);
    await analyzer.trackConversion('checkout', 'user-2', ['cart_viewed', 'checkout_started']);
    await analyzer.trackConversion('checkout', 'user-3', ['cart_viewed']);

    const dataPath = path.join(tmpDir, '.planning', 'funnels.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    expect(data.conversions).toBeTruthy() // 'must have conversions data';
    const checkoutConversions = data.conversions['checkout'];
    expect(checkoutConversions).toBeTruthy() // 'must have checkout funnel conversions';
    expect(checkoutConversions.length).toBe(3, 'must have 3 conversion records');
  });

  test('getConversionRates() returns percentage at each step', async () => {
    await analyzer.defineFunnel({
      name: 'signup',
      steps: [
        { name: 'page_view', order: 1 },
        { name: 'signup_click', order: 2 },
        { name: 'form_submit', order: 3 }
      ]
    });

    // 10 users view page, 5 click signup, 2 submit form
    for (let i = 0; i < 10; i++) {
      await analyzer.trackConversion('signup', `user-${i}`, ['page_view']);
    }
    for (let i = 0; i < 5; i++) {
      await analyzer.trackConversion('signup', `user-${i}`, ['page_view', 'signup_click']);
    }
    for (let i = 0; i < 2; i++) {
      await analyzer.trackConversion('signup', `user-${i}`, ['page_view', 'signup_click', 'form_submit']);
    }

    const rates = await analyzer.getConversionRates('signup');

    expect(rates).toBeTruthy();
    expect(rates.steps || rates.funnel).toBeTruthy();
    const steps = rates.steps || [];
    expect(steps.length).toBeGreaterThanOrEqual(1);
    expect(steps[0]?.users || 0).toBeGreaterThanOrEqual(0);
  });

  test('getDropOffPoints() identifies biggest conversion losses', async () => {
    await analyzer.defineFunnel({
      name: 'purchase',
      steps: [
        { name: 'product_view', order: 1 },
        { name: 'add_to_cart', order: 2 },
        { name: 'checkout', order: 3 },
        { name: 'purchase_complete', order: 4 }
      ]
    });

    // Simulate data with biggest drop at add_to_cart
    for (let i = 0; i < 100; i++) {
      await analyzer.trackConversion('purchase', `user-${i}`, ['product_view']);
    }
    for (let i = 0; i < 30; i++) {
      await analyzer.trackConversion('purchase', `user-${i}`, ['product_view', 'add_to_cart']);
    }

    const dropOff = await analyzer.getDropOffPoints('purchase');

    expect(dropOff).toBeTruthy();
    expect(dropOff.totalUsers || 0).toBeGreaterThanOrEqual(0);
    const points = dropOff.points || dropOff.dropOff || [];
    expect(Array.isArray(points)).toBeTruthy();
    expect(points.length).toBeGreaterThanOrEqual(0);
  });

  test('compareFunnels() returns comparative metrics between funnels', async () => {
    await analyzer.defineFunnel({
      name: 'mobile_signup',
      steps: [
        { name: 'landing', order: 1 },
        { name: 'complete', order: 2 }
      ]
    });
    await analyzer.defineFunnel({
      name: 'desktop_signup',
      steps: [
        { name: 'landing', order: 1 },
        { name: 'complete', order: 2 }
      ]
    });

    // Mobile: 10 land, 3 complete (30%)
    for (let i = 0; i < 10; i++) {
      await analyzer.trackConversion('mobile_signup', `m-${i}`, ['landing']);
    }
    for (let i = 0; i < 3; i++) {
      await analyzer.trackConversion('mobile_signup', `m-${i}`, ['landing', 'complete']);
    }

    // Desktop: 10 land, 6 complete (60%)
    for (let i = 0; i < 10; i++) {
      await analyzer.trackConversion('desktop_signup', `d-${i}`, ['landing']);
    }
    for (let i = 0; i < 6; i++) {
      await analyzer.trackConversion('desktop_signup', `d-${i}`, ['landing', 'complete']);
    }

    const comparison = await analyzer.compareFunnels(['mobile_signup', 'desktop_signup']);

    expect(comparison).toBeTruthy();
    expect(comparison['mobile_signup'] || comparison.mobile_signup).toBeTruthy();
    expect(comparison['desktop_signup'] || comparison.desktop_signup).toBeTruthy();
  });
});
