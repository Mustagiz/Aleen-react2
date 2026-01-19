import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCSg3gx0Zs-MVlHypm7_3yj33fvxeQ4JLA",
    authDomain: "aleen-55164.firebaseapp.com",
    projectId: "aleen-55164",
    storageBucket: "aleen-55164.firebasestorage.app",
    messagingSenderId: "54437813504",
    appId: "1:54437813504:web:2777b1c035aa1d263667e5",
    measurementId: "G-KEQH31TQSM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
