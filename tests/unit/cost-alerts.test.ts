/**
 * EZ Tools Tests - CostAlerts Unit Tests
 *
 * Tests for COST-02: Multi-threshold budget alert system
 * Tests threshold checking, alert logging, and duplicate prevention
 */



import * as path from 'path';
import * as fs from 'fs';
import { createTempProject, cleanup } from '../helpers.ts';
import CostAlerts, { THRESHOLDS } from '../../bin/lib/cost-alerts.js';

describe('CostAlerts (COST-02)', () => {
  let tmpDir, alerts;

  beforeEach(() => {
    tmpDir = createTempProject();
    alerts = new CostAlerts(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  describe('checkThresholds', () => {
    test('returns empty array when percentUsed below all thresholds', () => {
      const triggered = alerts.checkThresholds({ percentUsed: 30, totalSpent: 1.50, budget: 5.00 });
      expect(triggered.length).toBe(0, 'should not trigger any alerts below 50%');
    });

    test('returns info alert when percentUsed >= 50%', () => {
      const triggered = alerts.checkThresholds({ percentUsed: 50, totalSpent: 2.50, budget: 5.00 });
      expect(triggered.length).toBe(1, 'should trigger 1 alert at 50%');
      expect(triggered[0].level).toBe('info', 'level should be info');
      expect(triggered[0].threshold).toBe(50, 'threshold should be 50');
    });

    test('returns info and warning alerts when percentUsed >= 75%', () => {
      const triggered = alerts.checkThresholds({ percentUsed: 75, totalSpent: 3.75, budget: 5.00 });
      expect(triggered.length).toBe(2, 'should trigger 2 alerts at 75%');
      expect(triggered[0].level).toBe('info', 'first alert should be info');
      expect(triggered[1].level).toBe('warning', 'second alert should be warning');
    });

    test('returns all three alerts when percentUsed >= 90%', () => {
      const triggered = alerts.checkThresholds({ percentUsed: 90, totalSpent: 4.50, budget: 5.00 });
      expect(triggered.length).toBe(3, 'should trigger 3 alerts at 90%');
      expect(triggered[0].level).toBe('info', 'first alert should be info');
      expect(triggered[1].level).toBe('warning', 'second alert should be warning');
      expect(triggered[2].level).toBe('critical', 'third alert should be critical');
    });

    test('alert object contains all required fields', () => {
      const triggered = alerts.checkThresholds({ percentUsed: 80, totalSpent: 4.00, budget: 5.00 });
      const alert = triggered.find(a => a.level === 'warning');
      expect(alert).toBeTruthy() // 'should have warning alert';
      expect('threshold' in alert).toBeTruthy() // 'alert must have threshold field';
      expect('level' in alert).toBeTruthy() // 'alert must have level field';
      expect('percentUsed' in alert).toBeTruthy() // 'alert must have percentUsed field';
      expect('totalSpent' in alert).toBeTruthy() // 'alert must have totalSpent field';
      expect('budget' in alert).toBeTruthy() // 'alert must have budget field';
      expect('message' in alert).toBeTruthy() // 'alert must have message field';
      expect('timestamp' in alert).toBeTruthy() // 'alert must have timestamp field';
    });
  });

  describe('logAlert', () => {
    test('writes alert to alerts.json', async () => {
      const alert = {
        threshold: 50,
        level: 'info',
        percentUsed: 50,
        totalSpent: 2.50,
        budget: 5.00,
        message: 'Test alert',
        timestamp: new Date().toISOString()
      };

      await alerts.logAlert(alert);

      const alertsPath = path.join(tmpDir, '.planning', 'alerts.json');
      expect(fs.existsSync(alertsPath)).toBeTruthy() // 'alerts.json must exist after logAlert';

      const data = JSON.parse(fs.readFileSync(alertsPath, 'utf8'));
      expect(Array.isArray(data.alerts)).toBeTruthy() // 'alerts.json must have alerts array';
      expect(data.alerts.length).toBe(1, 'alerts array must have 1 entry');
      expect(data.alerts[0].threshold).toBe(50, 'alert threshold must be 50');
      expect(data.alerts[0].level).toBe('info', 'alert level must be info');
    });

    test('prevents duplicate alerts within 24 hours', async () => {
      const alert = {
        threshold: 50,
        level: 'info',
        percentUsed: 50,
        totalSpent: 2.50,
        budget: 5.00,
        message: 'Test alert',
        timestamp: new Date().toISOString()
      };

      await alerts.logAlert(alert);
      await alerts.logAlert(alert); // Try to log same alert again

      const alertsPath = path.join(tmpDir, '.planning', 'alerts.json');
      const data = JSON.parse(fs.readFileSync(alertsPath, 'utf8'));
      expect(data.alerts.length).toBe(1, 'should prevent duplicate alert');
    });

    test('allows different threshold alerts', async () => {
      const infoAlert = {
        threshold: 50,
        level: 'info',
        percentUsed: 50,
        totalSpent: 2.50,
        budget: 5.00,
        message: 'Info alert',
        timestamp: new Date().toISOString()
      };

      const warningAlert = {
        threshold: 75,
        level: 'warning',
        percentUsed: 75,
        totalSpent: 3.75,
        budget: 5.00,
        message: 'Warning alert',
        timestamp: new Date().toISOString()
      };

      await alerts.logAlert(infoAlert);
      await alerts.logAlert(warningAlert);

      const alertsPath = path.join(tmpDir, '.planning', 'alerts.json');
      const data = JSON.parse(fs.readFileSync(alertsPath, 'utf8'));
      expect(data.alerts.length).toBe(2, 'should allow different threshold alerts');
    });
  });

  describe('getAlerts', () => {
    test('returns empty array when no alerts exist', () => {
      const retrieved = alerts.getAlerts();
      expect(retrieved.length).toBe(0, 'should return empty array when no alerts');
    });

    test('returns all alerts after logging', async () => {
      const alert = {
        threshold: 50,
        level: 'info',
        percentUsed: 50,
        totalSpent: 2.50,
        budget: 5.00,
        message: 'Test alert',
        timestamp: new Date().toISOString()
      };

      await alerts.logAlert(alert);
      const retrieved = alerts.getAlerts();

      expect(retrieved.length).toBe(1, 'should return 1 alert');
      expect(retrieved[0].threshold).toBe(50, 'alert threshold must match');
    });
  });

  describe('getAlertsByLevel', () => {
    test('filters alerts by level', async () => {
      const infoAlert = {
        threshold: 50,
        level: 'info',
        percentUsed: 50,
        totalSpent: 2.50,
        budget: 5.00,
        message: 'Info alert',
        timestamp: new Date().toISOString()
      };

      const warningAlert = {
        threshold: 75,
        level: 'warning',
        percentUsed: 75,
        totalSpent: 3.75,
        budget: 5.00,
        message: 'Warning alert',
        timestamp: new Date().toISOString()
      };

      await alerts.logAlert(infoAlert);
      await alerts.logAlert(warningAlert);

      const infoAlerts = alerts.getAlertsByLevel('info');
      const warningAlerts = alerts.getAlertsByLevel('warning');

      expect(infoAlerts.length).toBe(1, 'should have 1 info alert');
      expect(warningAlerts.length).toBe(1, 'should have 1 warning alert');
    });
  });

  describe('THRESHOLDS constant', () => {
    test('exports correct threshold values', () => {
      expect(THRESHOLDS.INFO).toBe(50, 'INFO threshold should be 50');
      expect(THRESHOLDS.WARNING).toBe(75, 'WARNING threshold should be 75');
      expect(THRESHOLDS.CRITICAL).toBe(90, 'CRITICAL threshold should be 90');
    });
  });
});
