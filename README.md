# DEPSCOPE

**Understand What Your Dependencies Are Doing**

Local-first dependency intelligence CLI for JavaScript and TypeScript projects.

## Supported package managers

- npm lockfile v2/v3
- pnpm lockfile v9
- Yarn Classic lockfile v1

Yarn Berry lockfiles are not yet supported. Workspace projects use the root lockfile; workspace package analysis remains partial.

## Requirements

- Node.js >=18
- A `package.json`
- A supported lockfile for resolved dependency graph commands

## Installation

```bash
npm install -g depscope
```

Development:

```bash
npm install
npm run build
npm link
```

## Commands

```bash
# Project summary and graph inspection
depscope scan
depscope tree
depscope stats
depscope why <package>
depscope dependents <package>
depscope duplicates
depscope doctor

# Advanced local analysis
depscope unused
depscope size
depscope impact <package>
depscope report

# Snapshots and comparisons
depscope snapshot --name before-upgrade
depscope history
depscope diff --from <snapshot-id>

# Export and shell integration
depscope graph --format json
depscope graph --format dot
depscope completions bash
depscope completions zsh
```

Use `--cwd <path>` to target another project. Add `--json` for machine-readable output.

## CI usage

All threshold failures return exit code `2`; invalid usage and analysis errors return `1`.

```bash
# Fail if any duplicate package groups or diagnostics exist.
depscope report --json --max-duplicates 0 --max-diagnostics 0

# Compare current dependencies with a saved snapshot.
depscope diff --from <snapshot-id> --json \
  --max-added 0 \
  --max-removed 0 \
  --max-version-changes 0
```

GitHub Actions example:

```yaml
- name: Dependency policy
  run: npx depscope report --json --max-duplicates 0 --max-diagnostics 0
```

## Development

```bash
npm run build
npm test
npm run lint
npm run typecheck
npm run format:check
npm run verify
```

## Principles

- Local-first: no dependency data uploaded.
- Read-only: analysis does not modify target projects.
- Deterministic: equivalent input yields equivalent analysis.
- Evidence-based: diagnostics state limitations.
