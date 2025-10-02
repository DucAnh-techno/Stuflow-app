// src/firebase/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC2rSPGWwRDqCaLRB4R6W-H1DDUI1Xb0l0",
  authDomain: "stuflow-7050c.firebaseapp.com",
  projectId: "stuflow-7050c",
  storageBucket: "stuflow-7050c.firebasestorage.app",
  messagingSenderId: "884470691946",
  appId: "1:884470691946:web:bd73fea8dcc9d8f1b0f213",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const storage = getStorage(app);

export { app, db, storage };

