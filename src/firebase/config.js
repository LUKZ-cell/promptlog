import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJsYAsCObIqVQlRGyTWHgzqYWxtPSA1HU",
  authDomain: "prompt-logbuch.firebaseapp.com",
  projectId: "prompt-logbuch",
  storageBucket: "prompt-logbuch.firebasestorage.app",
  messagingSenderId: "51548539917",
  appId: "1:51548539917:web:4b5db46f83323f00cbd944"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 