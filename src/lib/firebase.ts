
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { getAuth as getAdminAuth, getApp as getAdminApp, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
  // Client-side initialization
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // Server-side initialization
  if (!getApps().length) {
     initializeAdminApp({
        credential: undefined, // Assumes application default credentials
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
     });
  }
  // We are providing a lightweight shim for the server-side SDKs
  // to avoid breaking client-side code that uses the same import paths.
  // The actual server-side logic in flows will use the admin SDK directly.
  // For this to work seamlessly, we cast the admin services to their client-side types.
  // This is a pragmatic approach for this specific project structure.
  auth = getAdminAuth() as unknown as Auth;
  db = getAdminFirestore() as unknown as Firestore;
}

export { app, auth, db, storage };
