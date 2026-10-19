# DEPSCOPE

**Understand What Your Dependencies Are Doing**

A dependency intelligence tool for JavaScript and TypeScript projects.

## Status

🚧 **In Development - Milestone 0**

DEPSCOPE is currently under active development. The foundation is being established.

### Current Status

- ✅ Project foundation (TypeScript, ESM, CLI framework)
- ⏳ npm lockfile parser
- ⏳ Dependency graph engine
- ⏳ Core analysis commands

## Planned Features

- **Dependency Tree Analysis**: Understand your project's dependency hierarchy
- **Why Analysis**: Explain why a package exists in your project
- **Duplicate Detection**: Find multiple versions of the same package
- **Dependency Statistics**: Get insights into dependency counts and types
- **Health Diagnostics**: Detect project and lockfile issues
- **Impact Analysis**: Understand the effect of removing or upgrading packages
- **Snapshot & Comparison**: Track dependency changes over time

## Requirements

- Node.js ≥18.0.0
- npm (initially; pnpm and Yarn support planned)

## Installation (Development)

```bash
git clone <repository>
cd depscope
npm install
npm run build
npm link
```

## Usage

```bash
# Display help
depscope --help

# Analyze project (coming soon)
depscope scan

# Show dependency tree (coming soon)
depscope tree

# Explain why a package exists (coming soon)
depscope why <package>

# Find duplicate versions (coming soon)
depscope duplicates

# Show dependency statistics (coming soon)
depscope stats
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode
npm run test:watch

# Lint
npm run lint

# Format
npm run format

# Type check
npm run typecheck
```

## Architecture Principles

- **Local-first**: Core functionality works offline
- **Read-only by default**: Analysis never modifies your project
- **Package-manager independent**: Normalized graph model
- **Evidence-based**: Diagnostics explain their reasoning
- **Safe by default**: Destructive actions require explicit confirmation

## Project Structure

```
depscope/
├── src/
│   ├── cli/          # Command-line interface
│   ├── core/         # Analysis engine and graph algorithms
│   ├── utils/        # Shared utilities
│   └── ...
├── tests/            # Test suites
└── docs/             # Documentation
```

## License

MIT

## Roadmap

See [docs/PRD.md](docs/PRD.md) for the complete product requirements and roadmap.
