# Vue 3 + TypeScript + Bun

This is a Vue 3 + TypeScript application built with Vite and managed with [Bun](https://bun.sh/).

## Requirements

- Bun `>=1.3.14`

Node.js is not required for the project scripts. Bun runs Vite, Vue's type checker, and the test runner.

## Setup

```bash
bun install
```

## Commands

```bash
# Start the Vite development server
bun run dev

# Type-check the Vue/TypeScript sources
bun run type-check

# Build for production
bun run build

# Preview the production build
bun run preview

# Run Bun tests
bun run test

# Format supported files with Prettier
bun run format

# Check formatting without changing files
bun run format:check
```

The Bun lockfile (`bun.lock`) is the source of truth for dependency installation. If dependencies change, update it with `bun install` and commit the resulting lockfile.

## Linting

The project uses Prettier for formatting, Oxlint for fast correctness checks, and ESLint for Vue/TypeScript/JSON quality rules. Each file type has one formatter, so ESLint and Prettier do not compete while saving.

```bash
bun run lint
# Format, then apply Oxlint/ESLint autofixes
bun run lint:fix
bun run check
```

VS Code is configured to use the Prettier extension as the default formatter. Saving a supported file formats it with Prettier and runs ESLint autofixes for files ESLint validates.
