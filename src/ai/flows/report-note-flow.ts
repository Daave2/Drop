'use server';
/**
 * @fileOverview A flow for handling user reports of notes.
 *
 * - reportNote - A function that handles the note reporting process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {doc, getDoc, updateDoc} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import {Note} from '@/types';
import {
  ReportNoteInput,
  ReportNoteInputSchema,
  ReportNoteOutput,
  ReportNoteOutputSchema,
} from './report-note';


const getNoteContentTool = ai.defineTool(
  {
    name: 'getNoteContent',
    description: 'Retrieves the content of a specific note from the database.',
    inputSchema: z.object({noteId: z.string()}),
    outputSchema: z.object({
      text: z.string(),
      authorUid: z.string(),
      media: z.array(z.any()).optional(),
    }),
  },
  async ({noteId}) => {
    const noteRef = doc(db, 'notes', noteId);
    const noteSnap = await getDoc(noteRef);
    if (!noteSnap.exists()) {
      throw new Error('Note not found.');
    }
    const note = noteSnap.data() as Note;
    return {
      text: note.text,
      authorUid: note.authorUid || 'unknown',
      media: note.media,
    };
  }
);

const flagNoteTool = ai.defineTool(
  {
    name: 'flagNoteForReview',
    description:
      'Flags a note for manual review by a human moderator. Use this for borderline cases.',
    inputSchema: z.object({noteId: z.string(), reason: z.string()}),
    outputSchema: z.void(),
  },
  async ({noteId, reason}) => {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      visibility: 'unlisted',
      'review.status': 'pending',
      'review.reason': reason,
    });
  }
);

const removeNoteTool = ai.defineTool(
  {
    name: 'removeNote',
    description:
      'Immediately removes a note from public view. Use this for clear, severe violations.',
    inputSchema: z.object({noteId: z.string(), reason: z.string()}),
    outputSchema: z.void(),
  },
  async ({noteId, reason}) => {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      visibility: 'unlisted',
      'review.status': 'removed',
      'review.reason': reason,
    });
  }
);

const reportNoteFlow = ai.defineFlow(
  {
    name: 'reportNoteFlow',
    inputSchema: ReportNoteInputSchema,
    outputSchema: ReportNoteOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      prompt: `You are a Trust and Safety agent for NoteDrop. A user is reporting a note. Your job is to determine the appropriate action based on the note's content and the user's report.

      Content Safety Guidelines:
      - Hate Speech: Prohibited. Includes attacks on protected groups. Action: removeNote.
      - Harassment/Bullying: Prohibited. Includes insults, threats, or targeting individuals. Action: removeNote.
      - Spam/Scams: Prohibited. Includes unsolicited ads or fraudulent content. Action: removeNote.
      - Private Information: Prohibited. Sharing addresses, phone numbers, etc. Action: removeNote.
      - Disinformation/Misinformation: Content that is blatantly false and harmful. Action: flagNoteForReview.
      - Low-Quality/Uninteresting: Not a violation. A user disliking content is not grounds for removal. Action: Do not call any tool.

      User's Report Reason:
      "${input.reason}"

      Analyze the user's reason and the note's content (which you must fetch with getNoteContent). Decide whether to:
      1.  **removeNote**: For clear, severe violations (hate speech, harassment, spam, private info).
      2.  **flagNoteForReview**: For content that is borderline, subjective, or requires human judgment (like potential misinformation).
      3.  **Do Nothing**: If the report seems unfounded or is about something that is not a violation (e.g., "I don't like this note," "This is boring").

      If the reporter's UID is the same as the author's UID, it's likely a self-report or test. In this case, do not take any action.

      If you take an action, provide a brief, professional message to the reporting user explaining what happened. If you take no action, explain why the content does not violate the policies.`,
      tools: [getNoteContentTool, flagNoteTool, removeNoteTool],
      model: ai.getModel('googleai/gemini-2.5-pro'),
    });

    const toolCalls = output!.toolCalls;

    if (!toolCalls || toolCalls.length === 0) {
      return {
        success: true,
        actionTaken: 'none',
        message:
          output!.text ||
          "Thank you for your report. We've reviewed it and found that the content does not violate our policies.",
      };
    }

    const calledTool = toolCalls[0];
    if (calledTool.tool === 'removeNote') {
      return {
        success: true,
        actionTaken: 'removed',
        message:
          "Thank you for your report. We have removed the note as it violates our content policies.",
      };
    }
    if (calledTool.tool === 'flagNoteForReview') {
      return {
        success: true,
        actionTaken: 'flagged',
        message:
          "Thank you for your report. The note has been flagged for further review by our team.",
      };
    }

    return {
      success: true,
      actionTaken: 'none',
      message:
        "Thank you for your report. We will review it, but no immediate action was taken.",
    };
  }
);

export async function reportNote(input: ReportNoteInput): Promise<ReportNoteOutput> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  return reportNoteFlow(input);
}
