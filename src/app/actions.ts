"use server";

import { moderateContent } from '@/ai/flows/content-moderation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Note } from '@/types';

const noteSchema = z.object({
  text: z.string().min(1, "Note cannot be empty.").max(800, "Note cannot exceed 800 characters."),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  authorUid: z.string().min(1, "User must be authenticated."),
  authorDisplayName: z.string().optional(),
  image: z.instanceof(File).optional(),
});

type CreateNoteFormState = {
    message: string;
    errors?: {
        text?: string[];
        lat?: string[];
        lng?: string[];
        authorUid?: string[];
        image?: string[];
        server?: string[];
    };
    success: boolean;
}

export async function getOrCreatePseudonym(uid: string, requestedName?: string | null): Promise<string> {
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
    image: formData.get('image'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
      success: false,
    };
  }

  const { text, lat, lng, authorUid, authorDisplayName, image } = validatedFields.data;

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
    
    const newNote: Omit<Note, 'id' | 'createdAt'> & { createdAt: any } = {
      text,
      lat,
      lng,
      authorUid,
      createdAt: serverTimestamp(),
      authorPseudonym: pseudonym,
      type: image ? 'photo' : 'text',
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
      media: [],
    };
    
    if (image && image.size > 0) {
        if (image.size > 5 * 1024 * 1024) { // 5MB limit
            return { message: 'Image must be less than 5MB.', success: false, errors: { image: ['Image must be less than 5MB.'] } };
        }
        const storageRef = ref(storage, `notes/${authorUid}/${Date.now()}-${image.name}`);
        const snapshot = await uploadBytes(storageRef, image);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // This is a placeholder for actual image dimension detection
        // For now, we'll use arbitrary values.
        const imageDimensions = { w: 600, h: 400 };

        newNote.media = [{
            path: downloadURL,
            type: 'image',
            w: imageDimensions.w,
            h: imageDimensions.h,
        }];
    }


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
