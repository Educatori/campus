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
    apiKey: "AIzaSyCujVjW7Aorn0illq_2w50u8oAgWGJEBRY",
  authDomain: "cruscotto-722bc.firebaseapp.com",
  databaseURL: "https://cruscotto-722bc-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cruscotto-722bc",
  storageBucket: "cruscotto-722bc.firebasestorage.app",
  messagingSenderId: "594198664103",
  appId: "1:594198664103:web:cc50982af1a9fc757b5c82",
  measurementId: "G-BVS9JG6HVC"
};

const app  = initializeApp(firebaseConfig);
const db   = getDatabase(app);
const auth = getAuth(app);

// Sessione limitata al tab corrente (chiudi il browser → logout)
setPersistence(auth, browserSessionPersistence).catch(console.error);

export { db, ref, get, child, auth, signInWithEmailAndPassword, signOut, onAuthStateChanged };
