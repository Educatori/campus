/* firebase-campus_hub-config.js */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsI40TPF3XQjeJlsPmRKq4aFyO-4ceA1A",
  authDomain: "campushub-90d60.firebaseapp.com",
  databaseURL: "https://campushub-90d60-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "campushub-90d60",
  storageBucket: "campushub-90d60.firebasestorage.app",
  messagingSenderId: "318654288542",
  appId: "1:318654288542:web:069cf435aeab017481e18f",
  measurementId: "G-R5LPY2B2X5"
};

const app  = initializeApp(firebaseConfig);
const db   = getDatabase(app);
const auth = getAuth(app);

// Sessione limitata al tab corrente (chiudi il browser → logout)
setPersistence(auth, browserSessionPersistence).catch(console.error);

export { db, ref, get, child, auth, signInWithEmailAndPassword, signOut, onAuthStateChanged };
