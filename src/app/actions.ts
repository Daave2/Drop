"use server";

import { moderateContent } from '@/ai/flows/content-moderation';
import { GhostNote, Note } from '@/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const replySchema = z.object({
  noteId: z.string(),
  text: z.string().min(1, "Reply cannot be empty.").max(120, "Reply cannot exceed 120 characters."),
});

const noteSchema = z.object({
  text: z.string().min(1, "Note cannot be empty.").max(800, "Note cannot exceed 800 characters."),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});


type CreateNoteFormState = {
    message: string;
    errors?: Record<string, string[] | undefined>;
    success: boolean;
    note?: GhostNote;
}

export async function createNote(prevState: CreateNoteFormState, formData: FormData): Promise<CreateNoteFormState> {
  const validatedFields = noteSchema.safeParse({
    text: formData.get('text'),
    lat: formData.get('lat'),
    lng: formData.get('lng'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
      success: false,
    };
  }

  const { text, lat, lng } = validatedFields.data;

  try {
    const moderationResult = await moderateContent({ text });
    if (!moderationResult.isSafe) {
      return {
        errors: { text: [moderationResult.reason || 'This note violates our content policy.'] },
        message: 'Your note was flagged as inappropriate. Please revise.',
        success: false,
      };
    }
    
    const newNoteDoc: Omit<Note, 'id' | 'createdAt'> = {
      text,
      lat,
      lng,
      type: 'text',
      score: 0,
      teaser: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
      authorPseudonym: 'Wandering Wombat',
      geohash: '',
      visibility: 'public',
      trust: 0.5,
      placeMaskMeters: 10,
      revealMode: 'proximity+sightline',
      revealRadiusM: 35,
      revealAngleDeg: 20,
      peekable: false,
      dmAllowed: false,
    };

    const docRef = await addDoc(collection(db, 'notes'), {
        ...newNoteDoc,
        createdAt: serverTimestamp(),
    });

    const newGhostNote: GhostNote = {
      id: docRef.id,
      lat,
      lng,
      teaser: newNoteDoc.teaser,
      type: newNoteDoc.type,
      score: newNoteDoc.score,
      createdAt: { 
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
    };
    
    revalidatePath(`/`);

    return { message: 'Note dropped successfully!', success: true, note: newGhostNote };
    
  } catch (error) {
    console.error("Error creating note:", error);
    return { message: 'An unexpected error occurred. Please try again.', success: false };
  }
}

type ReplyFormState = {
    message: string;
    errors?: Record<string, string[] | undefined>;
    success: boolean;
}

export async function submitReply(prevState: ReplyFormState, formData: FormData): Promise<ReplyFormState> {
  const validatedFields = replySchema.safeParse({
    noteId: formData.get('noteId'),
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
      success: false,
    };
  }
  
  const { text, noteId } = validatedFields.data;

  try {
    const moderationResult = await moderateContent({ text });
    if (!moderationResult.isSafe) {
      return {
        errors: { text: [moderationResult.reason || 'This reply violates our content policy.'] },
        message: 'Your reply was flagged as inappropriate. Please revise.',
        success: false,
      };
    }
    
    console.log('Reply is safe, saving to DB:', { noteId, text });
    
    // TODO: Actually save the reply to the database
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { message: 'Reply posted successfully!', success: true };
    
  } catch (error) {
    console.error("Error submitting reply:", error);
    return { message: 'An unexpected error occurred. Please try again.', success: false };
  }
}
