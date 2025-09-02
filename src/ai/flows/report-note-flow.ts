
'use server';
/**
 * @fileOverview A flow for handling user reports of notes.
 *
 * - reportNote - A function that handles the note reporting process.
 */

import {ai} from '@/ai/genkit';
import {
  ReportNoteInput,
  ReportNoteInputSchema,
  ReportNoteOutput,
  ReportNoteOutputSchema,
} from './report-note';


const reportNoteFlow = ai.defineFlow(
  {
    name: 'reportNoteFlow',
    inputSchema: ReportNoteInputSchema,
    outputSchema: ReportNoteOutputSchema,
  },
  async (input) => {
    // This flow is now a placeholder. The actual reporting logic has been moved to the client
    // in note-sheet-content.tsx to bypass server-side authentication issues.
    // This flow can be re-enabled with a more complex AI moderation system
    // once the underlying infrastructure issues are resolved.
    
    // For now, we return a generic success message, as the client handles the DB update.
     return {
        success: true,
        actionTaken: 'flagged',
        message: "Thank you for your report. The note has been flagged for further review by our team.",
      };
  }
);

export async function reportNote(input: ReportNoteInput): Promise<ReportNoteOutput> {
  return reportNoteFlow(input);
}
