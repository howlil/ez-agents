/**
 * Analytics Collector — Feature usage event collection and local storage
 * Stores events in .planning/analytics/events.json
 */

const fs = require('fs');
const path = require('path');

class AnalyticsCollector {
  constructor(cwd) {
    this.cwd = cwd || process.cwd();
    this.eventsPath = path.join(this.cwd, '.planning', 'analytics', 'events.json');
    this.ensureDir();
  }

  /**
   * Track an analytics event
   * @param {Object} event - Event data { type, userId, properties }
   */
  async trackEvent(event) {
    const data = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      userId: event.userId || 'anonymous',
      properties: event.properties || {}
    };

    await this.appendToJsonFile(data);
  }

  /**
   * Get events by type
   * @param {string} type - Event type to filter
   * @returns {Array} Filtered events
   */
  getEventsByType(type) {
    if (!fs.existsSync(this.eventsPath)) return [];
    
    const events = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
    return events.filter(e => e.eventType === type);
  }

  /**
   * Get all events
   * @returns {Array} All events
   */
  getAllEvents() {
    if (!fs.existsSync(this.eventsPath)) return [];
    return JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
  }

  /**
   * Ensure analytics directory exists
   */
  ensureDir() {
    const dir = path.dirname(this.eventsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.eventsPath)) {
      fs.writeFileSync(this.eventsPath, '[]', 'utf8');
    }
  }

  /**
   * Append data to JSON file
   * @param {Object} data - Data to append
   */
  async appendToJsonFile(data) {
    const events = this.getAllEvents();
    events.push(data);
    fs.writeFileSync(this.eventsPath, JSON.stringify(events, null, 2), 'utf8');
  }
}

/**
 * Track an analytics event
 * @param {Object} event - Event data
 * @param {string} cwd - Working directory
 */
async function trackEvent(event, cwd) {
  const collector = new AnalyticsCollector(cwd);
  return collector.trackEvent(event);
}

module.exports = { AnalyticsCollector, trackEvent };
