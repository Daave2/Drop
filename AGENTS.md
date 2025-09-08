# AGENTS (Main-Commit Mode — Trailer Strategy)

This repo uses **Next.js + TypeScript**. Commits to **main** are allowed with guardrails.

## Source of truth
- All work items live in **`todo.yaml`** (machine-readable backlog).
- **Do not** store commit SHAs in `todo.yaml`. We link commits to tasks via **commit trailers**.

## Commit rules (main)
1) **Atomic & small**: one task (or one step) per commit.
2) **Subject**: `{id}: {short_title}` — e.g., `ND-002: cache nearby notes`
3) **Trailers** (exact spelling):


Task-ID: ND-002
Task-Status: done # or doing

4) **Checks must pass locally** before committing:
```bash
npm run lint && npm run typecheck && npm test
```

Update todo.yaml in the same commit only for status/fields (e.g., set doing or done).
Do not add the SHA to todo.yaml.

Recommended flow

Pick next: ts-node scripts/task-tools.ts next

Mark doing in todo.yaml, implement + tests.

Commit to main with subject + trailers shown above.

If finished, set the task to done in the same commit.

Add follow-ups as new tasks with ts-node scripts/task-tools.ts add "Title" (same commit or next).

Verifying work

Use ts-node scripts/task-trailers.ts report to list commits per task by reading git history.

Optionally gate CI on trailer presence (future enhancement).

Accessibility & safety checklist

Icon-only buttons have aria-label.

API routes use zod validation + rate limiting + tests (400/401/429/5xx).

No secrets committed; .env.example is up to date.

Keyboard focus visible in all themes (including Sketch).

