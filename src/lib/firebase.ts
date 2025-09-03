
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { Messaging, getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let messaging: Messaging;

// This file is intended for client-side Firebase initialization.
// Server-side initialization should be done in the respective server files (e.g., Genkit flows).
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn('Firebase messaging is not supported in this environment.', err);
    messaging = undefined as unknown as Messaging;
  }
} else {
  // Assign placeholders to preserve types when Firebase isn't configured.
  app = undefined as unknown as FirebaseApp;
  auth = undefined as unknown as Auth;
  db = undefined as unknown as Firestore;
  storage = undefined as unknown as FirebaseStorage;
  messaging = undefined as unknown as Messaging;
  if (typeof window !== 'undefined') {
    console.warn('Firebase configuration is incomplete. Authentication features will be disabled.');
  }
}

export { app, auth, db, storage, messaging, isFirebaseConfigured };
