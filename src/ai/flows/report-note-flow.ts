
'use server';
/**
 * @fileOverview A flow for handling user reports of notes.
 *
 * - reportNote - A function that handles the note reporting process.
 */

import { ai } from '@/ai/genkit';
import {
  ReportNoteInput,
  ReportNoteInputSchema,
  ReportNoteOutput,
  ReportNoteOutputSchema,
} from './report-note';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';

const reportNoteFlow = ai.defineFlow(
  {
    name: 'reportNoteFlow',
    inputSchema: ReportNoteInputSchema,
    outputSchema: ReportNoteOutputSchema,
  },
  async (input) => {
    const parsed = ReportNoteInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: parsed.error.message };
    }

    try {
      if (!getApps().length) {
        initializeApp();
      }
      const db = getFirestore();
      await db.collection('reports').add({
        noteId: parsed.data.noteId,
        reason: parsed.data.reason,
        reporterUid: parsed.data.reporterUid,
        createdAt: FieldValue.serverTimestamp(),
        status: 'pending_review',
      });
      return { success: true, message: 'Report submitted successfully.' };
    } catch (err) {
      console.error('Error recording report', err);
      return { success: false, message: 'Failed to submit report.' };
    }
  }
);

export async function reportNote(
  input: ReportNoteInput
): Promise<ReportNoteOutput> {
  return reportNoteFlow(input);
}
