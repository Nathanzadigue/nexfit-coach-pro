import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD85kfyr8hhXxRtFX3wTddtYUm2iEybG3g",
  authDomain: "nexfit-67db9.firebaseapp.com",
  projectId: "nexfit-67db9",
  storageBucket: "nexfit-67db9.appspot.com",
  messagingSenderId: "1017032519014",
  appId: "1:1017032519014:web:601f62fa0d4a54192f2ca7",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
