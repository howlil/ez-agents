/**
 * Deploy Health Check — Verifies deployment success
 * Checks deployment URL for healthy response
 */

const https = require('https');
const http = require('http');

class DeployHealthCheck {
  constructor(timeout = 10000) {
    this.timeout = timeout;
  }

  /**
   * Check health of deployment URL
   * @param {string} url - Deployment URL to check
   * @param {Array} endpoints - Additional endpoints to check
   * @returns {Object} Health result { healthy, status, message }
   */
  async checkHealth(url, endpoints = []) {
    const allEndpoints = [url, ...endpoints];
    const results = [];

    for (const endpoint of allEndpoints) {
      try {
        const result = await this.checkEndpoint(endpoint);
        results.push(result);
      } catch (e) {
        results.push({
          url: endpoint,
          healthy: false,
          status: 'error',
          message: e.message
        });
      }
    }

    const allHealthy = results.every(r => r.healthy);
    return {
      healthy: allHealthy,
      results,
      message: allHealthy ? 'All endpoints healthy' : 'Some endpoints unhealthy'
    };
  }

  /**
   * Check single endpoint
   * @param {string} url - URL to check
   * @returns {Object} Health result
   */
  async checkEndpoint(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const req = protocol.get(url, { timeout: this.timeout }, (res) => {
        if (res.statusCode === 200) {
          resolve({ url, healthy: true, status: res.statusCode, message: 'OK' });
        } else if (res.statusCode >= 500) {
          resolve({ url, healthy: false, status: res.statusCode, message: 'Server Error' });
        } else {
          resolve({ url, healthy: true, status: res.statusCode, message: 'OK (non-200)' });
        }
      });

      req.on('error', (e) => {
        resolve({ url, healthy: false, status: 'error', message: e.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ url, healthy: false, status: 'timeout', message: 'Request timed out' });
      });
    });
  }
}

/**
 * Check health of deployment URL
 * @param {string} url - Deployment URL
 * @param {Array} endpoints - Additional endpoints
 * @returns {Object} Health result
 */
async function checkHealth(url, endpoints = []) {
  const checker = new DeployHealthCheck();
  return checker.checkHealth(url, endpoints);
}

module.exports = { DeployHealthCheck, checkHealth };
