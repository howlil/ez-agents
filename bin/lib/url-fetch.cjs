#!/usr/bin/env node

/**
 * URL Fetch Service
 *
 * Provides secure URL fetching with HTTPS validation and user confirmation.
 * Only HTTPS URLs are allowed. HTTP, file, data, javascript, and vbscript protocols are blocked.
 */

const { URL } = require('url');
const { URLFetchError } = require('./context-errors.cjs');

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const BLOCKED_PROTOCOLS = ['http:', 'file:', 'data:', 'javascript:', 'vbscript:'];

class URLValidator {
  /**
   * Validate a URL string
   * @param {string} urlString - The URL to validate
   * @returns {{valid: boolean, error?: string}} - Validation result
   */
  static validate(urlString) {
    if (!urlString || typeof urlString !== 'string') {
      return { valid: false, error: 'URL is required' };
    }

    try {
      const url = new URL(urlString);

      // Check protocol
      if (url.protocol !== 'https:') {
        if (BLOCKED_PROTOCOLS.includes(url.protocol)) {
          return { 
            valid: false, 
            error: `Protocol '${url.protocol}' is not allowed. Only HTTPS is permitted.` 
          };
        }
        return { 
          valid: false, 
          error: `Invalid protocol '${url.protocol}'. Only HTTPS is allowed.` 
        };
      }

      // Check hostname exists
      if (!url.hostname || url.hostname.trim() === '') {
        return { valid: false, error: 'Invalid URL: missing hostname' };
      }

      // Reject localhost URLs
      if (url.hostname === 'localhost' || 
          url.hostname === '127.0.0.1' || 
          url.hostname === '::1' ||
          url.hostname.endsWith('.localhost')) {
        return { 
          valid: false, 
          error: 'Localhost URLs are not allowed. Use a publicly accessible HTTPS URL.' 
        };
      }

      return { valid: true };
    } catch (err) {
      return { 
        valid: false, 
        error: `Invalid URL format: ${err.message}` 
      };
    }
  }
}

class URLFetchService {
  /**
   * Create a new URLFetchService instance
   * @param {number} timeout - Request timeout in milliseconds (default: 30000)
   */
  constructor(timeout = DEFAULT_TIMEOUT) {
    this.timeout = timeout;
  }

  /**
   * Validate a URL
   * @param {string} urlString - The URL to validate
   * @returns {{valid: boolean, error?: string}} - Validation result
   */
  validateUrl(urlString) {
    return URLValidator.validate(urlString);
  }

  /**
   * Fetch content from a URL
   * @param {string} url - The URL to fetch
   * @returns {{content: string, contentType: string}} - Fetched content
   * @throws {URLFetchError} - On fetch errors
   */
  async fetchUrl(url) {
    // Validate URL first
    const validation = this.validateUrl(url);
    if (!validation.valid) {
      throw new URLFetchError(url, validation.error);
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ez-agents/1.0'
        },
        signal: controller.signal,
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      // Check for HTTP errors
      if (!response.ok) {
        throw new URLFetchError(
          url, 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Get content type
      const contentType = response.headers.get('content-type') || 'text/plain';

      // Get content
      const content = await response.text();

      return {
        content,
        contentType
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new URLFetchError(url, `Request timeout after ${this.timeout}ms`);
      }
      
      if (err.name === 'URLFetchError') {
        throw err;
      }

      throw new URLFetchError(url, `Network error: ${err.message}`);
    }
  }

  /**
   * Prompt user for confirmation before fetching a URL
   * @param {string} url - The URL to fetch
   * @returns {Promise<boolean>} - True if user confirmed
   */
  static async confirmUrlFetch(url) {
    const readline = require('readline');
    
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(`Fetch ${url}? (y/n): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }
}

module.exports = URLFetchService;
module.exports.URLValidator = URLValidator;
