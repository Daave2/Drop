# NoteDrop Project Structure

This document outlines the architecture and major components of the **NoteDrop** repository so a new engineer can understand how the application fits together without needing the full code.

## Overview

NoteDrop is a location-based note app built with Next.js and TypeScript. Users drop "ghost" notes on a map and reveal them by visiting the location. The app integrates Firebase for auth, storage and push notifications, and uses AI flows to moderate user content and handle abuse reports. Styling is provided by Tailwind and a set of reusable UI primitives.

## Tech Stack

- **Framework**: Next.js 15 App Router with React 18 and TypeScript
- **UI**: Tailwind CSS with custom components (Shadcn style)
- **Maps**: MapLibre GL via `react-map-gl`
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Messaging)
- **AI**: Google Genkit + Gemini model for moderation and reporting flows
- **Testing**: Vitest and Testing Library
- **Build Tools**: Vite for tests, ESLint, TypeScript compiler

## Directory Layout

```
.
├── docs/                – Project blueprints and high‑level docs
├── public/              – Static assets, icons, manifest and service workers
├── src/
│   ├── ai/              – Genkit flows for moderation and report handling
│   ├── app/             – Next.js routes and global layout
│   ├── components/      – React components and UI primitives
│   ├── hooks/           – Reusable client hooks (location, notes, etc.)
│   ├── lib/             – Shared utilities (Firebase, geo helpers, pseudonyms)
│   ├── types/           – Shared TypeScript types
│   └── sw.test.ts       – Service worker tests
└── ...config files
```

## Key Modules

### `src/app`
- **layout.tsx** – Defines global HTML structure, theme and providers.
- **page.tsx** – Entry page that renders the interactive map.
- **api/notify/route.ts** – Serverless endpoint to send FCM push notifications.
- **actions.ts** – Exposes server actions such as pseudonym creation.
- **admin/** – Admin dashboard for viewing reports and test modes.
- **profile/** – User settings such as proximity radius.
- **legal/** – Static legal page.

### `src/components`
Contains feature components and their tests.
- **map-view.tsx** – Core map experience: renders notes, handles creation and reveal logic.
- **note-sheet-content.tsx**, **create-note-form.tsx** – UI for viewing and creating notes.
- **notifications-button.tsx**, **onboarding-overlay.tsx**, **auth-provider.tsx** – Supporting UI and providers.
- **ui/** – Design system primitives (button, dialog, toast, icons, etc.) used across the app.

### `src/hooks`
Custom hooks encapsulating client logic.
- **use-location.ts** – Wraps geolocation API and permission handling.
- **use-notes.ts** – Queries Firestore for nearby notes using geohash bounds.
- **use-proximity-notifications.ts** – Triggers notifications when the user nears a note.
- Other hooks manage installation prompts, orientation, settings, and user notes.

### `src/lib`
Shared utilities and services.
- **firebase.ts** – Client-side Firebase initialization.
- **geo.ts** – Geographic calculations (distance, bounding boxes).
- **pseudonym.ts** – Generates pseudonymous user names and server action.
- **reporting.ts** – Constants and helpers for note reporting.
- **analytics.ts**, **utils.ts** – Miscellaneous helpers.

### `src/ai`
Server-side Genkit flows.
- **genkit.ts** – Configures Genkit with the Gemini model.
- **flows/content-moderation.ts** – Validates that user content is safe.
- **flows/report-note-flow.ts** – Records abuse reports and hides notes when thresholds are met.

## Application Flow
1. `MapView` fetches nearby notes with `use-notes` and renders them on a MapLibre map.
2. Users can create notes; coordinates and metadata are stored in Firestore.
3. `use-proximity-notifications` and a serverless `/api/notify` route deliver FCM notifications when a user approaches a note.
4. Content submitted by users is screened via AI moderation flows. Users may report notes; after several reports the note becomes unlisted.
5. Pseudonymous profiles are created through a server action. Admin pages allow review of reports.

## Development & Testing
- Install dependencies: `npm install`
- Run the dev server: `npm run dev` (port 9002)
- Quality checks:
  - `npm run lint` – ESLint rules
  - `npm run typecheck` – TypeScript compiler
  - `npm test` – Vitest unit tests

Environment variables in `.env.local` configure Firebase and default proximity radius. Service workers and manifest files under `public/` enable PWA behaviour.

This document should provide enough context for onboarding and further development without direct access to every source file.
