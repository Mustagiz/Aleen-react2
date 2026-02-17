import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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
export const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.log('Firebase Persistence Failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.log('Firebase Persistence Failed: Browser not supported');
    }
});

export default app;
