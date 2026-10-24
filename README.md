# DEPSCOPE

<div align="center">

**Understand What Your Dependencies Are Doing**

Local-first dependency intelligence CLI for JavaScript and TypeScript projects.

[![CI](https://github.com/waeterr/DEPSCOPE/actions/workflows/ci.yml/badge.svg)](https://github.com/waeterr/DEPSCOPE/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

## Why DEPSCOPE?

Large dependency trees hide cost, duplication, and risk. DEPSCOPE reads local project metadata and helps answer:

- What packages are installed?
- Why is a package present?
- Which packages depend on it?
- Where are duplicate versions?
- What changes after an upgrade?
- Can a dependency policy fail CI before merge?

No uploads. No package installation. No target-project modifications.

## Tech stack

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)

| Area         | Technology       |
| ------------ | ---------------- |
| Runtime      | Node.js >=18     |
| Language     | TypeScript, ESM  |
| CLI          | Commander        |
| Validation   | Zod              |
| YAML parsing | YAML             |
| Build        | tsup             |
| Tests        | Vitest           |
| Code quality | ESLint, Prettier |

## Supported package managers

| Package manager | Lockfile                  | Status            |
| --------------- | ------------------------- | ----------------- |
| npm             | `package-lock.json` v2/v3 | Supported         |
| pnpm            | `pnpm-lock.yaml` v9       | Supported         |
| Yarn Classic    | `yarn.lock` v1            | Supported         |
| Yarn Berry      | `yarn.lock` v2+           | Not yet supported |

Workspace projects use the root lockfile. Per-workspace package analysis remains partial.

## Requirements

- Node.js >=18
- `package.json`
- Supported lockfile for resolved dependency graph commands

## Installation

DEPSCOPE is not published to npm yet. Use local development installation:

```bash
git clone https://github.com/waeterr/DEPSCOPE.git
cd DEPSCOPE
npm install
npm run build
npm link
```

Verify:

```bash
depscope --version
depscope --help
```

## Quick start

Run from a target JavaScript/TypeScript project:

```bash
depscope scan
depscope tree
depscope stats
depscope why <package>
depscope duplicates
```

Analyze another project:

```bash
depscope scan --cwd ../another-project
```

Use `--json` for machine-readable output:

```bash
depscope report --json
depscope graph --format json
```

## Commands

| Command                         | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `scan`                          | Analyze current project                       |
| `tree`                          | Display dependency hierarchy                  |
| `stats`                         | Show graph statistics                         |
| `why <package>`                 | Explain package presence                      |
| `dependents <package>`          | List reverse dependencies                     |
| `duplicates`                    | Find duplicate package versions               |
| `doctor`                        | Diagnose project metadata                     |
| `unused`                        | Detect potentially unused direct dependencies |
| `size`                          | Measure installed package footprint           |
| `impact <package>`              | Analyze graph impact                          |
| `report`                        | Generate consolidated report                  |
| `snapshot` / `history` / `diff` | Store and compare dependency states           |
| `graph`                         | Export graph as JSON or DOT                   |
| `completions`                   | Generate Bash or Zsh completion script        |

## CI dependency gates

Threshold violations exit with code `2`. Invalid usage and analysis failures exit with code `1`.

```bash
# Fail if duplicate package groups or diagnostics exist.
depscope report --json --max-duplicates 0 --max-diagnostics 0

# Fail on dependency changes relative to a snapshot.
depscope diff --from <snapshot-id> --json \
  --max-added 0 \
  --max-removed 0 \
  --max-version-changes 0
```

GitHub Actions:

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

- **Local-first** — dependency data stays on your machine.
- **Read-only** — analysis never changes target projects.
- **Deterministic** — equivalent inputs yield equivalent analysis.
- **Evidence-based** — diagnostics state evidence and limitations.

## License

[MIT](LICENSE)
