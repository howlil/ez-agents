# EZ Agents Staging Test Guide

Comprehensive guide for running staging tests with real Qwen Code CLI.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Test Suites](#test-suites)
- [Running Tests](#running-tests)
- [Test Results](#test-results)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Run Full Battle Test (v4 vs Current)

```bash
# Using npm
npm run test:docker:qwen:code

# Using docker-compose directly
docker-compose -f docker-compose.staging.yml up --build ez-agents-qwen-code-battle
```

### Run Simple Test (Quick Validation)

```bash
# Using docker-compose
docker-compose -f docker-compose.staging.yml up --build ez-agents-qwen-code-battle-simple
```

---

## Prerequisites

### Required Software

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** v2.0+

### Qwen OAuth Token

Ensure you have a valid Qwen OAuth token at:

- **Windows**: `C:\Users\<YourUsername>\.qwen\oauth_creds.json`
- **Linux/Mac**: `~/.qwen/oauth_creds.json`

Token file format:

```json
{
  "access_token": "your-access-token",
  "refresh_token": "your-refresh-token",
  "token_type": "Bearer",
  "resource_url": "portal.qwen.ai",
  "expiry_date": 1234567890000
}
```

---

## Test Suites

### 1. Qwen Code CLI Battle Test (Full)

**Purpose**: Compare ez-agents v4.0.0 vs Current Version

**Test Scenarios**:
| # | Scenario | Description |
|---|----------|-------------|
| 1 | Simple Query | Basic question answering |
| 2 | Code Generation | TypeScript function generation |
| 3 | Complex Analysis | Architecture explanation |
| 4 | Context Task | Large codebase refactoring |

**Metrics Tracked**:
- Response time (ms)
- Success rate (%)
- Pass/fail count

**Duration**: ~2-5 minutes

**Output**: `tests/staging/results/qwen-code-battle-report.json`

---

### 2. Qwen Code CLI Simple Test

**Purpose**: Quick validation of Qwen Code CLI integration

**Test**:
- Prompt: "What is 2+2?"
- Expected: "2 + 2 = 4"

**Duration**: ~10 seconds

**Output**: `tests/staging/results/qwen-code-simple-result.json`

---

## Running Tests

### Full Battle Test

```bash
# Build and run
docker-compose -f docker-compose.staging.yml up --build ez-agents-qwen-code-battle

# View logs in real-time
docker-compose -f docker-compose.staging.yml up --build ez-agents-qwen-code-battle

# Run in background
docker-compose -f docker-compose.staging.yml up -d --build ez-agents-qwen-code-battle

# View logs
docker-compose -f docker-compose.staging.yml logs -f ez-agents-qwen-code-battle

# Cleanup
docker-compose -f docker-compose.staging.yml down
```

### Simple Test

```bash
# Build and run
docker-compose -f docker-compose.staging.yml up --build ez-agents-qwen-code-battle-simple

# Cleanup
docker-compose -f docker-compose.staging.yml down
```

### Using npm Scripts

```bash
# Full battle test
npm run test:docker:qwen:code

# Simple test (not available as npm script, use docker-compose)
```

---

## Test Results

### Location

Results are saved to:

```
tests/staging/results/
├── qwen-code-battle-report.json       # Full battle test results
└── qwen-code-simple-result.json       # Simple test results
```

### Example Battle Test Report

```json
{
  "title": "Qwen Code CLI Battle Test Report",
  "generatedAt": "2026-03-26T16:54:42+00:00",
  "testType": "REAL_QWEN_CODE_CLI",
  "versions": {
    "v4": {
      "version": "4.0.0",
      "totalTests": 4,
      "passed": 3,
      "failed": 1,
      "avgResponseMs": 25,
      "successRate": 75
    },
    "current": {
      "version": "current",
      "totalTests": 4,
      "passed": 3,
      "failed": 1,
      "avgResponseMs": 25,
      "successRate": 75
    }
  },
  "comparison": {
    "responseTimeImprovement": "0%",
    "successRateDifference": "0%"
  },
  "winner": {
    "category": "CURRENT",
    "reason": "Better overall performance"
  }
}
```

### Viewing Results

```bash
# View latest battle test results
cat tests/staging/results/qwen-code-battle-report.json

# View simple test results
cat tests/staging/results/qwen-code-simple-result.json
```

---

## Troubleshooting

### Token Not Found

**Error**: `Token file not found at /root/.qwen/oauth_creds.json`

**Solution**:
1. Ensure token file exists at the correct location
2. Check file permissions
3. Verify Docker volume mount path

### Qwen Code CLI Not Responding

**Error**: `No auth type is selected`

**Solution**:
- Ensure `--auth-type qwen-oauth` flag is used
- Check token file format is valid

### Docker Build Fails

**Error**: Various build errors

**Solution**:
```bash
# Clean Docker cache
docker-compose -f docker-compose.staging.yml down --rmi all

# Rebuild from scratch
docker-compose -f docker-compose.staging.yml up --build --force-recreate
```

### Test Timeout

**Error**: Tests timing out

**Solution**:
- Increase timeout in `qwen-code-battle-full.sh` (default: 60 seconds per test)
- Check network connectivity
- Verify token is not expired

### Permission Denied

**Error**: `Permission denied` when accessing token

**Solution**:
- On Windows, ensure Docker Desktop has access to your user directory
- Check file permissions on token file

---

## Architecture

### Docker Container Structure

```
┌─────────────────────────────────────────┐
│  ez-agents-qwen-code-battle             │
│  ┌─────────────────────────────────┐   │
│  │  Qwen Code CLI (v0.13.0)        │   │
│  │  - OAuth Authentication         │   │
│  │  - ez-agents v4.0.0             │   │
│  │  - ez-agents current            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Volumes:                               │
│  - OAuth token (read-only)             │
│  - Test results (read-write)           │
│  - Source code (read-only)             │
└─────────────────────────────────────────┘
```

### Test Flow

```
1. Build Docker image with Qwen Code CLI
         ↓
2. Mount OAuth token
         ↓
3. Install ez-agents v4.0.0 from npm
         ↓
4. Run 4 test scenarios
         ↓
5. Install ez-agents current from local
         ↓
6. Run 4 test scenarios again
         ↓
7. Generate comparison report
         ↓
8. Save results to mounted volume
```

---

## Best Practices

### Before Running Tests

1. ✅ Verify OAuth token is valid and not expired
2. ✅ Check Docker is running
3. ✅ Ensure sufficient disk space
4. ✅ Close other resource-intensive applications

### After Running Tests

1. ✅ Review test results
2. ✅ Clean up Docker containers
3. ✅ Archive important results
4. ✅ Document any issues found

---

## Support

For issues or questions:

- 📖 [Main README](../README.md) - General documentation
- 🐛 [GitHub Issues](https://github.com/howlil/ez-agents/issues) - Bug reports

---

**Last Updated:** March 26, 2026
