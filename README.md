# NoteDrop

NoteDrop is an experimental location-based note taking application built with Next.js and TypeScript.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server on port 9002:

   ```bash
   npm run dev
   ```

3. Run quality checks:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```

## Configuration

Set the following environment variables in a `.env.local` file to configure the app:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project identifier |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FCM_VAPID_KEY` | Web push VAPID key for FCM |
| `NEXT_PUBLIC_PROXIMITY_RADIUS_M` | Default proximity radius in meters (defaults to 50) |
| `NEXT_PUBLIC_REPORT_THRESHOLD` | Reports required before a note is hidden (defaults to 3) |
| `GEMINI_API_KEY` | Gemini API key for AI features |

Example `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FCM_VAPID_KEY=...
NEXT_PUBLIC_PROXIMITY_RADIUS_M=100
NEXT_PUBLIC_REPORT_THRESHOLD=3
GEMINI_API_KEY=your-gemini-key
```

## Documentation

Key documents for orientation:

- `todo.yaml` – machine-readable backlog for automated agents (Codex) and humans.
- [`docs/blueprint.md`](docs/blueprint.md) – product goals and feature overview.
- [`structure.md`](structure.md) – architecture and source layout.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) – development workflow and coding guidelines.

The main application entry point is [`src/app/page.tsx`](src/app/page.tsx).

## AI Coding Notes

When using an AI assistant, share the above files and [`AGENTS.md`](AGENTS.md) for context.
Ensure generated code follows the existing style, includes tests for new logic,
and passes `npm run lint`, `npm run typecheck`, and `npm test` before commit.
