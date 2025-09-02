
"use server";

import { moderateContent } from '@/ai/flows/content-moderation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, runTransaction, updateDoc, deleteDoc, query, where, getCountFromServer } from 'firebase/firestore';
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

export async function getNotesDroppedCount(uid: string): Promise<number> {
    if (!uid) return 0;
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where("authorUid", "==", uid));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}

export async function getNotesRevealedCount(uid: string): Promise<number> {
    if (!uid) return 0;
    // This is a simplification. We're counting "likes" as "reveals".
    // A more complex system might track reveals separately.
    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where("userId", "==", uid));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}
