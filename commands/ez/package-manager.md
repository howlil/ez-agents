# Package Manager Command

## Overview

The `package-manager` command provides flexible package manager support for ez-agents, enabling seamless operation with **npm**, **yarn**, and **pnpm**. It automatically detects available package managers, respects existing lockfiles, and provides configuration-driven defaults for consistent team workflows.

### Features

- **Auto-Detection**: Intelligently detects available package managers (pnpm, yarn, npm) on the system
- **Lockfile Respect**: Honors existing lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml)
- **Configuration Control**: Configurable default package manager in `.planning/config.json`
- **Cross-Platform Execution**: Consistent shell syntax across Windows, macOS, and Linux
- **Full Command Support**: install, add, remove operations for all three package managers
- **Backward Compatibility**: Maintains existing npm compatibility for legacy projects

## Usage

```bash
ez package-manager <subcommand> [options]
```

### Subcommands

#### `detect` - Detect available package manager

Automatically detects the available package manager using a priority-based strategy.

```bash
ez package-manager detect
```

**Output format (JSON):**
```json
{
  "manager": "pnpm",
  "source": "lockfile",
  "confidence": "high",
  "lockfilePath": "/path/to/pnpm-lock.yaml"
}
```

**Detection Sources:**
- `config` - From `.planning/config.json` packageManager.default
- `lockfile` - From existing lockfile presence
- `system` - From system availability check
- `fallback` - Default to npm when nothing else is available

**Confidence Levels:**
- `high` - Config or lockfile detection
- `medium` - System availability detection
- `low` - Fallback to npm

---

#### `install` - Install dependencies

Install dependencies from lockfile.

```bash
ez package-manager install [--frozen] [--production]
```

**Options:**
- `--frozen` - Use frozen lockfile install (CI/CD safe)
- `--production` - Production install (exclude devDependencies)

**Examples:**
```bash
# Standard install
ez package-manager install

# Frozen lockfile install (CI/CD)
ez package-manager install --frozen

# Production install
ez package-manager install --production
```

**Package Manager Commands:**
- npm: `npm install [--frozen-lockfile] [--production]`
- yarn: `yarn install [--frozen-lockfile] [--production]`
- pnpm: `pnpm install [--frozen-lockfile] [--prod]`

---

#### `add` - Add package(s)

Add new package(s) to the project.

```bash
ez package-manager add <package> [--dev|-D]
```

**Options:**
- `--dev` or `-D` - Add as devDependency

**Examples:**
```bash
# Add production dependency
ez package-manager add lodash

# Add dev dependency
ez package-manager add eslint --dev
ez package-manager add prettier -D

# Add multiple packages
ez package-manager add react react-dom
```

**Package Manager Commands:**
- npm: `npm install [--save-dev] <package>`
- yarn: `yarn add [--dev] <package>`
- pnpm: `pnpm add [--save-dev] <package>`

---

#### `remove` - Remove package(s)

Remove package(s) from the project.

```bash
ez package-manager remove <package>
```

**Examples:**
```bash
# Remove single package
ez package-manager remove lodash

# Remove multiple packages
ez package-manager remove eslint prettier
```

**Package Manager Commands:**
- npm: `npm uninstall <package>`
- yarn: `yarn remove <package>`
- pnpm: `pnpm remove <package>`

---

#### `info` - Show package manager info

Display current package manager information.

```bash
ez package-manager info
```

**Output format (JSON):**
```json
{
  "manager": "pnpm",
  "source": "lockfile",
  "cwd": "/path/to/project",
  "lockfile": "/path/to/pnpm-lock.yaml"
}
```

---

## Configuration

Configure package manager behavior in `.planning/config.json`:

```json
{
  "packageManager": {
    "default": "npm",
    "autoDetect": true,
    "respectLockfile": true,
    "frozenLockfileInCI": true
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `default` | string | `"npm"` | Default package manager (`npm`, `yarn`, or `pnpm`) |
| `autoDetect` | boolean | `true` | Enable automatic package manager detection |
| `respectLockfile` | boolean | `true` | Respect existing lockfiles when detecting |
| `frozenLockfileInCI` | boolean | `true` | Use frozen lockfile installs in CI environments |

---

## Detection Priority

The package manager detection follows a priority-based strategy:

```
┌─────────────────────────────────────────────────────────────┐
│              Package Manager Detection Pipeline              │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Configuration (highest priority)                  │
│  - Check .planning/config.json → packageManager.default    │
│  - If found and installed, use configured manager           │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Lockfile Detection                                │
│  - Check for pnpm-lock.yaml → use pnpm                     │
│  - Check for yarn.lock → use yarn                          │
│  - Check for package-lock.json → use npm                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: System Availability                               │
│  - Check which managers are installed                       │
│  - Prefer pnpm > yarn > npm (performance order)            │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Fallback                                          │
│  - Default to npm (always available with Node)             │
└─────────────────────────────────────────────────────────────┘
```

### Detection Examples

| Scenario | Detected Manager | Source |
|----------|-----------------|--------|
| Config says `pnpm`, pnpm installed | `pnpm` | config |
| No config, `pnpm-lock.yaml` exists | `pnpm` | lockfile |
| No config, `yarn.lock` exists | `yarn` | lockfile |
| No config, `package-lock.json` exists | `npm` | lockfile |
| No lockfile, pnpm/yarn/npm installed | `pnpm` | system |
| No lockfile, only npm installed | `npm` | system |
| Nothing detected | `npm` | fallback |

---

## Cross-Platform Support

The package manager command works identically across all platforms:

- **Windows** - Uses `execFile` for cross-platform execution
- **macOS** - Native Unix shell compatibility
- **Linux** - Native Unix shell compatibility

### Implementation Details

- All commands use `execFile` (not `exec`) for security and cross-platform compatibility
- All paths use `path.join()` for proper path separator handling
- No shell injection vulnerabilities (shell: false)
- 5-minute timeout for all operations
- 10MB buffer for command output

---

## Package Manager Commands Reference

### npm

| Operation | Command |
|-----------|---------|
| Install | `npm install` |
| Frozen Install | `npm install --frozen-lockfile` |
| Add Package | `npm install <pkg>` |
| Add Dev Package | `npm install --save-dev <pkg>` |
| Remove Package | `npm uninstall <pkg>` |
| Lockfile | `package-lock.json` |

### yarn

| Operation | Command |
|-----------|---------|
| Install | `yarn install` |
| Frozen Install | `yarn install --frozen-lockfile` |
| Add Package | `yarn add <pkg>` |
| Add Dev Package | `yarn add --dev <pkg>` |
| Remove Package | `yarn remove <pkg>` |
| Lockfile | `yarn.lock` |

### pnpm

| Operation | Command |
|-----------|---------|
| Install | `pnpm install` |
| Frozen Install | `pnpm install --frozen-lockfile` |
| Add Package | `pnpm add <pkg>` |
| Add Dev Package | `pnpm add --save-dev <pkg>` |
| Remove Package | `pnpm remove <pkg>` |
| Lockfile | `pnpm-lock.yaml` |

---

## Error Handling

The command provides detailed error messages for common issues:

- **No package manager detected** - Falls back to npm with warning
- **Lockfile validation failed** - Logs warning but continues
- **Command execution failed** - Returns stderr output with context
- **Unknown subcommand** - Lists available subcommands

---

## Library API

The package manager modules are also available for programmatic use:

```javascript
const {
  PackageManagerService,
  PackageManagerDetector,
  PackageManagerExecutor,
  LockfileValidator
} = require('./ez-agents/bin/lib/index.cjs');

// Use the service
const service = new PackageManagerService(cwd);
await service.initialize();
await service.install({ frozenLockfile: true });
await service.add(['lodash'], { dev: true });
```

See individual module files for detailed API documentation:
- `ez-agents/bin/lib/package-manager-detector.cjs`
- `ez-agents/bin/lib/package-manager-executor.cjs`
- `ez-agents/bin/lib/lockfile-validator.cjs`
- `ez-agents/bin/lib/package-manager-service.cjs`
