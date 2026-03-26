/**
 * EZ Tools Tests - frontmatter.cjs
 *
 * Tests for the hand-rolled YAML parser's pure function exports:
 * extractFrontmatter, reconstructFrontmatter, spliceFrontmatter,
 * parseMustHavesBlock, and FRONTMATTER_SCHEMAS.
 *
 * Includes REG-04 regression: quoted comma inline array edge case.
 */



import {
  extractFrontmatter,
  reconstructFrontmatter,
  spliceFrontmatter,
  parseMustHavesBlock,
  FRONTMATTER_SCHEMAS,
} from '../../bin/lib/frontmatter.js';

// ─── extractFrontmatter ─────────────────────────────────────────────────────

describe('extractFrontmatter', () => {
  test('parses simple key-value pairs', () => {
    const content = '---\nname: foo\ntype: execute\n---\nbody';
    const result = extractFrontmatter(content);
    expect(result?.name).toBe('foo');
    assert.strictEqual(result?.type, 'execute');
  });

  test('strips quotes from values', () => {
    const doubleQuoted = '---\nname: "foo"\n---\n';
    const singleQuoted = '---\nname: \'foo\'\n---\n';
    expect(extractFrontmatter(doubleQuoted).name).toBe('foo');
    assert.strictEqual(extractFrontmatter(singleQuoted).name, 'foo');
  });

  test('parses nested objects', () => {
    const content = '---\ntechstack:\n  added: prisma\n  patterns: repository\n---\n';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result.techstack, { added: 'prisma', patterns: 'repository' });
  });

  test('parses block arrays', () => {
    const content = '---\nitems:\n  - alpha\n  - beta\n  - gamma\n---\n';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result.items, ['alpha', 'beta', 'gamma']);
  });

  test('parses inline arrays', () => {
    const content = '---\nkey: [a, b, c]\n---\n';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result.key, ['a', 'b', 'c']);
  });

  test('handles quoted commas in inline arrays — REG-04 known limitation', () => {
    // REG-04: The split(',') on line 53 does NOT respect quotes.
    // The parser WILL split on commas inside quotes, producing wrong results.
    // This test documents the CURRENT (buggy) behavior.
    const content = '---\nkey: ["a, b", c]\n---\n';
    const result = extractFrontmatter(content);
    // Current behavior: splits on ALL commas, producing 3 items instead of 2
    // Expected correct behavior would be: ["a, b", "c"]
    // Actual current behavior: ["a", "b", "c"] (split ignores quotes)
    expect(Array.isArray(result.key)).toBeTruthy() // 'should produce an array';
    expect(result.key.length >= 2).toBeTruthy() // 'should produce at least 2 items from comma split';
    // The bug produces ["a", "b\"", "c"] or similar — the exact output depends on
    // how the regex strips quotes after the split.
    // We verify the key insight: the result has MORE items than intended (known limitation).
    expect(result.key.length > 2).toBeTruthy() // 'REG-04: split produces more items than intended due to quoted comma bug';
  });

  test('returns empty object for no frontmatter', () => {
    const content = 'Just plain content, no frontmatter.';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result, {});
  });

  test('returns empty object for empty frontmatter', () => {
    const content = '---\n---\nBody text.';
    const result = extractFrontmatter(content);
    assert.deepStrictEqual(result, {});
  });

  test('parses frontmatter-only content', () => {
    const content = '---\nkey: val\n---';
    const result = extractFrontmatter(content);
    expect(result?.key).toBe('val');
  });

  test('handles emoji and non-ASCII in values', () => {
    const content = '---\nname: "Hello World"\nlabel: "cafe"\n---\n';
    const result = extractFrontmatter(content);
    expect(result?.name).toBe('Hello World');
    assert.strictEqual(result?.label, 'cafe');
  });

  test('converts empty-object placeholders to arrays when dash items follow', () => {
    // When a key has no value, it gets an empty {} placeholder.
    // When "- item" lines follow, the parser converts {} to [].
    const content = '---\nrequirements:\n  - REQ-01\n  - REQ-02\n---\n';
    const result = extractFrontmatter(content);
    expect(Array.isArray(result.requirements)).toBeTruthy() // 'should convert placeholder object to array';
    assert.deepStrictEqual(result.requirements, ['REQ-01', 'REQ-02']);
  });

  test('skips empty lines in YAML body', () => {
    const content = '---\nfirst: one\n\nsecond: two\n\nthird: three\n---\n';
    const result = extractFrontmatter(content);
    expect(result?.first).toBe('one');
    assert.strictEqual(result?.second, 'two');
    expect(result?.third).toBe('three');
  });
});

// ─── reconstructFrontmatter ─────────────────────────────────────────────────

describe('reconstructFrontmatter', () => {
  test('serializes simple key-value', () => {
    const result = reconstructFrontmatter({ name: 'foo' });
    expect(result).toBe('name: foo');
  });

  test('serializes empty array as inline []', () => {
    const result = reconstructFrontmatter({ items: [] });
    expect(result).toBe('items: []');
  });

  test('serializes short string arrays inline', () => {
    const result = reconstructFrontmatter({ key: ['a', 'b', 'c'] });
    expect(result).toBe('key: [a, b, c]');
  });

  test('serializes long arrays as block', () => {
    const result = reconstructFrontmatter({ key: ['one', 'two', 'three', 'four'] });
    expect(result.includes('key:')).toBeTruthy() // 'should have key header';
    expect(result.includes('  - one')).toBeTruthy() // 'should have block array items';
    expect(result.includes('  - four')).toBeTruthy() // 'should have last item';
  });

  test('quotes values containing colons or hashes', () => {
    const result = reconstructFrontmatter({ url: 'http://example.com' });
    expect(result.includes('"http://example.com"')).toBeTruthy() // 'should quote value with colon';

    const hashResult = reconstructFrontmatter({ comment: 'value # note' });
    expect(hashResult.includes('"value # note"')).toBeTruthy() // 'should quote value with hash';
  });

  test('serializes nested objects with proper indentation', () => {
    const result = reconstructFrontmatter({ tech: { added: 'prisma', patterns: 'repo' } });
    expect(result.includes('tech:')).toBeTruthy() // 'should have parent key';
    expect(result.includes('  added: prisma')).toBeTruthy() // 'should have indented child';
    expect(result.includes('  patterns: repo')).toBeTruthy() // 'should have indented child';
  });

  test('serializes nested arrays within objects', () => {
    const result = reconstructFrontmatter({
      tech: { added: ['prisma', 'jose'] },
    });
    expect(result.includes('tech:')).toBeTruthy() // 'should have parent key';
    expect(result.includes('  added: [prisma).toBeTruthy() // jose]', 'should serialize nested short array inline');
  });

  test('skips null and undefined values', () => {
    const result = reconstructFrontmatter({ name: 'foo', skip: null, also: undefined, keep: 'bar' });
    expect(!result.includes('skip')).toBeTruthy() // 'should not include null key';
    expect(!result.includes('also')).toBeTruthy() // 'should not include undefined key';
    expect(result.includes('name: foo')).toBeTruthy() // 'should include non-null key';
    expect(result.includes('keep: bar')).toBeTruthy() // 'should include non-null key';
  });

  test('round-trip: simple frontmatter', () => {
    const original = '---\nname: test\ntype: execute\nwave: 1\n---\n';
    const extracted1 = extractFrontmatter(original);
    const reconstructed = reconstructFrontmatter(extracted1);
    const roundTrip = `---\n${reconstructed}\n---\n`;
    const extracted2 = extractFrontmatter(roundTrip);
    assert.deepStrictEqual(extracted2, extracted1, 'round-trip should preserve data identity');
  });

  test('round-trip: nested with arrays', () => {
    const original = '---\nphase: 01\ntech:\n  added:\n    - prisma\n    - jose\n  patterns:\n    - repository\n    - jwt\n---\n';
    const extracted1 = extractFrontmatter(original);
    const reconstructed = reconstructFrontmatter(extracted1);
    const roundTrip = `---\n${reconstructed}\n---\n`;
    const extracted2 = extractFrontmatter(roundTrip);
    assert.deepStrictEqual(extracted2, extracted1, 'round-trip should preserve nested structures');
  });

  test('round-trip: multiple data types', () => {
    const original = '---\nname: testplan\nwave: 2\ntags: [auth, api, db]\ndeps:\n  - dep1\n  - dep2\nconfig:\n  enabled: true\n  count: 5\n---\n';
    const extracted1 = extractFrontmatter(original);
    const reconstructed = reconstructFrontmatter(extracted1);
    const roundTrip = `---\n${reconstructed}\n---\n`;
    const extracted2 = extractFrontmatter(roundTrip);
    assert.deepStrictEqual(extracted2, extracted1, 'round-trip should preserve multiple data types');
  });
});

// ─── spliceFrontmatter ──────────────────────────────────────────────────────

describe('spliceFrontmatter', () => {
  test('replaces existing frontmatter preserving body', () => {
    const content = '---\nphase: 01\ntype: execute\n---\n\n# Body Content\n\nParagraph here.';
    const newObj = { phase: '02', type: 'tdd', wave: '1' };
    const result = spliceFrontmatter(content, newObj);

    // New frontmatter should be present
    const extracted = extractFrontmatter(result);
    expect(extracted.phase).toBe('02');
    assert.strictEqual(extracted.type, 'tdd');
    expect(extracted.wave).toBe('1');

    // Body should be preserved
    expect(result.includes('# Body Content')).toBeTruthy() // 'body heading should be preserved';
    expect(result.includes('Paragraph here.')).toBeTruthy() // 'body paragraph should be preserved';
  });

  test('adds frontmatter to content without any', () => {
    const content = 'Plain text with no frontmatter.';
    const newObj = { phase: '01', plan: '01' };
    const result = spliceFrontmatter(content, newObj);

    // Should start with frontmatter delimiters
    expect(result.startsWith('---\n')).toBeTruthy() // 'should start with opening delimiter';
    expect(result.includes('\n---\n')).toBeTruthy() // 'should have closing delimiter';

    // Original content should follow
    expect(result.includes('Plain text with no frontmatter.')).toBeTruthy() // 'original content should be preserved';

    // Frontmatter should be extractable
    const extracted = extractFrontmatter(result);
    expect(extracted.phase).toBe('01');
    assert.strictEqual(extracted.plan, '01');
  });

  test('preserves content after frontmatter delimiters exactly', () => {
    const body = '\n\nExact content with special chars: $, %, &, <, >\nLine 2\nLine 3';
    const content = '---\nold: value\n---' + body;
    const newObj = { new: 'value' };
    const result = spliceFrontmatter(content, newObj);

    // The body after the closing --- should be exactly preserved
    const closingIdx = result.indexOf('\n---', 4); // skip the opening ---
    const resultBody = result.slice(closingIdx + 4); // skip \n---
    expect(resultBody).toBe(body, 'body content after frontmatter should be exactly preserved');
  });
});

// ─── parseMustHavesBlock ────────────────────────────────────────────────────

describe('parseMustHavesBlock', () => {
  test('extracts truths as string array', () => {
    const content = `---
phase: 01
must_haves:
    truths:
      - "All tests pass on CI"
      - "Coverage exceeds 80%"
---

Body content.`;
    const result = parseMustHavesBlock(content, 'truths');
    expect(Array.isArray(result)).toBeTruthy() // 'should return an array';
    expect(result?.length).toBe(2);
    assert.strictEqual(result[0], 'All tests pass on CI');
    expect(result[1]).toBe('Coverage exceeds 80%');
  });

  test('extracts artifacts as object array', () => {
    const content = `---
phase: 01
must_haves:
    artifacts:
      - path: "src/auth.ts"
        provides: "JWT authentication"
        min_lines: 100
      - path: "src/middleware.ts"
        provides: "Route protection"
        min_lines: 50
---

Body.`;
    const result = parseMustHavesBlock(content, 'artifacts');
    expect(Array.isArray(result)).toBeTruthy() // 'should return an array';
    expect(result?.length).toBe(2);
    assert.strictEqual(result![0]?.path, 'src/auth.ts');
    expect(result![0]?.provides).toBe('JWT authentication');
    assert.strictEqual(result![0]?.min_lines, 100);
    expect(result![1]?.path).toBe('src/middleware.ts');
    assert.strictEqual(result![1]?.min_lines, 50);
  });

  test('extracts key_links with from/to/via/pattern fields', () => {
    const content = `---
phase: 01
must_haves:
    key_links:
      - from: "tests/auth.test.ts"
        to: "src/auth.ts"
        via: "import statement"
        pattern: "import.*auth"
---
`;
    const result = parseMustHavesBlock(content, 'key_links');
    expect(Array.isArray(result)).toBeTruthy() // 'should return an array';
    expect(result?.length).toBe(1);
    assert.strictEqual(result![0]?.from, 'tests/auth.test.ts');
    expect(result![0]?.to).toBe('src/auth.ts');
    assert.strictEqual(result![0]?.via, 'import statement');
    expect(result![0]?.pattern).toBe('import.*auth');
  });

  test('returns empty array when block not found', () => {
    const content = `---
phase: 01
must_haves:
    truths:
      - "Some truth"
---
`;
    const result = parseMustHavesBlock(content, 'nonexistent_block');
    assert.deepStrictEqual(result, []);
  });

  test('returns empty array when no frontmatter', () => {
    const content = 'Plain text without any frontmatter delimiters.';
    const result = parseMustHavesBlock(content, 'truths');
    assert.deepStrictEqual(result, []);
  });

  test('handles nested arrays within artifact objects', () => {
    const content = `---
phase: 01
must_haves:
    artifacts:
      - path: "src/api.ts"
        provides: "REST endpoints"
        exports:
          - "GET"
          - "POST"
---
`;
    const result = parseMustHavesBlock(content, 'artifacts');
    expect(Array.isArray(result)).toBeTruthy() // 'should return an array';
    expect(result?.length).toBe(1);
    assert.strictEqual(result![0]?.path, 'src/api.ts');
    // The nested array should be captured
    expect(result![0]?.exports !== undefined).toBeTruthy() // 'should have exports field';
  });
});

