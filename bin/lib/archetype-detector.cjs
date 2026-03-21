/**
 * Archetype Detector — Project type classification from codebase patterns
 * 
 * Provides:
 * - detect(structure, stack, flows): Pattern-based archetype detection
 * - calculateConfidence(archetype, evidence): Confidence scoring
 */

const fs = require('fs');
const path = require('path');

class ArchetypeDetector {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.archetypePatterns = {
      dashboard: {
        patterns: ['Chart', 'Metric', 'Dashboard', 'Admin', 'Analytics', 'stats', 'metrics', 'analytics', 'report', 'widget', 'kpi', 'graph', 'visualization'],
        description: 'Data visualization and admin dashboard application',
        keywords: ['chart', 'graph', 'dashboard', 'analytics', 'metrics', 'admin', 'report']
      },
      POS: {
        patterns: ['Product', 'Order', 'Payment', 'Cart', 'Checkout', 'Inventory', 'Store', 'Register', 'Terminal', 'Sale', 'Receipt', 'Barcode', 'POS', 'Retail'],
        description: 'Point of Sale system for retail transactions',
        keywords: ['pos', 'retail', 'checkout', 'register', 'terminal', 'payment', 'inventory'],
        uniquePatterns: ['Register', 'Terminal', 'Sale', 'Receipt', 'Barcode', 'POS', 'Retail']
      },
      SaaS: {
        patterns: ['Subscription', 'Tenant', 'Plan', 'Billing', 'User', 'Account', 'Recurring', 'License', 'Seat', 'Tier'],
        description: 'Software as a Service with subscription model',
        keywords: ['saas', 'subscription', 'tenant', 'multi-tenant', 'billing', 'recurring']
      },
      ecommerce: {
        patterns: ['Cart', 'Checkout', 'Product', 'Order', 'Shipping', 'Payment', 'Catalog', 'Wishlist', 'Review', 'Coupon'],
        description: 'E-commerce platform for online sales',
        keywords: ['ecommerce', 'shop', 'store', 'cart', 'checkout', 'product', 'order'],
        uniquePatterns: ['Shipping', 'Wishlist', 'Review', 'Coupon', 'Catalog']
      },
      LMS: {
        patterns: ['Course', 'Lesson', 'Student', 'Teacher', 'Quiz', 'Enrollment', 'Curriculum', 'Assignment', 'Grade', 'Certificate'],
        description: 'Learning Management System for education',
        keywords: ['lms', 'education', 'course', 'learning', 'student', 'teacher', 'lesson']
      },
      booking: {
        patterns: ['Appointment', 'Booking', 'Availability', 'Calendar', 'Reservation', 'Schedule', 'TimeSlot', 'Venue', 'Resource'],
        description: 'Booking and appointment scheduling system',
        keywords: ['booking', 'appointment', 'schedule', 'calendar', 'reservation', 'availability']
      },
      fintech: {
        patterns: ['Transaction', 'Account', 'Payment', 'Balance', 'Compliance', 'KYC', 'AML', 'Wallet', 'Transfer', 'Ledger', 'Audit'],
        description: 'Financial technology application',
        keywords: ['fintech', 'finance', 'banking', 'payment', 'transaction', 'compliance', 'kyc']
      },
      internalTools: {
        patterns: ['Admin', 'CRUD', 'Form', 'Table', 'Dashboard', 'Report', 'Config', 'Setting', 'Management', 'Panel'],
        description: 'Internal business tools and admin panels',
        keywords: ['internal', 'admin', 'tools', 'crud', 'management', 'panel', 'config']
      },
      social: {
        patterns: ['Post', 'Feed', 'Comment', 'Like', 'Share', 'Follow', 'Profile', 'Notification', 'Message', 'Chat'],
        description: 'Social networking or community platform',
        keywords: ['social', 'network', 'community', 'feed', 'post', 'comment', 'share']
      },
      marketplace: {
        patterns: ['Listing', 'Vendor', 'Seller', 'Buyer', 'Marketplace', 'Commission', 'Escrow', 'Bid', 'Auction'],
        description: 'Multi-vendor marketplace platform',
        keywords: ['marketplace', 'vendor', 'seller', 'buyer', 'listing', 'commission']
      },
      cms: {
        patterns: ['Content', 'Page', 'Article', 'Blog', 'Media', 'Publish', 'Draft', 'Editor', 'WYSIWYG', 'SEO'],
        description: 'Content Management System',
        keywords: ['cms', 'content', 'blog', 'article', 'publish', 'media', 'editor']
      },
      ERP: {
        patterns: ['Invoice', 'Purchase', 'Supplier', 'Warehouse', 'Stock', 'Manufacturing', 'HR', 'Payroll', 'Employee', 'Department'],
        description: 'Enterprise Resource Planning system',
        keywords: ['erp', 'enterprise', 'invoice', 'purchase', 'warehouse', 'manufacturing', 'hr']
      }
    };
  }

  /**
   * Detect project archetype from structure, stack, and flows
   * @param {object} structure - Structure object from CodebaseAnalyzer
   * @param {object} stack - Stack object from StackDetector
   * @param {object} flows - Flows object from BusinessFlowMapper
   * @returns {object} Detection result with archetype, confidence, evidence
   */
  detect(structure = null, stack = null, flows = null) {
    const scores = {};
    const evidence = {};

    // Initialize scores for all archetypes
    for (const archetype of Object.keys(this.archetypePatterns)) {
      scores[archetype] = 0;
      evidence[archetype] = [];
    }

    // Score from file/directory names
    if (structure) {
      this._scoreFromStructure(structure, scores, evidence);
    }

    // Score from stack/dependencies
    if (stack) {
      this._scoreFromStack(stack, scores, evidence);
    }

    // Score from business flows
    if (flows) {
      this._scoreFromFlows(flows, scores, evidence);
    }

    // Find highest scoring archetype
    let bestArchetype = 'internalTools'; // Default
    let bestScore = 0;

    for (const [archetype, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestArchetype = archetype;
      }
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(bestArchetype, evidence[bestArchetype], scores);

    return {
      archetype: bestArchetype,
      confidence: confidence.score,
      level: confidence.level,
      evidence: evidence[bestArchetype],
      allScores: scores,
      description: this.archetypePatterns[bestArchetype]?.description || 'Unknown project type',
      alternativeArchetypes: this._getAlternativeArchetypes(scores, bestArchetype)
    };
  }

  /**
   * Calculate confidence score
   * @param {string} archetype - Detected archetype
   * @param {Array} evidence - Array of evidence items
   * @param {object} allScores - All archetype scores
   * @returns {object} Confidence with score (0-100) and level (High/Medium/Low)
   */
  calculateConfidence(archetype, evidence = [], allScores = {}) {
    // Base score: evidence.length * 5 (reduced from 10)
    let score = evidence.length * 5;

    // Bonus for file matches: +5 per file (reduced from 20)
    const fileMatches = evidence.filter(e => e.type === 'file').length;
    score += fileMatches * 5;

    // Bonus for dependency matches: +3 per dependency (reduced from 15)
    const depMatches = evidence.filter(e => e.type === 'dependency').length;
    score += depMatches * 3;

    // Bonus for route matches: +2 per route (reduced from 10)
    const routeMatches = evidence.filter(e => e.type === 'route').length;
    score += routeMatches * 2;

    // Bonus for score gap (how much higher than second place)
    const archetypeScore = allScores[archetype] || 0;
    const otherScores = Object.values(allScores).filter(s => s !== archetypeScore);
    const secondBest = Math.max(...otherScores, 0);
    const gap = archetypeScore - secondBest;
    score += Math.min(gap * 2, 10); // Cap gap bonus at 10 (reduced from 20)

    // Cap at 100
    score = Math.min(score, 100);

    // Determine level
    let level = 'Low';
    if (score >= 80) {
      level = 'High';
    } else if (score >= 60) {
      level = 'Medium';
    }

    return {
      score,
      level,
      breakdown: {
        base: evidence.length * 5,
        fileBonus: fileMatches * 5,
        dependencyBonus: depMatches * 3,
        routeBonus: routeMatches * 2,
        gapBonus: Math.min(gap * 2, 10)
      }
    };
  }

  /**
   * Score from structure
   * @private
   */
  _scoreFromStructure(structure, scores, evidence) {
    const directories = structure.directories || [];
    const files = structure.files || [];

    // Score directories
    for (const dir of directories) {
      const dirName = path.basename(dir.path);
      this._matchPattern(dirName, scores, evidence, 'directory', dir.path);
    }

    // Score files
    for (const file of files) {
      const fileName = path.basename(file);
      this._matchPattern(fileName, scores, evidence, 'file', file);
    }
  }

  /**
   * Score from stack
   * @private
   */
  _scoreFromStack(stack, scores, evidence) {
    const frameworks = stack.frameworks || [];
    const databases = stack.databases || [];
    const infrastructure = stack.infrastructure || [];

    // Framework-based scoring
    const frameworkArchetypes = {
      'Next.js': ['dashboard', 'ecommerce', 'SaaS'],
      'React': ['dashboard', 'SaaS', 'social'],
      'Vue.js': ['dashboard', 'admin', 'cms'],
      'Angular': ['enterprise', 'ERP', 'dashboard'],
      'Express': ['API', 'SaaS', 'marketplace'],
      'NestJS': ['enterprise', 'SaaS', 'ERP'],
      'Django': ['cms', 'SaaS', 'marketplace'],
      'Ruby on Rails': ['SaaS', 'marketplace', 'ecommerce'],
      'Laravel': ['ecommerce', 'cms', 'SaaS'],
      'Spring Boot': ['enterprise', 'ERP', 'fintech'],
      'FastAPI': ['API', 'SaaS', 'dashboard']
    };

    for (const framework of frameworks) {
      for (const [archetype, archs] of Object.entries(frameworkArchetypes)) {
        if (archs.includes(framework) || framework.toLowerCase().includes(archetype.toLowerCase())) {
          scores[archetype] = (scores[archetype] || 0) + 5;
          if (evidence[archetype]) {
            evidence[archetype].push({
              type: 'dependency',
              value: framework,
              source: 'package.json'
            });
          }
        }
      }
    }

    // Database-based scoring
    const dbArchetypes = {
      'PostgreSQL': ['enterprise', 'fintech', 'ERP'],
      'MongoDB': ['social', 'marketplace', 'cms'],
      'Redis': ['social', 'marketplace', 'real-time'],
      'Prisma': ['SaaS', 'dashboard', 'ecommerce'],
      'SQLite': ['content', 'social', 'catalog']
    };

    for (const db of databases) {
      for (const [archetype, dbs] of Object.entries(dbArchetypes)) {
        if (dbs.includes(db) || db.toLowerCase().includes(archetype.toLowerCase())) {
          scores[archetype] = (scores[archetype] || 0) + 3;
          if (evidence[archetype]) {
            evidence[archetype].push({
              type: 'dependency',
              value: db,
              source: 'package.json'
            });
          }
        }
      }
    }
  }

  /**
   * Score from flows
   * @private
   */
  _scoreFromFlows(flows, scores, evidence) {
    const journeys = flows.journeys || {};

    // Score from journey categories
    for (const [category, journeyList] of Object.entries(journeys)) {
      if (Array.isArray(journeyList) && journeyList.length > 0) {
        for (const journey of journeyList) {
          const journeyName = journey.name.toLowerCase();
          this._matchPattern(journeyName, scores, evidence, 'route', journey.path);
        }
      }
    }
  }

  /**
   * Match pattern against archetype patterns
   * @private
   */
  _matchPattern(name, scores, evidence, type, source) {
    const normalizedName = name.toLowerCase();

    for (const [archetype, config] of Object.entries(this.archetypePatterns)) {
      for (const pattern of config.patterns) {
        if (normalizedName.includes(pattern.toLowerCase())) {
          // Base score
          let scoreBonus = 1;
          
          // Bonus for unique patterns (helps distinguish similar archetypes)
          if (config.uniquePatterns && config.uniquePatterns.includes(pattern)) {
            scoreBonus = 3; // Unique patterns worth more
          }
          
          scores[archetype] = (scores[archetype] || 0) + scoreBonus;

          // Avoid duplicate evidence
          const existingEvidence = evidence[archetype].find(
            e => e.value.toLowerCase() === pattern.toLowerCase() && e.source === source
          );

          if (!existingEvidence) {
            evidence[archetype].push({
              type,
              value: pattern,
              source,
              matched: name
            });
          }
          break;
        }
      }

      // Also check keywords
      for (const keyword of config.keywords) {
        if (normalizedName.includes(keyword.toLowerCase())) {
          scores[archetype] = (scores[archetype] || 0) + 2;
          evidence[archetype].push({
            type,
            value: keyword,
            source,
            matched: name
          });
          break;
        }
      }
    }
  }

  /**
   * Get alternative archetypes (close seconds)
   * @private
   */
  _getAlternativeArchetypes(scores, bestArchetype) {
    const sorted = Object.entries(scores)
      .filter(([archetype]) => archetype !== bestArchetype)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([archetype, score]) => ({
        archetype,
        score,
        description: this.archetypePatterns[archetype]?.description
      }));

    return sorted.filter(a => a.score > 0);
  }
}

module.exports = { ArchetypeDetector };
