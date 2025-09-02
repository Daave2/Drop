
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
