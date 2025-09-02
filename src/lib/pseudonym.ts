import { db } from './firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

const adjectives = ["Whispering", "Wandering", "Silent", "Hidden", "Forgotten", "Lost", "Secret", "Phantom"];
const nouns = ["Wombat", "Voyager", "Pilgrim", "Ghost", "Scribe", "Oracle", "Nomad", "Dreamer"];

export function generatePseudonym(randomFn: () => number = Math.random): string {
  const randomAdjective = adjectives[Math.floor(randomFn() * adjectives.length)];
  const randomNoun = nouns[Math.floor(randomFn() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}

export async function getOrCreatePseudonym(uid: string, requestedName?: string | null): Promise<string> {
  try {
    const profileRef = doc(db, 'profiles', uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists() && profileSnap.data().pseudonym) {
      return profileSnap.data().pseudonym;
    }

    if (requestedName) {
      await setDoc(profileRef, { pseudonym: requestedName, uid, createdAt: serverTimestamp() }, { merge: true });
      return requestedName;
    }

    const newPseudonym = generatePseudonym();
    await setDoc(profileRef, { pseudonym: newPseudonym, uid, createdAt: serverTimestamp() }, { merge: true });
    return newPseudonym;
  } catch (error) {
    console.error('Error getting or creating pseudonym:', error);
    return 'Anonymous Adventurer';
  }
}

