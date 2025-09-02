
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

// Server-side Firebase Admin SDK initialization
import {initializeApp, getApps, cert} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {Note} from '@/types';


// Initialize Firebase Admin SDK only if it hasn't been already
if (!getApps().length) {
  try {
    // When running on Google Cloud, the Admin SDK can automatically detect the
    // project's service account credentials.
    initializeApp();
  } catch (e) {
    console.error('Firebase Admin SDK initialization failed:', e);
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
    // Due to persistent authentication issues with the environment,
    // the automated moderation tools have been temporarily disabled.
    // We will flag every report for manual review.
    try {
      const noteRef = adminDb.doc(`notes/${input.noteId}`);
      await noteRef.update({
        visibility: 'unlisted',
        'review.status': 'pending',
        'review.reason': `Reported by ${input.reporterUid}: ${input.reason}`,
      });

      return {
        success: true,
        actionTaken: 'flagged',
        message: "Thank you for your report. The note has been flagged for further review by our team.",
      };

    } catch (error: any) {
       console.error("Error flagging note for review:", error);
       return {
        success: false,
        actionTaken: 'none',
        message: 'There was an error submitting your report. Please try again later.',
      };
    }
  }
);

export async function reportNote(input: ReportNoteInput): Promise<ReportNoteOutput> {
  return reportNoteFlow(input);
}
