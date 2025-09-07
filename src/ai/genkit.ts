/**
 * Configures and exports the shared Genkit AI instance used across the app.
 * A helpful warning is printed if the required GEMINI_API_KEY is missing so
 * developers know how to set up their local environment.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
  console.error(
    '============================================================\n' +
      'MISSING API KEY\n' +
      '------------------------------------------------------------\n' +
      'The GEMINI_API_KEY environment variable is not set.\n' +
      'Please get a key from Google AI Studio (https://makersuite.google.com/app/apikey)\n' +
      'and add it to your .env.local file.\n' +
      '============================================================'
  );
}

// Shared Genkit instance configured with the Gemini model.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
