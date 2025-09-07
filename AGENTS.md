# AGENTS

This repository uses Next.js and TypeScript.

## Guidelines

- Keep code formatted with the existing style.
- Favor functional, typed components in `src`.
- Only commit to main branch; do not create new branches.
- Ensure new UI remains mobile-optimized with responsive layouts.
- Include unit tests for hooks and utilities using Vitest when adding new logic.
- Refer to `CONTRIBUTING.md` and `structure.md` for project layout and workflow details.
- Keep `todo.md` up to date with current tasks.

## Checks

Run the following commands and ensure they pass before committing:

```bash
npm run lint
npm run typecheck
npm test
```

