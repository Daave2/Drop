
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
import { REPORT_THRESHOLD } from '@/lib/reporting';

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
      await db.runTransaction(async (t) => {
        const noteRef = db.collection('notes').doc(parsed.data.noteId);
        const noteSnap = await t.get(noteRef);
        const current = noteSnap.data()?.reportCount ?? 0;
        const newCount = current + 1;
        const updates: any = { reportCount: newCount };
        if (newCount >= REPORT_THRESHOLD) {
          updates.visibility = 'unlisted';
        }
        t.update(noteRef, updates);
        const reportRef = db.collection('reports').doc();
        t.set(reportRef, {
          noteId: parsed.data.noteId,
          reason: parsed.data.reason,
          reporterUid: parsed.data.reporterUid,
          createdAt: FieldValue.serverTimestamp(),
          status: 'pending_review',
        });
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
