# AGENTS (Main-Commit Mode)

This repo uses Next.js + TypeScript. Commits to **main** are allowed with guardrails.

## Source of truth
- All work items live in **`todo.yaml`** (machine-readable backlog).
- Every commit MUST reference a task ID (e.g., `ND-004`) and keep `todo.yaml` up to date.

## Commit rules (main)
1) **Atomic & small**: one task (or one step) per commit.
2) **Message**: `{id}: {short_title}` — e.g., `ND-002: cache nearby notes`
3) **Checks must pass locally** before committing:
   ```bash
   npm run lint && npm run typecheck && npm test
