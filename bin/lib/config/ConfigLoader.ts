/**
 * ConfigLoader — Utility for consistent configuration loading patterns
 *
 * Provides standardized methods for loading configuration from
 * environment variables, package.json, and configuration files.
 *
 * @example
 * ```typescript
 * // Load environment variable with default
 * const apiKey = ConfigLoader.getEnvVar('API_KEY', 'default-value');
 *
 * // Load package.json
 * const pkg = await ConfigLoader.loadPackageJson('./package.json');
 *
 * // Load config file
 * const config = await ConfigLoader.loadConfigFile('./.planning/config.json');
 * ```
 */

import { LogExecution } from '../decorators/index.js';
import { fileOperations } from '../file/index.js';
import * as path from 'path';

/**
 * ConfigLoader — Centralized configuration loading utility
 *
 * Eliminates duplicate configuration loading patterns by providing
 * standardized wrappers for common config operations.
 */
export class ConfigLoader {
  /**
   * Get an environment variable with optional default value
   *
   * @param name - Environment variable name
   * @param defaultValue - Default value if not set (optional)
   * @returns The environment variable value or default
   *
   * @example
   * ```typescript
   * const apiKey = ConfigLoader.getEnvVar('API_KEY');
   * const port = ConfigLoader.getEnvVar('PORT', '3000');
   * ```
   */
  @LogExecution('ConfigLoader.getEnvVar', { logParams: false })
  static getEnvVar(name: string, defaultValue?: string): string | undefined {
    const value = process.env[name];
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Get an environment variable as a boolean
   *
   * @param name - Environment variable name
   * @param defaultValue - Default value if not set (default: false)
   * @returns Boolean value (truthy strings return true)
   *
   * @example
   * ```typescript
   * const debug = ConfigLoader.getEnvVarBool('DEBUG');
   * const verbose = ConfigLoader.getEnvVarBool('VERBOSE', true);
   * ```
   */
  @LogExecution('ConfigLoader.getEnvVarBool', { logParams: false })
  static getEnvVarBool(name: string, defaultValue: boolean = false): boolean {
    const value = process.env[name];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Get an environment variable as a number
   *
   * @param name - Environment variable name
   * @param defaultValue - Default value if not set or invalid
   * @returns Parsed number or default
   *
   * @example
   * ```typescript
   * const port = ConfigLoader.getEnvVarNumber('PORT', 3000);
   * const timeout = ConfigLoader.getEnvVarNumber('TIMEOUT', 5000);
   * ```
   */
  @LogExecution('ConfigLoader.getEnvVarNumber', { logParams: false })
  static getEnvVarNumber(name: string, defaultValue: number): number {
    const value = process.env[name];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Load and parse package.json file
   *
   * @param basePath - Base path to resolve from (default: process.cwd())
   * @returns Promise resolving to package.json contents
   *
   * @example
   * ```typescript
   * const pkg = await ConfigLoader.loadPackageJson();
   * const version = pkg.version;
   * ```
   */
  @LogExecution('ConfigLoader.loadPackageJson', { logParams: false })
  static async loadPackageJson(basePath?: string): Promise<any> {
    const resolvedPath = basePath
      ? path.resolve(basePath, 'package.json')
      : path.resolve(process.cwd(), 'package.json');

    return FileOperations.readJsonFile(resolvedPath);
  }

  /**
   * Load and parse a JSON configuration file
   *
   * @param filePath - Path to the configuration file
   * @param options - Optional parsing options
   * @returns Promise resolving to configuration object
   *
   * @example
   * ```typescript
   * const config = await ConfigLoader.loadConfigFile('./config.json');
   * const custom = await ConfigLoader.loadConfigFile('./custom.json', { required: false });
   * ```
   */
  @LogExecution('ConfigLoader.loadConfigFile', { logParams: false })
  static async loadConfigFile(
    filePath: string,
    options: { required?: boolean } = {}
  ): Promise<Record<string, any>> {
    const { required = true } = options;

    try {
      const resolvedPath = path.resolve(filePath);
      return await FileOperations.readJsonFile(resolvedPath);
    } catch (error) {
      if (!required && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  /**
   * Load configuration with fallback chain
   *
   * Tries to load config from multiple paths in order,
   * returning the first successful load.
   *
   * @param paths - Array of paths to try in order
   * @returns Promise resolving to configuration object or empty object
   *
   * @example
   * ```typescript
   * const config = await ConfigLoader.loadConfigWithFallback([
   *   './config.local.json',
   *   './config.json',
   *   './default-config.json'
   * ]);
   * ```
   */
  @LogExecution('ConfigLoader.loadConfigWithFallback', { logParams: false })
  static async loadConfigWithFallback(paths: string[]): Promise<Record<string, any>> {
    for (const filePath of paths) {
      try {
        return await ConfigLoader.loadConfigFile(filePath, { required: true });
      } catch (error) {
        // Continue to next path
        continue;
      }
    }
    return {};
  }

  /**
   * Merge configuration from multiple sources
   *
   * @param configs - Array of configuration objects to merge
   * @returns Merged configuration object
   *
   * @example
   * ```typescript
   * const config = ConfigLoader.mergeConfigs(defaults, fileConfig, envConfig);
   * ```
   */
  @LogExecution('ConfigLoader.mergeConfigs', { logParams: false })
  static mergeConfigs(...configs: Array<Record<string, any>>): Record<string, any> {
    return configs.reduce((acc, config) => {
      return { ...acc, ...config };
    }, {});
  }

  /**
   * Validate required configuration keys
   *
   * @param config - Configuration object to validate
   * @param requiredKeys - Array of required key names
   * @throws Error if any required keys are missing
   *
   * @example
   * ```typescript
   * ConfigLoader.validateRequired(config, ['apiKey', 'baseUrl']);
   * ```
   */
  @LogExecution('ConfigLoader.validateRequired', { logParams: false })
  static validateRequired(config: Record<string, any>, requiredKeys: string[]): void {
    const missing = requiredKeys.filter(key => !(key in config));
    if (missing.length > 0) {
      throw new Error(`Missing required configuration keys: ${missing.join(', ')}`);
    }
  }
}
