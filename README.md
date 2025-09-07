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

Set environment variables in a `.env.local` file to customize behavior. `NEXT_PUBLIC_PROXIMITY_RADIUS_M` defines the default distance (in meters) for proximity notifications, but users can adjust the radius later in their profile settings.

```bash
NEXT_PUBLIC_PROXIMITY_RADIUS_M=100 
```

If not provided, the default radius is 50 meters.

## Documentation

Key documents for orientation:

- [`docs/blueprint.md`](docs/blueprint.md) – product goals and feature overview.
- [`structure.md`](structure.md) – architecture and source layout.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) – development workflow and coding guidelines.

The main application entry point is [`src/app/page.tsx`](src/app/page.tsx).

## AI Coding Notes

When using an AI assistant, share the above files and [`AGENTS.md`](AGENTS.md) for context.
Ensure generated code follows the existing style, includes tests for new logic,
and passes `npm run lint`, `npm run typecheck`, and `npm test` before commit.
