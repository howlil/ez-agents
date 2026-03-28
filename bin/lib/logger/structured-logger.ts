/**
 * Structured Logger — Enhanced structured logging
 *
 * LOG-03: Log rotation improvements
 * LOG-05: Structured logging
 *
 * Features:
 * - JSON structured logging
 * - Context propagation
 * - Log enrichment
 * - Improved rotation with compression
 *
 * Target Metrics:
 * - Log parsing speed: 2x faster
 * - Context completeness: 95%+
 * - Storage efficiency: 60%+ (compression)
 */

import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipPromise = promisify(gzip);

/**
 * Structured log entry
 */
export interface StructuredLogEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Log level */
  level: 'error' | 'warn' | 'info' | 'debug';
  /** Log message */
  message: string;
  /** Module/component name */
  module?: string;
  /** Trace ID for request tracing */
  traceId?: string;
  /** Span ID for distributed tracing */
  spanId?: string;
  /** Parent span ID */
  parentSpanId?: string;
  /** Process ID */
  pid: number;
  /** Hostname */
  hostname: string;
  /** Additional context */
  context: Record<string, unknown>;
  /** Duration in ms (for timed operations) */
  duration?: number;
  /** Error stack trace */
  stack?: string;
}

/**
 * Log rotation configuration
 */
export interface RotationConfig {
  /** Max file size in bytes before rotation (default: 10MB) */
  maxSize?: number;
  /** Max number of rotated files to keep (default: 5) */
  maxFiles?: number;
  /** Enable gzip compression for rotated files (default: true) */
  compress?: boolean;
  /** Log directory (default: .planning/logs) */
  logDir?: string;
  /** Log file base name (default: app) */
  logName?: string;
}

/**
 * Structured Logger class
 *
 * Implements enhanced structured logging:
 * - JSON format for easy parsing
 * - Distributed tracing support
 * - Automatic context enrichment
 * - Log rotation with compression
 */
export class StructuredLogger {
  private readonly config: Required<RotationConfig>;
  private writeStream?: ReturnType<typeof createWriteStream>;
  private currentFileSize: number = 0;
  private rotationCount: number = 0;
  private readonly defaultContext: Record<string, unknown>;

  constructor(config: RotationConfig = {}, defaultContext: Record<string, unknown> = {}) {
    this.config = {
      maxSize: config.maxSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5,
      compress: config.compress !== false,
      logDir: config.logDir || path.join(process.cwd(), '.planning', 'logs'),
      logName: config.logName || 'app'
    };
    this.defaultContext = defaultContext;
    this.currentFileSize = 0;

    // Ensure log directory exists
    this.ensureLogDir();
    this.initializeStream();
  }

  /**
   * Log a structured entry
   * @param entry - Log entry (without auto-filled fields)
   */
  log(entry: Omit<StructuredLogEntry, 'timestamp' | 'pid' | 'hostname' | 'context'>): void {
    const fullEntry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      pid: process.pid,
      hostname: require('os').hostname(),
      ...entry,
      context: { ...this.defaultContext, ...entry.context }
    };

    const logLine = JSON.stringify(fullEntry) + '\n';
    this.write(logLine);
  }

  /**
   * Log error level
   * @param message - Error message
   * @param context - Additional context
   * @param error - Optional error object
   */
  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log({
      level: 'error',
      message,
      context: context || {},
      stack: error?.stack
    });
  }

  /**
   * Log warn level
   * @param message - Warning message
   * @param context - Additional context
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log({
      level: 'warn',
      message,
      context: context || {}
    });
  }

  /**
   * Log info level
   * @param message - Info message
   * @param context - Additional context
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log({
      level: 'info',
      message,
      context: context || {}
    });
  }

  /**
   * Log debug level
   * @param message - Debug message
   * @param context - Additional context
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log({
      level: 'debug',
      message,
      context: context || {}
    });
  }

  /**
   * Create a child logger with additional context
   * @param context - Additional context to merge
   * @returns New structured logger instance
   */
  child(context: Record<string, unknown>): StructuredLogger {
    return new StructuredLogger(this.config, {
      ...this.defaultContext,
      ...context
    });
  }

  /**
   * Create a logger with trace context
   * @param traceId - Trace ID
   * @param spanId - Optional span ID
   * @param parentSpanId - Optional parent span ID
   * @returns New structured logger instance
   */
  withTrace(traceId: string, spanId?: string, parentSpanId?: string): StructuredLogger {
    return this.child({ traceId, spanId, parentSpanId });
  }

  /**
   * Time an operation and log the duration
   * @param label - Operation label
   * @param fn - Async function to time
   * @returns Function result
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.log({
        level: 'info',
        message: `${label} completed`,
        duration,
        context: { label, status: 'success' }
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.log({
        level: 'error',
        message: `${label} failed`,
        duration,
        context: { label, status: 'failed' },
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDir(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  /**
   * Initialize write stream
   */
  private initializeStream(): void {
    const logFile = path.join(this.config.logDir, `${this.config.logName}.log`);
    this.writeStream = createWriteStream(logFile, { flags: 'a' });
    
    // Get current file size
    try {
      const stats = fs.statSync(logFile);
      this.currentFileSize = stats.size;
    } catch {
      this.currentFileSize = 0;
    }

    this.writeStream.on('drain', () => {
      // Stream ready for more data
    });
  }

  /**
   * Write log line to file
   * @param data - Log data
   */
  private write(data: string): void {
    if (!this.writeStream) {
      return;
    }

    const bytes = Buffer.byteLength(data);
    
    // Check if rotation needed
    if (this.currentFileSize + bytes > this.config.maxSize) {
      this.rotate();
    }

    this.writeStream.write(data);
    this.currentFileSize += bytes;
  }

  /**
   * Rotate log file
   */
  private async rotate(): Promise<void> {
    if (!this.writeStream) return;

    // Close current stream
    this.writeStream.end();

    const baseName = `${this.config.logName}.log`;
    const oldPath = path.join(this.config.logDir, baseName);
    const rotatedName = `${this.config.logName}.${Date.now()}.log`;
    const newPath = path.join(this.config.logDir, rotatedName);

    try {
      // Rename current file
      fs.renameSync(oldPath, newPath);

      // Compress if enabled
      if (this.config.compress) {
        const compressedPath = newPath + '.gz';
        const content = fs.readFileSync(newPath);
        const compressed = await gzipPromise(content);
        fs.writeFileSync(compressedPath, compressed);
        fs.unlinkSync(newPath); // Remove uncompressed
      }

      // Clean up old files
      this.cleanupOldFiles();

      // Reset counter
      this.rotationCount++;
      this.currentFileSize = 0;

      // Initialize new stream
      this.initializeStream();
    } catch (error) {
      console.error('[StructuredLogger] Rotation error:', error);
      // Reinitialize stream anyway
      this.initializeStream();
    }
  }

  /**
   * Clean up old rotated log files
   */
  private cleanupOldFiles(): void {
    try {
      const files = fs.readdirSync(this.config.logDir);
      const logFiles = files
        .filter(f => f.startsWith(this.config.logName) && f.endsWith('.log') || f.endsWith('.log.gz'))
        .map(f => ({
          name: f,
          path: path.join(this.config.logDir, f),
          mtime: fs.statSync(path.join(this.config.logDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Remove old files beyond maxFiles limit
      for (let i = this.config.maxFiles; i < logFiles.length; i++) {
        fs.unlinkSync(logFiles[i].path);
      }
    } catch (error) {
      console.error('[StructuredLogger] Cleanup error:', error);
    }
  }

  /**
   * Close the logger and flush all logs
   */
  close(): void {
    if (this.writeStream) {
      this.writeStream.end();
    }
  }

  /**
   * Get rotation statistics
   * @returns Rotation statistics
   */
  getStats(): {
    currentFileSize: number;
    rotationCount: number;
    maxFileSize: number;
    maxFiles: number;
    compressEnabled: boolean;
  } {
    return {
      currentFileSize: this.currentFileSize,
      rotationCount: this.rotationCount,
      maxFileSize: this.config.maxSize,
      maxFiles: this.config.maxFiles,
      compressEnabled: this.config.compress
    };
  }
}

export default StructuredLogger;
