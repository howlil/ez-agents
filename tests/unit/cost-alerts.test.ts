/**
 * EZ Tools Tests - CostAlerts Unit Tests
 *
 * Tests for COST-02: Multi-threshold budget alert system
 * Tests threshold checking, alert logging, and duplicate prevention
 */



import * as path from 'path';
import * as fs from 'fs';
import { createTempProject, cleanup } from '../helpers/index.js';
import CostAlerts, { THRESHOLDS } from '../../bin/lib/cost/cost-alerts.js';

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
      expect(triggered.length).toBe(0);
    });

    test('returns info alert when percentUsed >= 50%', () => {
      const triggered = alerts.checkThresholds({ percentUsed: 50, totalSpent: 2.50, budget: 5.00 });
      expect(triggered.length).toBe(1);
      expect(triggered[0].level).toBe('info');
      expect(triggered[0].threshold).toBe(50);
    });

    test('returns info and warning alerts when percentUsed >= 75%', () => {
      const triggered = alerts.checkThresholds({ percentUsed: 75, totalSpent: 3.75, budget: 5.00 });
      expect(triggered.length).toBe(2);
      expect(triggered[0].level).toBe('info');
      expect(triggered[1].level).toBe('warning');
    });

    test('returns all three alerts when percentUsed >= 90%', () => {
      const triggered = alerts.checkThresholds({ percentUsed: 90, totalSpent: 4.50, budget: 5.00 });
      expect(triggered.length).toBe(3);
      expect(triggered[0].level).toBe('info');
      expect(triggered[1].level).toBe('warning');
      expect(triggered[2].level).toBe('critical');
    });

    test('alert object contains all required fields', () => {
      const triggered = alerts.checkThresholds({ percentUsed: 80, totalSpent: 4.00, budget: 5.00 });
      const alert = triggered.find(a => a.level === 'warning');
      expect(alert).toBeTruthy()
      expect('threshold' in alert).toBeTruthy()
      expect('level' in alert).toBeTruthy()
      expect('percentUsed' in alert).toBeTruthy()
      expect('totalSpent' in alert).toBeTruthy()
      expect('budget' in alert).toBeTruthy()
      expect('message' in alert).toBeTruthy()
      expect('timestamp' in alert).toBeTruthy()
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
      expect(fs.existsSync(alertsPath)).toBeTruthy()

      const data = JSON.parse(fs.readFileSync(alertsPath, 'utf8'));
      expect(Array.isArray(data.alerts)).toBeTruthy()
      expect(data.alerts.length).toBe(1);
      expect(data.alerts[0].threshold).toBe(50);
      expect(data.alerts[0].level).toBe('info');
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
      expect(data.alerts.length).toBe(1);
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
      expect(data.alerts.length).toBe(2);
    });
  });

  describe('getAlerts', () => {
    test('returns empty array when no alerts exist', () => {
      const retrieved = alerts.getAlerts();
      expect(retrieved.length).toBe(0);
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

      expect(retrieved.length).toBe(1);
      expect(retrieved[0].threshold).toBe(50);
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

      expect(infoAlerts.length).toBe(1);
      expect(warningAlerts.length).toBe(1);
    });
  });

  describe('THRESHOLDS constant', () => {
    test('exports correct threshold values', () => {
      expect(THRESHOLDS.INFO).toBe(50);
      expect(THRESHOLDS.WARNING).toBe(75);
      expect(THRESHOLDS.CRITICAL).toBe(90);
    });
  });
});
