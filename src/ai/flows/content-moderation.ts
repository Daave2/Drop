'use server';

/**
 * @fileOverview A content moderation AI agent.
 *
 * - moderateContent - A function that handles the content moderation process.
 * - ModerateContentInput - The input type for the moderateContent function.
 * - ModerateContentOutput - The return type for the moderateContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateContentInputSchema = z.object({
  text: z
    .string()
    .describe('The content to be moderated, could be a comment or a note.'),
});
export type ModerateContentInput = z.infer<typeof ModerateContentInputSchema>;

const ModerateContentOutputSchema = z.object({
  isSafe: z
    .boolean()
    .describe(
      'Whether or not the content is safe and conforms to the expected usage.'
    ),
  reason: z
    .string()
    .describe(
      'The reason why the content was flagged as unsafe. If the content is safe, this should be an empty string.'
    ),
});
export type ModerateContentOutput = z.infer<typeof ModerateContentOutputSchema>;

export async function moderateContent(input: ModerateContentInput): Promise<ModerateContentOutput> {
  try {
    return await moderateContentFlow(input);
  } catch (err) {
    const error = new Error(
      'Moderation temporarily unavailable. Please retry.'
    ) as Error & { status?: number };
    error.status = 503;
    throw error;
  }
}

const prompt = ai.definePrompt({
  name: 'moderateContentPrompt',
  input: {schema: ModerateContentInputSchema},
  output: {schema: ModerateContentOutputSchema},
  prompt: `You are a content moderation expert. Your goal is to determine whether the given content is safe for the platform.

  Here are the guidelines for content safety:
  - No hate speech: Content should not promote violence, incite hatred, or promote discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics.
  - No abusive content: Content should not harass, threaten, bully, or abuse other users.
  - No spam: Content should not be used to promote products or services, or to generate traffic to websites.
  - No private information: Content should not contain private information such as phone numbers, addresses, email addresses, or financial information.

  Content: {{{text}}}

  Based on these guidelines, determine whether the content is safe for the platform. If the content is not safe, provide a reason why.
  Set isSafe to true if the content is safe, and false otherwise. If the content is safe, the reason must be an empty string.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const moderateContentFlow = ai.defineFlow(
  {
    name: 'moderateContentFlow',
    inputSchema: ModerateContentInputSchema,
    outputSchema: ModerateContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
