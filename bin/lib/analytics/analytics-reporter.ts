/**
 * Analytics Reporter — Aggregated analytics report generation
 * Generates reports from events, NPS, funnels, and cohorts
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Analytics report options
 */
export interface AnalyticsReportOptions {
  /** Report type */
  type?: 'daily' | 'weekly' | 'monthly' | 'custom';
  /** Start date (ISO) */
  startDate?: string;
  /** End date (ISO) */
  endDate?: string;
  /** Include NPS data */
  includeNps?: boolean;
  /** Include funnel data */
  includeFunnels?: boolean;
  /** Include cohort data */
  includeCohorts?: boolean;
}

/**
 * Report period
 */
export interface ReportPeriod {
  /** Start date */
  startDate: string;
  /** End date */
  endDate: string;
}

/**
 * Aggregated metrics
 */
export interface AggregatedMetrics {
  /** Summary metrics */
  summary: {
    totalEvents: number;
    totalSessions: number;
    totalUsers: number;
  };
  /** Metrics by source */
  bySource: Array<{ source: string; count: number }>;
}

/**
 * Report schedule configuration
 */
export interface ReportSchedule {
  /** Schedule ID */
  id: string;
  /** Schedule name */
  name: string;
  /** Report type */
  type: string;
  /** Recipients */
  recipients: string[];
  /** Output format */
  format: string;
  /** Cron expression */
  cron: string;
  /** Enabled status */
  enabled: boolean;
  /** Created at */
  createdAt: string;
}

/**
 * Analytics report structure
 */
export interface AnalyticsReport {
  /** Report timestamp */
  generatedAt: string;
  /** Report period */
  period: ReportPeriod;
  /** Report metrics */
  metrics: {
    totalUsers?: number;
    activeUsers?: number;
    totalEvents?: number;
    [key: string]: unknown;
  };
}

/**
 * Schedule options
 */
export interface ScheduleOptions {
  /** Schedule name */
  name: string;
  /** Report type */
  type: string;
  /** Recipients */
  recipients: string[];
  /** Output format */
  format: string;
  /** Cron expression */
  cron: string;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: 'json' | 'csv';
  /** Output filename */
  filename: string;
}

export class AnalyticsReporter {
  private readonly cwd: string;
  private readonly reportsDir: string;
  private readonly schedulesPath: string;

  constructor(cwd?: string) {
    this.cwd = cwd || process.cwd();
    this.reportsDir = path.join(this.cwd, '.planning', 'analytics', 'reports');
    this.schedulesPath = path.join(this.cwd, '.planning', 'report-schedules.json');
    this.ensureDir();
  }

  /**
   * Generate analytics report
   * @param options - Report options
   * @returns Analytics report
   */
  async generateReport(options: AnalyticsReportOptions = {}): Promise<AnalyticsReport> {
    const { AnalyticsCollector } = await import('./analytics-collector.js');
    
    const collector = new AnalyticsCollector(this.cwd);
    const events = collector.getAllEvents();
    const sessions = collector.getAllSessions();

    const startDate = options.startDate || new Date().toISOString().split('T')[0];
    const endDate = options.endDate || new Date().toISOString().split('T')[0];

    const report: AnalyticsReport = {
      generatedAt: new Date().toISOString(),
      period: {
        startDate: options.startDate || startDate,
        endDate: options.endDate || endDate
      },
      metrics: {
        totalEvents: events.length,
        totalUsers: new Set(sessions.map(s => s.userId)).size,
        activeUsers: sessions.filter(s => s.endTime).length
      }
    };

    return report;
  }

  /**
   * Aggregate metrics from multiple sources
   * @param options - Aggregation options
   * @returns Aggregated metrics
   */
  async aggregateMetrics(options: { sources: string[]; startDate: string; endDate: string }): Promise<AggregatedMetrics> {
    const { AnalyticsCollector } = await import('./analytics-collector.js');
    
    const collector = new AnalyticsCollector(this.cwd);
    const events = collector.getAllEvents();
    const sessions = collector.getAllSessions();

    const bySource: Array<{ source: string; count: number }> = [];
    
    for (const source of options.sources) {
      let count = 0;
      if (source === 'events') {
        count = events.length;
      } else if (source === 'sessions') {
        count = sessions.length;
      } else if (source === 'conversions') {
        // Placeholder for conversions
        count = 0;
      }
      bySource.push({ source, count });
    }

    return {
      summary: {
        totalEvents: events.length,
        totalSessions: sessions.length,
        totalUsers: new Set(sessions.map(s => s.userId)).size
      },
      bySource
    };
  }

  /**
   * Export report to file
   * @param report - Report to export
   * @param options - Export options
   * @returns Path to exported file
   */
  async exportReport(report: AnalyticsReport, options: ExportOptions): Promise<string> {
    const filename = options.filename.includes('.') ? options.filename : `${options.filename}.${options.format}`;
    const filePath = path.join(this.reportsDir, filename);

    let content: string;
    if (options.format === 'json') {
      content = JSON.stringify(report, null, 2);
    } else {
      // CSV format
      const rows = [['generatedAt', 'startDate', 'endDate']];
      rows.push([report.generatedAt, report.period.startDate, report.period.endDate]);
      
      // Add metrics
      for (const [key, value] of Object.entries(report.metrics)) {
        rows.push([key, String(value)]);
      }
      
      content = rows.map(row => row.join(',')).join('\n');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  /**
   * Schedule recurring report
   * @param options - Schedule options
   * @returns Schedule configuration
   */
  async scheduleReport(options: ScheduleOptions): Promise<ReportSchedule> {
    const schedules = this.getSchedules();
    
    const schedule: ReportSchedule = {
      id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: options.name,
      type: options.type,
      recipients: options.recipients,
      format: options.format,
      cron: options.cron,
      enabled: true,
      createdAt: new Date().toISOString()
    };

    schedules.schedules.push(schedule);
    this.saveSchedules(schedules);

    return schedule;
  }

  /**
   * Save report to file
   * @param report - Report to save
   * @param filename - Optional filename
   * @returns Path to saved report
   */
  saveReport(report: AnalyticsReport, filename?: string): string {
    const reportFilename = filename || `analytics-${Date.now()}.json`;
    const reportPath = path.join(this.reportsDir, reportFilename);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    return reportPath;
  }

  /**
   * Get all schedules
   * @returns Schedules data
   */
  private getSchedules(): { schedules: ReportSchedule[] } {
    if (!fs.existsSync(this.schedulesPath)) {
      return { schedules: [] };
    }
    return JSON.parse(fs.readFileSync(this.schedulesPath, 'utf8'));
  }

  /**
   * Save schedules
   * @param data - Schedules data
   */
  private saveSchedules(data: { schedules: ReportSchedule[] }): void {
    fs.writeFileSync(this.schedulesPath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Ensure reports directory exists
   */
  private ensureDir(): void {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }
}

/**
 * Generate analytics report
 * @param options - Report options
 * @param cwd - Working directory
 * @returns Analytics report
 */
export async function generateReport(options: AnalyticsReportOptions = {}, cwd?: string): Promise<AnalyticsReport> {
  const reporter = new AnalyticsReporter(cwd);
  return reporter.generateReport(options);
}

/**
 * Aggregate metrics
 * @param options - Aggregation options
 * @param cwd - Working directory
 * @returns Aggregated metrics
 */
export async function aggregateMetrics(options: { sources: string[]; startDate: string; endDate: string }, cwd?: string): Promise<AggregatedMetrics> {
  const reporter = new AnalyticsReporter(cwd);
  return reporter.aggregateMetrics(options);
}

/**
 * Export report
 * @param report - Report to export
 * @param options - Export options
 * @param cwd - Working directory
 * @returns Path to exported file
 */
export async function exportReport(report: AnalyticsReport, options: ExportOptions, cwd?: string): Promise<string> {
  const reporter = new AnalyticsReporter(cwd);
  return reporter.exportReport(report, options);
}

/**
 * Schedule report
 * @param options - Schedule options
 * @param cwd - Working directory
 * @returns Schedule configuration
 */
export async function scheduleReport(options: ScheduleOptions, cwd?: string): Promise<ReportSchedule> {
  const reporter = new AnalyticsReporter(cwd);
  return reporter.scheduleReport(options);
}
