/**
 * Loads environment variables and registers development AI flows.
 * This entry point is used when running flows locally without the full app.
 */
import { config } from 'dotenv';
config();

// Import flow definitions so they are registered on start.
import '@/ai/flows/content-moderation.ts';
import '@/ai/flows/report-note-flow.ts';
