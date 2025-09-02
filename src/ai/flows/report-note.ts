/**
 * @fileOverview Schemas and types for the note reporting flow.
 *
 * - ReportNoteInput - The input type for the reportNote function.
 * - ReportNoteOutput - The return type for the reportNote function.
 */
import {z} from 'genkit';

export const ReportNoteInputSchema = z.object({
  noteId: z.string().describe('The ID of the note being reported.'),
  reason: z
    .string()
    .min(10)
    .max(500)
    .describe('The reason the user is reporting this note.'),
  reporterUid: z.string().describe('The UID of the user making the report.'),
});
export type ReportNoteInput = z.infer<typeof ReportNoteInputSchema>;

export const ReportNoteOutputSchema = z.object({
  success: z.boolean().describe('Whether the report was processed successfully.'),
  actionTaken: z
    .enum(['none', 'flagged', 'removed'])
    .describe(
      'The action taken based on the report. "none" if no action was taken, "flagged" for manual review, "removed" if the content was immediately hidden.'
    ),
  message: z.string().describe('A message to show to the user.'),
});
export type ReportNoteOutput = z.infer<typeof ReportNoteOutputSchema>;
