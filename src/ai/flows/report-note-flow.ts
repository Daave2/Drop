
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

// This flow is intentionally left empty to prevent server crashes due to
// persistent Firebase Admin SDK authentication issues in this environment.
// The reporting logic has been moved to the client-side in NoteSheetContent.
const reportNoteFlow = ai.defineFlow(
  {
    name: 'reportNoteFlow',
    inputSchema: ReportNoteInputSchema,
    outputSchema: ReportNoteOutputSchema,
  },
  async (input) => {
    console.warn("reportNoteFlow is not implemented on the server. Client-side logic should be used.");
    return {
      success: false,
      actionTaken: 'none',
      message:
        'Reporting is not configured on the server. Please implement client-side logic.',
    };
  }
);

export async function reportNote(
  input: ReportNoteInput
): Promise<ReportNoteOutput> {
  return reportNoteFlow(input);
}
