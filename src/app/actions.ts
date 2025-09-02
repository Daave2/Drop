"use server";

import { moderateContent } from '@/ai/flows/content-moderation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const replySchema = z.object({
  noteId: z.string(),
  text: z.string().min(1, "Reply cannot be empty.").max(120, "Reply cannot exceed 120 characters."),
});

const noteSchema = z.object({
  text: z.string().min(1, "Note cannot be empty.").max(800, "Note cannot exceed 800 characters."),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  authorUid: z.string().min(1, "User must be authenticated."),
  authorDisplayName: z.string().optional(),
});

type CreateNoteFormState = {
    message: string;
    errors?: {
        text?: string[];
        lat?: string[];
        lng?: string[];
        authorUid?: string[];
        server?: string[];
    };
    success: boolean;
}

async function getOrCreatePseudonym(uid: string, requestedName?: string | null): Promise<string> {
    const profileRef = doc(db, 'profiles', uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists() && profileSnap.data().pseudonym) {
        return profileSnap.data().pseudonym;
    }

    if (requestedName) {
        await setDoc(profileRef, { pseudonym: requestedName, uid, createdAt: serverTimestamp() }, { merge: true });
        return requestedName;
    }

    const adjectives = ["Whispering", "Wandering", "Silent", "Hidden", "Forgotten", "Lost", "Secret", "Phantom"];
    const nouns = ["Wombat", "Voyager", "Pilgrim", "Ghost", "Scribe", "Oracle", "Nomad", "Dreamer"];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const newPseudonym = `${randomAdjective} ${randomNoun}`;

    await setDoc(profileRef, { pseudonym: newPseudonym, uid, createdAt: serverTimestamp() }, { merge: true });

    return newPseudonym;
}


export async function createNote(prevState: CreateNoteFormState, formData: FormData): Promise<CreateNoteFormState> {
  const validatedFields = noteSchema.safeParse({
    text: formData.get('text'),
    lat: formData.get('lat'),
    lng: formData.get('lng'),
    authorUid: formData.get('authorUid'),
    authorDisplayName: formData.get('authorDisplayName'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
      success: false,
    };
  }

  const { text, lat, lng, authorUid, authorDisplayName } = validatedFields.data;

  try {
    const moderationResult = await moderateContent({ text });
    if (!moderationResult.isSafe) {
      return {
        errors: { text: [moderationResult.reason || 'This note violates our content policy.'] },
        message: 'Your note was flagged as inappropriate. Please revise.',
        success: false,
      };
    }

    const pseudonym = await getOrCreatePseudonym(authorUid, authorDisplayName);
    
    const newNote = {
      text,
      lat,
      lng,
      authorUid,
      createdAt: serverTimestamp(),
      authorPseudonym: pseudonym,
      type: 'text',
      score: 0,
      teaser: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
      visibility: 'public',
      trust: 0.5,
      placeMaskMeters: 10,
      revealMode: 'proximity+sightline',
      revealRadiusM: 35,
      revealAngleDeg: 20,
      peekable: false,
      dmAllowed: false,
    };

    await addDoc(collection(db, 'notes'), newNote);
    
    revalidatePath(`/`);

    return { message: 'Note dropped successfully!', success: true };
    
  } catch (error: any) {
    console.error("Error creating note:", error);
    const errorMessage = error.message || 'An unknown error occurred.';
    return { 
        message: `Failed to save note to database.`,
        success: false, 
        errors: { server: [`Firestore error: ${errorMessage}`] } 
    };
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
    
    revalidatePath(`/notes/${noteId}`);

    return { message: 'Reply posted successfully!', success: true };
    
  } catch (error) {
    console.error("Error submitting reply:", error);
    return { message: 'An unexpected error occurred. Please try again.', success: false };
  }
}
