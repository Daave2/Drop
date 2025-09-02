"use server";

import { moderateContent } from '@/ai/flows/content-moderation';
import { GhostNote } from '@/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const replySchema = z.object({
  noteId: z.string(),
  text: z.string().min(1, "Reply cannot be empty.").max(120, "Reply cannot exceed 120 characters."),
});

const noteSchema = z.object({
  text: z.string().min(1, "Note cannot be empty.").max(800, "Note cannot exceed 800 characters."),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});


type FormState = {
    message: string;
    errors?: Record<string, string[] | undefined>;
    reset?: boolean;
    note?: GhostNote;
}

export async function createNote(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = noteSchema.safeParse({
    text: formData.get('text'),
    lat: formData.get('lat'),
    lng: formData.get('lng'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
    };
  }

  const { text, lat, lng } = validatedFields.data;

  try {
    const moderationResult = await moderateContent({ text });
    if (!moderationResult.isSafe) {
      return {
        errors: { text: [moderationResult.reason || 'This note violates our content policy.'] },
        message: 'Your note was flagged as inappropriate. Please revise.',
      };
    }
    
    // In a real app, you would save the note to your database here.
    console.log('Note is safe, saving to DB:', { text, lat, lng });

    const newNote: GhostNote = {
      id: new Date().getTime().toString(),
      lat,
      lng,
      teaser: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
      type: 'text',
      score: 0,
      createdAt: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
    };
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    revalidatePath(`/`);

    return { message: 'Note dropped successfully!', errors: {}, reset: true, note: newNote };
    
  } catch (error) {
    console.error("Error creating note:", error);
    return { message: 'An unexpected error occurred. Please try again.', errors: {} };
  }
}

export async function submitReply(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = replySchema.safeParse({
    noteId: formData.get('noteId'),
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
    };
  }
  
  const { text, noteId } = validatedFields.data;

  try {
    const moderationResult = await moderateContent({ text });
    if (!moderationResult.isSafe) {
      return {
        errors: { text: [moderationResult.reason || 'This reply violates our content policy.'] },
        message: 'Your reply was flagged as inappropriate. Please revise.',
      };
    }
    
    // In a real app, you would save the reply to your database here.
    console.log('Reply is safe, saving to DB:', { noteId, text });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Revalidate the path to show the new reply if you were on a note page
    // revalidatePath(`/note/${noteId}`);

    return { message: 'Reply posted successfully!', errors: {}, reset: true };
    
  } catch (error) {
    console.error("Error submitting reply:", error);
    return { message: 'An unexpected error occurred. Please try again.', errors: {} };
  }
}
