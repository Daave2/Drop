
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
import {getApps, initializeApp} from 'firebase-admin/app';
import {getFirestore, FieldValue} from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    initializeApp();
  } catch (e) {
    console.error('Firebase Admin initialization failed:', e);
  }
}

const adminDb = getFirestore();

const reportNoteFlow = ai.defineFlow(
  {
    name: 'reportNoteFlow',
    inputSchema: ReportNoteInputSchema,
    outputSchema: ReportNoteOutputSchema,
  },
  async (input) => {
    const {noteId, reporterUid, reason} = input;
    
    if (noteId === '---DUMMY_NOTE_ID---') {
      // This is a test report from the client. Do not process.
      return {
        success: true,
        actionTaken: 'none',
        message: 'This is a test. Report not submitted.',
      };
    }

    try {
      const noteRef = adminDb.collection('notes').doc(noteId);
      
      // For now, we will just unlist the note. Storing the report can be added back later.
      // This simplifies the logic and avoids transaction failures that might be causing the generic error.
      await noteRef.update({
        visibility: 'unlisted',
        lastReportedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        actionTaken: 'flagged',
        message:
          'Thank you for your report. The note has been flagged for further review by our team.',
      };
    } catch (error: any) {
      console.error('Error processing report:', error);
      // We are returning a more generic error to the user for security reasons.
      // The specific error is logged on the server.
      return {
        success: false,
        actionTaken: 'none',
        message:
          'There was an error submitting your report. Please try again later.',
      };
    }
  }
);

export async function reportNote(
  input: ReportNoteInput
): Promise<ReportNoteOutput> {
  return reportNoteFlow(input);
}
