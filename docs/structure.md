# Project Structure

## Overview
NoteDrop is a location-based note application built with Next.js and TypeScript. It lets users drop geotagged notes and discover nearby messages through an interactive map. The stack combines MapLibre for mapping, Firebase for data, and Genkit with Google Gemini for AI-based content moderation.

## Directory Layout
- **src/app** – Next.js App Router pages and API routes.
  - `page.tsx` is the main map interface.
  - `profile` and `legal` are user-facing routes.
  - `admin` hosts moderation tools.
  - `api/notify/route.ts` sends push notifications via Firebase Admin.
  - `firebase-config.js/route.ts` exposes client Firebase settings.
- **src/components** – React components.
  - `map-view.tsx` renders the map, note pins, and note creation sheet.
  - `ui/` holds Tailwind/Radix-based UI primitives.
- **src/hooks** – Custom hooks for location, notes, notifications, PWA install prompts, and more.
- **src/lib** – Utilities for geospatial math, pseudonym generation, analytics, reporting, and Firebase helpers.
- **src/ai** – Genkit flows for content moderation and reporting with Google Gemini models.
- **src/types** – Shared type declarations.
- **public** – Static assets, PWA manifest, icons, and service workers.
- **Configuration** – `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `tsconfig.json`, `firestore.indexes.json`, `apphosting.yaml`.

## How It Works
1. `map-view` fetches the user position and pulls nearby notes from Firestore, showing them as ghost pins on a MapLibre map.
2. Hooks such as `use-proximity-notifications` trigger push alerts when users approach notes.
3. Users create notes through `create-note-form`; data is stored in Firestore and can expire or receive reactions and reports.
4. AI moderation (`src/ai/flows`) filters abusive content and orchestrates reporting flows.
5. The admin route lists reported notes for review.
6. PWA support comes from service workers in `public` and manifest configuration.

## Development
- Install dependencies and start the dev server on port 9002:
  ```bash
  npm install
  npm run dev
  ```
- Quality checks:
  ```bash
  npm run lint
  npm run typecheck
  npm test
  ```
- Environment variables in `.env.local` configure Firebase keys, proximity radius, and `GEMINI_API_KEY` for AI features.

Refer to `docs/blueprint.md` for the design blueprint.
