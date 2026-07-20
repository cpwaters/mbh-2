import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDTYnztmBBveFs5UHU0YpLby68a9Qbj1T8",
  authDomain: "mybackhaul-21112.firebaseapp.com",
  projectId: "mybackhaul-21112",
  storageBucket: "mybackhaul-21112.firebasestorage.app",
  messagingSenderId: "95219807570",
  appId: "1:95219807570:web:f0716c83f7e81c554bb68b",
  measurementId: "G-JN9HQV785R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
