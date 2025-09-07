import { db } from './firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

const adjectives = ["Whispering", "Wandering", "Silent", "Hidden", "Forgotten", "Lost", "Secret", "Phantom"];
const nouns = ["Wombat", "Voyager", "Pilgrim", "Ghost", "Scribe", "Oracle", "Nomad", "Dreamer"];

/**
 * Generates a pseudonym by pairing a random adjective with a random noun from
 * predefined lists.
 *
 * @param randomFn - Optional RNG for deterministic testing.
 * @returns A string in the format "Adjective Noun".
 */
export function generatePseudonym(randomFn: () => number = Math.random): string {
  const randomAdjective = adjectives[Math.floor(randomFn() * adjectives.length)];
  const randomNoun = nouns[Math.floor(randomFn() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}

/**
 * Retrieves a user's pseudonym from Firestore or creates and stores one if none exists.
 *
 * @param uid - Unique identifier of the user.
 * @param requestedName - User-supplied pseudonym. Used only when the user has no existing pseudonym.
 * @returns The existing or newly created pseudonym. Returns "Anonymous Adventurer" on failure.
 */
export async function getOrCreatePseudonym(uid: string, requestedName?: string | null): Promise<string> {
  try {
    const profileRef = doc(db, 'profiles', uid); // Reference to the user's profile document
    const profileSnap = await getDoc(profileRef); // Fetch existing profile

    if (profileSnap.exists() && profileSnap.data().pseudonym) {
      return profileSnap.data().pseudonym; // Use stored pseudonym if available
    }

    if (requestedName) {
      await setDoc(
        profileRef,
        { pseudonym: requestedName, uid, createdAt: serverTimestamp() },
        { merge: true },
      ); // Save the user-requested pseudonym
      return requestedName;
    }

    const newPseudonym = generatePseudonym();
    await setDoc(
      profileRef,
      { pseudonym: newPseudonym, uid, createdAt: serverTimestamp() },
      { merge: true },
    ); // Store the generated pseudonym
    return newPseudonym;
  } catch (error) {
    console.error('Error getting or creating pseudonym:', error);
    return 'Anonymous Adventurer'; // Fallback pseudonym on error
  }
}

