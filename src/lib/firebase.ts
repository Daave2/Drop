import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCiYgHl8_QcQ2H-9P1B9BarusfjrRzjyvI",
  authDomain: "notedrop-location-based-notes.firebaseapp.com",
  projectId: "notedrop-location-based-notes",
  storageBucket: "notedrop-location-based-notes.appspot.com",
  messagingSenderId: "922876252155",
  appId: "1:922876252155:web:2938b56f8c5efb07f7c55e",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
