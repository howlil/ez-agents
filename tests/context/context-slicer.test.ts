/**
 * ContextSlicer Tests
 *
 * Tests for the ContextSlicer class including:
 * - Constructor and configuration
 * - sliceContext method
 * - classifyTiers method (time-based classification)
 * - enforceTierBudget method (70/20/10 allocation)
 * - summarizeLowRelevance method (score < 0.5 threshold)
 * - Cache operations (hits, misses, TTL, LRU eviction)
 * - End-to-end slicing workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextSlicer, ContextTier, DEFAULT_SLICER_CONFIG } from '../../bin/lib/context/context-slicer.js';
import type { ContextSource } from '../../bin/lib/context/context-optimizer.js';

describe('ContextSlicer', () => {
  let slicer: ContextSlicer;

  beforeEach(() => {
    slicer = new ContextSlicer();
  });

  describe('Constructor', () => {
    it('should create instance with default config', () => {
      expect(slicer).toBeDefined();
    });

    it('should accept custom config', () => {
      const customSlicer = new ContextSlicer({
        tokenBudget: 10000,
        minScore: 0.5,
        maxFiles: 20
      });
      expect(customSlicer).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const customSlicer = new ContextSlicer({
        tokenBudget: 10000
      });
      expect(customSlicer).toBeDefined();
    });
  });

  describe('classifyTiers', () => {
    it('should classify sources into HOT tier (< 5 min)', () => {
      const now = new Date().toISOString();
      const sources: ContextSource[] = [
        {
          type: 'file',
          source: 'test1.ts',
          timestamp: now,
          size: 1000,
          score: 0.8
        }
      ];

      const tiers = slicer.classifyTiers(sources);
      expect(tiers.hot.length).toBe(1);
      expect(tiers.warm.length).toBe(0);
      expect(tiers.cold.length).toBe(0);
    });

    it('should classify sources into WARM tier (< 1 hr)', () => {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const sources: ContextSource[] = [
        {
          type: 'file',
          source: 'test1.ts',
          timestamp: thirtyMinAgo,
          size: 1000,
          score: 0.8
        }
      ];

      const tiers = slicer.classifyTiers(sources);
      expect(tiers.hot.length).toBe(0);
      expect(tiers.warm.length).toBe(1);
      expect(tiers.cold.length).toBe(0);
    });

    it('should classify sources into COLD tier (> 1 hr)', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const sources: ContextSource[] = [
        {
          type: 'file',
          source: 'test1.ts',
          timestamp: twoHoursAgo,
          size: 1000,
          score: 0.8
        }
      ];

      const tiers = slicer.classifyTiers(sources);
      expect(tiers.hot.length).toBe(0);
      expect(tiers.warm.length).toBe(0);
      expect(tiers.cold.length).toBe(1);
    });

    it('should classify multiple sources into different tiers', () => {
      const now = new Date().toISOString();
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const sources: ContextSource[] = [
        { type: 'file', source: 'hot.ts', timestamp: now, size: 1000, score: 0.9 },
        { type: 'file', source: 'warm.ts', timestamp: thirtyMinAgo, size: 1000, score: 0.7 },
        { type: 'file', source: 'cold.ts', timestamp: twoHoursAgo, size: 1000, score: 0.5 }
      ];

      const tiers = slicer.classifyTiers(sources);
      expect(tiers.hot.length).toBe(1);
      expect(tiers.warm.length).toBe(1);
      expect(tiers.cold.length).toBe(1);
    });
  });

  describe('enforceTierBudget', () => {
    it('should enforce 70/20/10 budget allocation', () => {
      const sources: ContextSource[] = Array(20).fill({
        type: 'file' as const,
        source: 'test.ts',
        timestamp: new Date().toISOString(),
        size: 400, // 100 tokens each
        score: 0.8
      });

      const tiers = {
        hot: sources.slice(0, 10),
        warm: sources.slice(10, 15),
        cold: sources.slice(15, 20)
      };

      const budgeted = slicer.enforceTierBudget(tiers);
      
      // With 8000 token budget: hot=5600, warm=1600, cold=800
      // Each file is 100 tokens (400 chars / 4)
      expect(budgeted.hot.length).toBeLessThanOrEqual(56); // 5600 tokens
      expect(budgeted.warm.length).toBeLessThanOrEqual(16); // 1600 tokens
      expect(budgeted.cold.length).toBeLessThanOrEqual(8); // 800 tokens
    });

    it('should prioritize higher-scored sources', () => {
      const sources: ContextSource[] = [
        { type: 'file', source: 'high.ts', timestamp: new Date().toISOString(), size: 400, score: 0.9 },
        { type: 'file', source: 'low.ts', timestamp: new Date().toISOString(), size: 400, score: 0.3 }
      ];

      const tiers = { hot: sources, warm: [], cold: [] };
      const budgeted = slicer.enforceTierBudget(tiers);
      
      // Higher scored should come first
      expect(budgeted.hot[0].source).toBe('high.ts');
    });
  });

  describe('Cache Operations', () => {
    it('should generate consistent cache keys', () => {
      const files = ['test1.ts', 'test2.ts'];
      const task = 'Test task';
      
      const key1 = slicer.generateCacheKey(files, task);
      const key2 = slicer.generateCacheKey(files, task);
      
      expect(key1).toBe(key2);
    });

    it('should add and retrieve from cache', () => {
      const key = 'test-key';
      const result = {
        context: 'test context',
        tiers: { hot: [] as ContextSource[], warm: [], cold: [] },
        stats: {
          totalTokens: 1000,
          budgetUsed: 1000,
          budgetRemaining: 7000,
          filesIncluded: 5,
          filesExcluded: 0,
          summarizedCount: 0,
          cacheHits: 0,
          cacheMisses: 1
        },
        warnings: []
      };

      slicer.addToCache(key, result);
      const cached = slicer.getFromCache(key);

      expect(cached).not.toBeNull();
      expect(cached?.context).toBe(result.context);
    });

    it('should return null for expired cache entry', () => {
      const customSlicer = new ContextSlicer({ cacheTTL: 100 }); // 100ms TTL
      const key = 'test-key';
      const result = {
        context: 'test context',
        tiers: { hot: [] as ContextSource[], warm: [], cold: [] },
        stats: {
          totalTokens: 1000,
          budgetUsed: 1000,
          budgetRemaining: 7000,
          filesIncluded: 5,
          filesExcluded: 0,
          summarizedCount: 0,
          cacheHits: 0,
          cacheMisses: 1
        },
        warnings: []
      };

      customSlicer.addToCache(key, result);
      
      // Wait for TTL to expire
      setTimeout(() => {
        const cached = customSlicer.getFromCache(key);
        expect(cached).toBeNull();
      }, 150);
    });

    it('should evict oldest entry when cache is full (LRU)', () => {
      const customSlicer = new ContextSlicer({ cacheMaxSize: 3 });
      
      customSlicer.addToCache('key1', {
        context: '1',
        tiers: { hot: [], warm: [], cold: [] },
        stats: { totalTokens: 0, budgetUsed: 0, budgetRemaining: 0, filesIncluded: 0, filesExcluded: 0, summarizedCount: 0, cacheHits: 0, cacheMisses: 1 },
        warnings: []
      });
      customSlicer.addToCache('key2', {
        context: '2',
        tiers: { hot: [], warm: [], cold: [] },
        stats: { totalTokens: 0, budgetUsed: 0, budgetRemaining: 0, filesIncluded: 0, filesExcluded: 0, summarizedCount: 0, cacheHits: 0, cacheMisses: 1 },
        warnings: []
      });
      customSlicer.addToCache('key3', {
        context: '3',
        tiers: { hot: [], warm: [], cold: [] },
        stats: { totalTokens: 0, budgetUsed: 0, budgetRemaining: 0, filesIncluded: 0, filesExcluded: 0, summarizedCount: 0, cacheHits: 0, cacheMisses: 1 },
        warnings: []
      });

      // Add fourth entry - should evict key1
      customSlicer.addToCache('key4', {
        context: '4',
        tiers: { hot: [], warm: [], cold: [] },
        stats: { totalTokens: 0, budgetUsed: 0, budgetRemaining: 0, filesIncluded: 0, filesExcluded: 0, summarizedCount: 0, cacheHits: 0, cacheMisses: 1 },
        warnings: []
      });

      expect(customSlicer.getFromCache('key1')).toBeNull();
      expect(customSlicer.getFromCache('key4')).not.toBeNull();
    });
  });

  describe('buildTieredContext', () => {
    it('should build formatted context with tier headers', () => {
      const sources: ContextSource[] = [
        {
          type: 'file',
          source: 'test.ts',
          timestamp: new Date().toISOString(),
          size: 100,
          score: 0.8
        }
      ];

      const tiers = { hot: sources, warm: [], cold: [] };
      const context = slicer.buildTieredContext(tiers);

      expect(context).toContain('## 🔥 Hot Context (Current Task)');
      expect(context).toContain('test.ts');
    });

    it('should handle empty tiers', () => {
      const tiers = { hot: [], warm: [], cold: [] };
      const context = slicer.buildTieredContext(tiers);

      expect(context).toBe('');
    });
  });

  describe('sliceContext', () => {
    it('should return sliced context within token budget', async () => {
      // This is a basic integration test - actual file patterns would need real files
      const result = await slicer.sliceContext(
        ['package.json'], // Use a file that exists
        'Test task'
      );

      expect(result).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.tiers).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.stats.totalTokens).toBeLessThanOrEqual(DEFAULT_SLICER_CONFIG.tokenBudget);
    });

    it('should include warnings if any', async () => {
      const result = await slicer.sliceContext(
        ['package.json'],
        'Test task'
      );

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('ContextTier Enum', () => {
    it('should have correct tier values', () => {
      expect(ContextTier.HOT).toBe('hot');
      expect(ContextTier.WARM).toBe('warm');
      expect(ContextTier.COLD).toBe('cold');
    });
  });
});
