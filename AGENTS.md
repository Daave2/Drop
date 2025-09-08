# AGENTS (Main-Commit Mode)

This repo uses **Next.js** + **TypeScript**. Commits to **main** are allowed with guardrails.

## Source of truth
- All work items live in **`todo.yaml`** (machine-readable backlog).
- Every commit MUST reference a task ID (e.g., `ND-004`) and keep `todo.yaml` up to date.

## Commit rules (main)
1. **Atomic & small** — one task (or one step) per commit.
2. **Message** — `{id}: {short_title}`  
   e.g., `ND-002: cache nearby notes`
3. **Checks must pass locally** before committing:
   ```bash
   npm run lint && npm run typecheck && npm test
4. Update todo.yaml in the same commit:
Advance status (todo → doing or doing → done).
Append the commit SHA under the task (commits array).
Add follow-ups as new tasks (P1/P2) if you introduced TODOs/tech-debt.

Recommended flow
Pick next: ts-node scripts/task-tools.ts next
Mark doing: ts-node scripts/task-tools.ts status ND-001 doing
Implement + tests (keep changes scoped to the task’s files).
Commit to main with message {id}: {short_title}
Record SHA: ts-node scripts/task-tools.ts record ND-001 <sha> "short message"
If finished: ts-node scripts/task-tools.ts status ND-001 done
Add follow-ups if discovered: ts-node scripts/task-tools.ts add "Title"

Accessibility & safety checklist

Icon-only buttons have aria-label.
API routes have zod validation + rate limiting + tests.
No secrets committed; .env.example is up to date.
Keyboard focus visible in all themes (including Sketch).
CI (optional but recommended)

Pushes to main run lint/type/test. Failures create noise in the feed but don’t block. See .github/workflows/ci.yaml.
