// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHgw-qcbItmoYhn0yAGJVZ6BRKavahrs0",
  authDomain: "todo-68ed5.firebaseapp.com",
  projectId: "todo-68ed5",
  storageBucket: "todo-68ed5.firebasestorage.app",
  messagingSenderId: "396924953159",
  appId: "1:396924953159:web:8ed4bc4fdcb194706d4762",
  measurementId: "G-L0GF9R38X8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to session only
setPersistence(auth, browserSessionPersistence)
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });

const db = getFirestore(app);

export { auth, db };

