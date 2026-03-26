# Phase 19: Analytics Implementation Tests - Research

**Created:** 2026-03-27
**Phase:** 19
**Milestone:** v8.0.0 Test Quality (100% Pass Rate)
**Requirements:** ANALYTICS-01 to ANALYTICS-06 (6 requirements, 24 tests)

---

## 1. Domain Overview

### What Analytics Systems Do

Analytics systems in the ez-agents context provide **usage tracking, user behavior analysis, and performance measurement** capabilities. The analytics module consists of five core components:

1. **NPSTracker** - Net Promoter Score tracking for user satisfaction measurement
   - Records user feedback scores (0-10)
   - Categorizes responses (promoters 9-10, passives 7-8, detractors 0-6)
   - Calculates NPS metric (% promoters - % detractors)
   - Tracks trends over time periods

2. **AnalyticsCollector** - Event and session tracking infrastructure
   - Records feature usage events with metadata
   - Manages user sessions (start/end/duration)
   - Provides event filtering and retrieval
   - Persists data to `.planning/analytics.json`

3. **AnalyticsReporter** - Report generation and export
   - Generates summary reports from collected data
   - Aggregates metrics from multiple sources
   - Exports reports in JSON/CSV formats
   - Schedules recurring reports

4. **CohortAnalyzer** - User cohort-based retention analysis
   - Defines cohorts by time period or criteria
   - Tracks user membership in cohorts
   - Calculates retention rates over time
   - Compares retention between cohorts

5. **FunnelAnalyzer** - Conversion funnel tracking
   - Defines multi-step funnels (e.g., onboarding, checkout)
   - Tracks user progression through steps
   - Calculates conversion rates per step
   - Identifies drop-off points

### Data Flow Architecture

```
User Actions → AnalyticsCollector.track() → .planning/analytics.json
              ↓
NPSTracker.recordResponse() → .planning/nps.json
              ↓
CohortAnalyzer.addUserToCohort() → .planning/cohorts.json
              ↓
FunnelAnalyzer.trackConversion() → .planning/funnels.json
              ↓
AnalyticsReporter.generateReport() → .planning/analytics/reports/
```

---

## 2. Implementation Patterns

### 2.1 NPSTracker Implementation (ANALYTICS-01)

**File:** `bin/lib/analytics/nps-tracker.ts`

**Current State:** Methods exist but need verification against test expectations

**Key Implementation Details:**

```typescript
// recordResponse() - Must categorize and persist
async recordResponse(response: NpsResponse): Promise<void> {
  // Validate score range (0-10)
  // Categorize: promoter (9-10), passive (7-8), detractor (0-6)
  // Add timestamp if not provided
  // Append to .planning/nps.json responses array
}

// calculateScore() - Must return NPS formula result
calculateScore(): NpsResult {
  // Count promoters, passives, detractors from responses
  // NPS = (promoters/total)*100 - (detractors/total)*100
  // Return { nps, promoters, passives, detractors, total, totalResponses }
}

// getTrendWithOptions() - Must return trend with direction
getTrendWithOptions(options?: TrendOptions): NpsTrend {
  // Sort responses by timestamp
  // Calculate cumulative NPS for each response
  // Determine direction: improving/declining/stable
  // Return { periods: [...], direction }
}
```

**Test Expectations:**
- `recordResponse()` must write to `.planning/nps.json` with `responses` array
- Each response must have `category` field auto-populated
- `calculateScore()` with 2 promoters, 1 passive, 1 detractor = NPS of 25
- `getTrendWithOptions()` must return object with `periods` array and `direction` string

### 2.2 AnalyticsCollector Implementation (ANALYTICS-02)

**File:** `bin/lib/analytics/analytics-collector.ts`

**Current State:** Methods implemented, need test validation

**Key Implementation Details:**

```typescript
// track() - Record event with auto-timestamp
async track(event: EventData): Promise<void> {
  // Create event with timestamp, name, userId, properties
  // Append to .planning/analytics.json events array
  // Use event.type as fallback for event.name
}

// startSession() - Generate unique session ID
async startSession(options: SessionOptions = {}): Promise<string> {
  // Generate ID: `session-${Date.now()}-${random(9)}`
  // Create session with startTime, userId
  // Persist to .planning/analytics.json sessions array
  // Return session ID
}

// endSession() - Calculate duration
async endSession(sessionId: string): Promise<void> {
  // Find session by ID
  // Set endTime to now
  // Calculate duration: Date.now() - startTime
  // Persist changes
}

// getEvents() - Filter events
getEvents(options?: { name?: string; userId?: string }): AnalyticsEvent[] {
  // Filter by name if provided
  // Filter by userId if provided
  // Return filtered array
}
```

**Test Expectations:**
- `track()` must create `.planning/analytics.json` if not exists
- `startSession()` must return string ID and create session record
- `endSession()` must set `duration` >= 0 (ms)
- `getEvents({ name: 'page_view' })` must return only matching events

### 2.3 AnalyticsReporter Implementation (ANALYTICS-03)

**File:** `bin/lib/analytics/analytics-reporter.ts`

**Current State:** Methods implemented, need test validation

**Key Implementation Details:**

```typescript
// generateReport() - Create summary report
async generateReport(options: AnalyticsReportOptions): Promise<AnalyticsReport> {
  // Read events and sessions from AnalyticsCollector
  // Calculate metrics: totalEvents, totalUsers, activeUsers
  // Return { generatedAt, period: { startDate, endDate }, metrics }
}

// aggregateMetrics() - Combine multiple sources
async aggregateMetrics(options: { sources: string[], startDate, endDate }): Promise<AggregatedMetrics> {
  // Count events, sessions, conversions
  // Return { summary: { totalEvents, totalSessions, totalUsers }, bySource: [...] }
}

// exportReport() - Write to file
async exportReport(report: AnalyticsReport, options: ExportOptions): Promise<string> {
  // Write to .planning/analytics/reports/{filename}.{format}
  // Support JSON and CSV formats
  // Return file path
}

// scheduleReport() - Create recurring schedule
async scheduleReport(options: ScheduleOptions): Promise<ReportSchedule> {
  // Generate schedule ID
  // Create schedule with cron, recipients, format
  // Persist to .planning/report-schedules.json
  // Return schedule config
}
```

**Test Expectations:**
- `generateReport()` must return object with `generatedAt`, `period`, `metrics`
- `aggregateMetrics()` with 3 sources must return `bySource` array of length 3
- `exportReport()` must create file that can be read back
- `scheduleReport()` must persist to `report-schedules.json`

### 2.4 CohortAnalyzer Implementation (ANALYTICS-04)

**File:** `bin/lib/analytics/cohort-analyzer.ts`

**Current State:** Methods implemented, need test validation

**Key Implementation Details:**

```typescript
// defineCohort() - Create cohort definition
async defineCohort(cohort: CohortDefinition): Promise<void> {
  // Create cohort with name, startDate, endDate, criteria
  // Initialize users array and size
  // Persist to .planning/cohorts.json cohorts array
}

// addUserToCohort() - Assign user by signup date
async addUserToCohort(userId: string, signupDate: string): Promise<void> {
  // Find cohort where signupDate is within [startDate, endDate]
  // Add userId to cohort's membership list
  // Persist to .planning/cohorts.json memberships object
}

// calculateRetention() - Compute retention rates
calculateRetention(cohortName: string, options?: { period?: string }): RetentionResult {
  // Get cohort members
  // Count active users per week (default 4 weeks)
  // Calculate rate = activeUsers / initialSize * 100
  // Return { cohort, periods: [{ period, rate }], initialSize }
}

// compareCohorts() - Comparative analysis
async compareCohorts(cohortNames: string[]): Promise<{ cohorts: Array<{ name, size, retention }> }> {
  // For each cohort, get member count
  // Calculate retention rate
  // Return array of cohort metrics
}

// getCohortMetrics() - Get comprehensive metrics
async getCohortMetrics(cohortName: string): Promise<{ cohort, size, activity, lifetimeValue }> {
  // Return size, activity rate, placeholder LTV
}

// recordActivity() - Track user activity (helper for retention)
async recordActivity(userId: string, timestamp: string): Promise<void> {
  // Append to .planning/cohorts.json activities object
}
```

**Test Expectations:**
- `defineCohort()` must create entry in `cohorts.json`
- `addUserToCohort()` must match signup date to cohort period
- `calculateRetention()` must return `periods` array with `rate >= 0`
- `compareCohorts()` must return object with `cohorts` array

### 2.5 FunnelAnalyzer Implementation (ANALYTICS-05)

**File:** `bin/lib/analytics/funnel-analyzer.ts`

**Current State:** Methods implemented, need test validation

**Key Implementation Details:**

```typescript
// defineFunnel() - Create funnel with steps
async defineFunnel(funnel: FunnelDefinition): Promise<void> {
  // Sort steps by order
  // Create funnel with name, steps, createdAt
  // Initialize conversions record
  // Persist to .planning/funnels.json
}

// trackConversion() - Record user progression
async trackConversion(funnelName: string, userId: string, completedSteps: string[]): Promise<void> {
  // Append conversion record with userId, steps, timestamp
  // Persist to .planning/funnels.json conversions object
}

// getConversionRates() - Calculate step rates
async getConversionRates(funnelName: string): Promise<{ funnel, steps: [{ name, users, rate }] }> {
  // Count unique users at each step
  // Calculate rate = usersAtStep / totalUsers * 100
  // Return funnel name and steps array
}

// getDropOffPoints() - Identify conversion losses
async getDropOffPoints(funnelName: string): Promise<{ points, totalUsers }> {
  // Compare user counts between consecutive steps
  // Calculate dropRate = (current - next) / current * 100
  // Return points array with fromStep, toStep, dropRate
}

// compareFunnels() - Comparative metrics
async compareFunnels(funnelNames: string[]): Promise<Record<string, { totalUsers, conversionRate, steps }>> {
  // For each funnel, count users and completion rate
  // Return object keyed by funnel name
}
```

**Test Expectations:**
- `defineFunnel()` must sort steps by order
- `trackConversion()` must append to conversions array
- `getConversionRates()` must return `steps` array with `users >= 0`
- `getDropOffPoints()` must return `points` array (can be empty)

### 2.6 Analytics CLI Tests (ANALYTICS-06)

**File:** `tests/analytics/analytics-cli.test.ts`

**Current State:** Tests expect CLI commands to not crash

**CLI Command Structure:**

```bash
# Event tracking
ez-agents analytics track --event=page_view --user=user-123 --props='{"page":"/home"}'

# Session management
ez-agents analytics session --start --user=user-456
ez-agents analytics session --end --id=<session-id>

# Report generation
ez-agents analytics report --type=weekly --format=json

# Data export
ez-agents analytics export --format=csv --output=analytics-export
```

**Test Expectations:**
- Commands must not throw exceptions
- `session --start` should output session ID
- `session --end` should complete without error
- All commands should work in temp project directory

**CLI Handler Location:** Need to verify/create `bin/lib/commands/analytics-cli.ts`

---

## 3. Test Patterns

### 3.1 Test Infrastructure

**Test Framework:** vitest (configured in package.json)

**Test File Pattern:** `tests/analytics/*.test.ts`

**Helper Functions (from `tests/helpers.ts`):**

```typescript
// Create isolated test environment
const tmpDir = createTempProject();
// Creates: tmpDir/.planning/phases/

// Run CLI commands
const result = runEzTools(['analytics', 'track', '--event=test'], tmpDir);

// Cleanup after test
cleanup(tmpDir);
```

### 3.2 Test Structure Pattern

```typescript
import * as path from 'path';
import * as fs from 'fs';
import { AnalyticsClass } from '../../bin/lib/analytics/analytics-class.js';

describe('AnalyticsClass', () => {
  let tmpDir: string;
  let instance: AnalyticsClass;

  beforeEach(() => {
    tmpDir = createTempProject();
    instance = new AnalyticsClass(tmpDir);
  });

  afterEach(() => cleanup(tmpDir));

  test('constructor does not throw', () => {
    expect(instance).toBeTruthy();
  });

  test('method() does expected behavior', async () => {
    // Arrange
    const inputData = { ... };

    // Act
    await instance.method(inputData);

    // Assert - Check file system
    const dataPath = path.join(tmpDir, '.planning', 'data.json');
    expect(fs.existsSync(dataPath)).toBeTruthy();

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    expect(data.field).toBe(expectedValue);
  });
});
```

### 3.3 Assertion Patterns

**File System Assertions:**
```typescript
// Check file exists
expect(fs.existsSync(filePath)).toBeTruthy();

// Check array length
expect(data.events.length).toBe(5);

// Check object properties
expect(session.userId).toBe('user-456');
expect(session.startTime).toBeTruthy();

// Check array filtering
const promoters = data.responses.filter(r => r.category === 'promoter');
expect(promoters.length).toBe(2);

// Check numeric ranges
expect(session.duration).toBeGreaterThanOrEqual(0);
expect(retention.periods[0]?.rate || 0).toBeGreaterThanOrEqual(0);
```

**Deep Equality:**
```typescript
// Use assert for deep comparison (project pattern)
import assert from 'node:assert';
assert.deepStrictEqual(recorded.properties, expected.properties, 'properties must match');
```

### 3.4 Test Data Patterns

**NPS Test Data:**
```typescript
// 4 responses: 2 promoters, 1 passive, 1 detractor
// NPS = (2/4)*100 - (1/4)*100 = 50 - 25 = 25
await tracker.recordResponse({ userId: 'u1', score: 10 });
await tracker.recordResponse({ userId: 'u2', score: 9 });
await tracker.recordResponse({ userId: 'u3', score: 8 });
await tracker.recordResponse({ userId: 'u4', score: 4 });
```

**Funnel Test Data:**
```typescript
// 10 users view page, 5 click, 2 submit
for (let i = 0; i < 10; i++) {
  await analyzer.trackConversion('signup', `user-${i}`, ['page_view']);
}
for (let i = 0; i < 5; i++) {
  await analyzer.trackConversion('signup', `user-${i}`, ['page_view', 'signup_click']);
}
for (let i = 0; i < 2; i++) {
  await analyzer.trackConversion('signup', `user-${i}`, ['page_view', 'signup_click', 'form_submit']);
}
```

**Cohort Test Data:**
```typescript
// 10 users in cohort, activity decreases over weeks
for (let i = 0; i < 10; i++) {
  await analyzer.addUserToCohort(`user-${i}`, '2026-01-15');
  await analyzer.recordActivity(`user-${i}`, '2026-01-15'); // week 0
}
for (let i = 0; i < 7; i++) {
  await analyzer.recordActivity(`user-${i}`, '2026-01-22'); // week 1
}
```

---

## 4. Technical Considerations

### 4.1 TypeScript Patterns

**Interface Definitions:**
- All data structures have explicit interfaces
- Optional properties marked with `?`
- Index signatures for dynamic keys: `[key: string]: unknown`

**Type Safety:**
- Strict mode enabled (`strict: true`)
- `exactOptionalPropertyTypes: true` - can't pass `undefined` for optional props
- `noUncheckedIndexedAccess: true` - array access returns `T | undefined`

**Async Patterns:**
- All I/O methods are `async`
- Return `Promise<void>` for mutations
- Return `Promise<T>` for queries

**Example:**
```typescript
export interface NpsResponse {
  userId?: string;
  score: number;  // Required
  feedback?: string;
  category?: NpsCategory;
  timestamp?: string | number;
  [key: string]: unknown;  // Flexible metadata
}
```

### 4.2 File Structure

```
bin/lib/analytics/
├── analytics-collector.ts    # Event/session tracking
├── analytics-reporter.ts     # Report generation
├── cohort-analyzer.ts        # Cohort retention
├── funnel-analyzer.ts        # Conversion funnels
└── nps-tracker.ts            # NPS scores

tests/analytics/
├── analytics-cli.test.ts     # CLI integration (5 tests)
├── analytics-collector.test.ts  # Collector unit (4 tests)
├── analytics-reporter.test.ts   # Reporter unit (4 tests)
├── cohort-analyzer.test.ts      # Cohort unit (5 tests)
├── funnel-analyzer.test.ts      # Funnel unit (5 tests)
└── nps-tracker.test.ts          # NPS unit (3 tests)

.planning/ (created by tests)
├── analytics.json          # Events and sessions
├── nps.json                # NPS responses
├── cohorts.json            # Cohort definitions and memberships
├── funnels.json            # Funnel definitions and conversions
├── report-schedules.json   # Scheduled reports
└── analytics/reports/      # Exported reports
```

### 4.3 Dependencies

**Internal Dependencies:**
- `analytics-reporter.ts` imports `AnalyticsCollector` dynamically:
  ```typescript
  const { AnalyticsCollector } = await import('./analytics-collector.js');
  ```

**Node.js Built-ins:**
- `fs` - File system operations
- `path` - Path manipulation
- `crypto` - (Not currently used, but available for ID generation)

**No External Dependencies:** Analytics module is self-contained

### 4.4 Error Handling

**Validation:**
```typescript
// Score range validation
if (response.score < 0 || response.score > 10) {
  throw new Error('NPS score must be between 0 and 10');
}

// Cohort existence check
if (!cohort) {
  throw new Error(`Cohort ${cohortName} not found`);
}

// Session existence check
if (!session) {
  throw new Error(`Session ${sessionId} not found`);
}
```

**File System Safety:**
```typescript
// Check file exists before reading
if (!fs.existsSync(this.dataPath)) {
  return { events: [], sessions: [] };
}

// Create directories recursively
fs.mkdirSync(dir, { recursive: true });
```

### 4.5 Data Persistence

**File Locations:**
- All data stored in `.planning/` directory
- Files are JSON format with 2-space indentation
- Directories created automatically on first use

**Data Initialization:**
```typescript
private ensureFile(): void {
  const dir = path.dirname(this.dataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(this.dataPath)) {
    fs.writeFileSync(this.dataPath, JSON.stringify({ /* initial data */ }, null, 2), 'utf8');
  }
}
```

---

## 5. Validation Architecture

### 5.1 Success Criteria

**ANALYTICS-01 (NPSTracker):**
- [ ] `recordResponse()` categorizes responses correctly
- [ ] `calculateScore()` returns NPS = 25 for test data (2 promoters, 1 passive, 1 detractor)
- [ ] `getTrendWithOptions()` returns object with `periods` array and `direction` string

**ANALYTICS-02 (AnalyticsCollector):**
- [ ] `track()` creates `.planning/analytics.json` with events array
- [ ] `startSession()` returns unique string ID
- [ ] `endSession()` sets `duration` >= 0
- [ ] `getEvents({ name })` filters correctly

**ANALYTICS-03 (AnalyticsReporter):**
- [ ] `generateReport()` returns object with `generatedAt`, `period`, `metrics`
- [ ] `aggregateMetrics()` returns `bySource` array matching input sources
- [ ] `exportReport()` creates readable file
- [ ] `scheduleReport()` persists to `report-schedules.json`

**ANALYTICS-04 (CohortAnalyzer):**
- [ ] `defineCohort()` creates cohort in `cohorts.json`
- [ ] `addUserToCohort()` matches signup date to cohort period
- [ ] `calculateRetention()` returns `periods` array with rates >= 0
- [ ] `compareCohorts()` returns `cohorts` array
- [ ] `getCohortMetrics()` returns size >= 0

**ANALYTICS-05 (FunnelAnalyzer):**
- [ ] `defineFunnel()` sorts steps by order
- [ ] `trackConversion()` appends to conversions array
- [ ] `getConversionRates()` returns `steps` array with users >= 0
- [ ] `getDropOffPoints()` returns `points` array
- [ ] `compareFunnels()` returns metrics per funnel

**ANALYTICS-06 (Analytics CLI):**
- [ ] `analytics track --event` does not crash
- [ ] `analytics session --start` does not crash
- [ ] `analytics session --end` does not crash
- [ ] `analytics report --type` does not crash
- [ ] `analytics export --format` does not crash

### 5.2 Test Execution Order

```
1. Run nps-tracker.test.ts (3 tests)
   ↓
2. Run analytics-collector.test.ts (4 tests)
   ↓
3. Run analytics-reporter.test.ts (4 tests)
   ↓
4. Run cohort-analyzer.test.ts (5 tests)
   ↓
5. Run funnel-analyzer.test.ts (5 tests)
   ↓
6. Run analytics-cli.test.ts (5 tests)
```

### 5.3 Verification Commands

```bash
# Run all analytics tests
npm test -- tests/analytics/

# Run specific test file
npm test -- tests/analytics/nps-tracker.test.ts

# Check TypeScript compilation
npm run typecheck

# Run with coverage
npm run test:coverage
```

### 5.4 Expected Test Output

**Before Fix:**
```
 FAIL  tests/analytics/nps-tracker.test.ts
  ✗ calculateScore() returns NPS = %promoters - %detractors
    → Expected 0 to be 25
```

**After Fix:**
```
 PASS  tests/analytics/nps-tracker.test.ts
  ✓ constructor does not throw
  ✓ recordResponse() categorizes promoters, passives, detractors
  ✓ calculateScore() returns NPS = %promoters - %detractors
  ✓ getTrend() returns NPS change over time periods
```

---

## 6. Risks and Mitigation

### 6.1 High Risk Items

**Risk 1: Test Expectations Mismatch**
- **Problem:** Tests may expect behavior different from current implementation
- **Example:** Test expects NPS = 25, implementation calculates differently
- **Mitigation:** 
  - Read test expectations carefully before modifying code
  - Calculate expected values manually (e.g., NPS formula)
  - Run single test first to see exact failure message

**Risk 2: File Path Issues**
- **Problem:** Tests use temp directories, paths may not resolve correctly
- **Example:** `.planning/nps.json` created in wrong directory
- **Mitigation:**
  - Always use `path.join(tmpDir, '.planning', ...)` in tests
  - Verify file paths in implementation match test expectations
  - Use `createTempProject()` helper which creates `.planning/phases/`

**Risk 3: Async Timing Issues**
- **Problem:** Tests may check file before async write completes
- **Example:** `endSession()` duration calculation timing
- **Mitigation:**
  - Always `await` async methods in tests
  - Use `setTimeout()` in tests where timing matters
  - Check `duration >= 0` not exact value

### 6.2 Medium Risk Items

**Risk 4: TypeScript Type Errors**
- **Problem:** Strict TypeScript may catch type mismatches
- **Example:** `undefined` vs optional property
- **Mitigation:**
  - Run `npm run typecheck` after changes
  - Use `exactOptionalPropertyTypes` compatible patterns
  - Handle `undefined` for indexed access

**Risk 5: CLI Command Integration**
- **Problem:** CLI handler may not exist or have wrong signature
- **Example:** `analytics-cli.ts` not found
- **Mitigation:**
  - Check if CLI handler exists in `bin/lib/commands/`
  - Verify command parsing matches test arguments
  - Test CLI manually in temp directory

**Risk 6: Data Migration**
- **Problem:** Old data format may not match new expectations
- **Example:** `nps.json` structure changed
- **Mitigation:**
  - Tests create fresh temp directories (no migration needed)
  - Handle missing fields with defaults
  - Use defensive parsing: `data.responses || []`

### 6.3 Low Risk Items

**Risk 7: Test Helper Availability**
- **Problem:** Helper functions may change signature
- **Mitigation:** Check `tests/helpers.ts` exports before use

**Risk 8: File Permission Issues**
- **Problem:** Temp directory creation may fail
- **Mitigation:** Use `fs.mkdtempSync()` with error handling

---

## 7. Implementation Checklist

### Phase 19 Plans

**Plan 19.1: NPSTracker (ANALYTICS-01)**
- [ ] Verify `recordResponse()` categorization logic
- [ ] Verify `calculateScore()` NPS formula
- [ ] Verify `getTrendWithOptions()` trend calculation
- [ ] Run `npm test -- tests/analytics/nps-tracker.test.ts`
- [ ] Fix any failing tests

**Plan 19.2: AnalyticsCollector (ANALYTICS-02)**
- [ ] Verify `track()` event persistence
- [ ] Verify `startSession()` ID generation
- [ ] Verify `endSession()` duration calculation
- [ ] Verify `getEvents()` filtering
- [ ] Run `npm test -- tests/analytics/analytics-collector.test.ts`

**Plan 19.3: AnalyticsReporter (ANALYTICS-03)**
- [ ] Verify `generateReport()` report structure
- [ ] Verify `aggregateMetrics()` source counting
- [ ] Verify `exportReport()` file creation
- [ ] Verify `scheduleReport()` persistence
- [ ] Run `npm test -- tests/analytics/analytics-reporter.test.ts`

**Plan 19.4: CohortAnalyzer (ANALYTICS-04)**
- [ ] Verify `defineCohort()` cohort creation
- [ ] Verify `addUserToCohort()` date matching
- [ ] Verify `calculateRetention()` retention calculation
- [ ] Verify `compareCohorts()` comparison logic
- [ ] Verify `getCohortMetrics()` metrics
- [ ] Verify `recordActivity()` activity tracking
- [ ] Run `npm test -- tests/analytics/cohort-analyzer.test.ts`

**Plan 19.5: FunnelAnalyzer (ANALYTICS-05)**
- [ ] Verify `defineFunnel()` step sorting
- [ ] Verify `trackConversion()` conversion tracking
- [ ] Verify `getConversionRates()` rate calculation
- [ ] Verify `getDropOffPoints()` drop-off analysis
- [ ] Verify `compareFunnels()` comparison
- [ ] Run `npm test -- tests/analytics/funnel-analyzer.test.ts`

**Plan 19.6: Analytics CLI (ANALYTICS-06)**
- [ ] Locate or create CLI handler
- [ ] Verify `analytics track` command
- [ ] Verify `analytics session` commands
- [ ] Verify `analytics report` command
- [ ] Verify `analytics export` command
- [ ] Run `npm test -- tests/analytics/analytics-cli.test.ts`

---

## 8. Key Learnings from Code Review

### Current Implementation Status

**Good News:** All five analytics classes exist with method stubs or partial implementations:

1. **NPSTracker** - Methods implemented, logic appears correct
2. **AnalyticsCollector** - Methods implemented, logic appears correct
3. **AnalyticsReporter** - Methods implemented, logic appears correct
4. **CohortAnalyzer** - Methods implemented, includes `recordActivity()` helper
5. **FunnelAnalyzer** - Methods implemented, all required methods present

**Potential Issues Identified:**

1. **Test File Comments Mismatch:**
   - `nps-tracker.test.ts` says "Requirement: ANALYTICS-02" (should be ANALYTICS-01)
   - `analytics-collector.test.ts` says "Requirement: ANALYTICS-01" (should be ANALYTICS-02)
   - `analytics-reporter.test.ts` says "Requirement: ANALYTICS-05" (should be ANALYTICS-03)
   - `funnel-analyzer.test.ts` says "Requirement: ANALYTICS-03" (should be ANALYTICS-05)

2. **Missing CLI Handler:**
   - No `analytics-cli.ts` found in `bin/lib/commands/`
   - CLI tests may need handler to be created

3. **TypeScript Strict Mode:**
   - All files use strict types
   - Optional properties handled correctly
   - No `any` types in core logic

### Recommended Approach

1. **Start with unit tests** (Plans 19.1-19.5) - These test the classes directly
2. **Fix CLI handler last** (Plan 19.6) - Depends on classes working first
3. **Run tests incrementally** - Fix one test file at a time
4. **Check TypeScript after each change** - Maintain zero errors

---

## 9. References

**Project Documentation:**
- `.planning/STATE.md` - Current project state (v8.0.0 in progress)
- `.planning/ROADMAP.md` - Overall project roadmap
- `.planning/milestones/v8.0.0-ROADMAP.md` - v8.0.0 phase breakdown
- `.planning/milestones/v8.0.0-REQUIREMENTS.md` - Detailed requirements

**Test Files:**
- `tests/analytics/nps-tracker.test.ts` - 3 tests
- `tests/analytics/analytics-collector.test.ts` - 4 tests
- `tests/analytics/analytics-reporter.test.ts` - 4 tests
- `tests/analytics/cohort-analyzer.test.ts` - 5 tests
- `tests/analytics/funnel-analyzer.test.ts` - 5 tests
- `tests/analytics/analytics-cli.test.ts` - 5 tests

**Implementation Files:**
- `bin/lib/analytics/nps-tracker.ts`
- `bin/lib/analytics/analytics-collector.ts`
- `bin/lib/analytics/analytics-reporter.ts`
- `bin/lib/analytics/cohort-analyzer.ts`
- `bin/lib/analytics/funnel-analyzer.ts`

**Test Helpers:**
- `tests/helpers.ts` - Core helpers (`createTempProject`, `runEzTools`, `cleanup`)
- `tests/helpers/TestHelpers.ts` - Utility functions
- `tests/helpers/index.ts` - Barrel exports

---

*Research completed: 2026-03-27*
*Next step: Create implementation plan in `.planning/phases/19-analytics-tests/19-PLAN.md`*
