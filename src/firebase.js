import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCD19s5igUtSoMyLPoQhia1vvs3IRzbu-0",
    authDomain: "aleen-a02da.firebaseapp.com",
    projectId: "aleen-a02da",
    storageBucket: "aleen-a02da.firebasestorage.app",
    messagingSenderId: "658986722156",
    appId: "1:658986722156:web:2a8cdff7b7d7e3fee24949",
    measurementId: "G-960HTTBH1C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
