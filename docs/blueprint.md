# **App Name**: NoteDrop: Location-Based Notes

## Core Features:

- Ghost Pin Display: Display 'ghost pins' on the map for nearby notes within 50m, using MapLibre GL JS with OpenStreetMap raster tiles.
- Travel-to-Reveal: Reveal full note content only when the user is within 35m and sightline is aligned (client-side UX), validated with cellToken exchange and proximity on server.
- Note Creation and Expiration: Allow users to create text or photo notes with optional expiration (default 7d). Enforce rate limits (5 notes/day for anonymous users) with Firebase App Check and time-bucket counters. Compute and validate the geohash using Cloud Functions.
- Short Replies: Enable users to add short text replies (<=120 chars) to revealed notes.
- Note Reactions & Reporting: Implement 'like' and 'report' actions on notes, managed in Firestore. Auto-hide notes after 3 reports and track score.
- Safety Filter: Use an LLM to ensure that all the comments conform to the expected usage (no hate speech, abusive content, spam or private information). If this is not possible the comment is flagged for review by human moderators.
- Pseudonymous Profiles: Create pseudonymous profiles for users with trust scores that are influenced by abusive actions on user posts (after being flagged and reviewed). Profiles may be used to increase trust.

## Style Guidelines:

- Primary color: Vibrant blue (#66B2FF) to evoke a sense of adventure and discovery.
- Background color: Light, desaturated blue (#F0F8FF) for a clean, unobtrusive base.
- Accent color: Warm amber (#FFC107) to highlight interactive elements and indicate 'limited-drop' notes.
- Body and headline font: 'PT Sans' (sans-serif) for a modern and readable UI.
- Code font: 'Source Code Pro' for any displayed code snippets.
- Custom sticky-note style markers for notes; compass overlay with arrow and distance indicator.
- Mobile-first layout using bottom sheets for note details and creation; map view as primary interface.

## Further Reading

For implementation details see [structure.md](../structure.md).
Contribution guidelines and coding conventions live in [CONTRIBUTING.md](../CONTRIBUTING.md)
and [AGENTS.md](../AGENTS.md).
