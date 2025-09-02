import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCiYgHl8_QcQ2H-9P1B9BarusfjrRzjyvI",
  authDomain: "notedrop-location-based-notes.firebaseapp.com",
  projectId: "notedrop-location-based-notes",
  storageBucket: "notedrop-location-based-notes.firebasestorage.app",
  messagingSenderId: "922876252155",
  appId: "1:922876252155:web:2938b56f8c5efb07f7c55e",
  measurementId: "",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// If in development, connect to emulators.
// This check is generally safe for production builds,
// as env vars are replaced at build time.
if (process.env.NODE_ENV === 'development') {
    // It's recommended to handle emulator connections here
    // But for this project, we're assuming direct connection.
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectStorageEmulator(storage, 'localhost', 9199);
    // connectFunctionsEmulator(functions, 'localhost', 5001);
}


export { app, auth, db, storage, functions };
