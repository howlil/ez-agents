/**
 * HTTPS Request Handler
 *
 * Pure function for making HTTPS requests.
 * Shared across all model provider adapters.
 *
 * @example
 * ```typescript
 * const response = await httpsRequest(
 *   { hostname: 'api.example.com', path: '/v1/chat', method: 'POST', headers },
 *   { message: 'Hello' }
 * );
 * ```
 */

import * as https from 'https';
import type { HttpsRequestOptions } from '../ModelProviderAdapter.js';

/**
 * Make HTTPS request
 *
 * @param options - HTTPS request options
 * @param data - Request data to send
 * @returns Parsed response data
 */
export async function httpsRequest(
  options: HttpsRequestOptions,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve({ raw: body });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

export default httpsRequest;
