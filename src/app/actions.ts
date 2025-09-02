
"use server";

import { moderateContent } from '@/ai/flows/content-moderation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, runTransaction, updateDoc, deleteDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Note } from '@/types';


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


export async function toggleLikeNote(noteId: string, uid: string): Promise<{ success: boolean; error?: string; }> {
    if (!uid) {
        return { success: false, error: 'User not authenticated.' };
    }

    const noteRef = doc(db, 'notes', noteId);
    const likeRef = doc(db, 'notes', noteId, 'likes', uid);

    try {
        await runTransaction(db, async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            const noteDoc = await transaction.get(noteRef);

            if (!noteDoc.exists()) {
                throw new Error("Note does not exist!");
            }

            const currentScore = noteDoc.data().score || 0;

            if (likeDoc.exists()) {
                // User has liked the note, so unlike it.
                transaction.delete(likeRef);
                transaction.update(noteRef, { score: currentScore - 1 });
            } else {
                // User has not liked the note, so like it.
                transaction.set(likeRef, { userId: uid, createdAt: serverTimestamp() });
                transaction.update(noteRef, { score: currentScore + 1 });
            }
        });
        return { success: true };
    } catch (error: any) {
        console.error("Transaction failed: ", error);
        return { success: false, error: error.message };
    }
}
