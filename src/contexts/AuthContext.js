import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user role from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ ...firebaseUser, ...userData, role: userData.role || 'cashier' }); // Default to cashier if no role
          } else {
            // If no firestore doc exists yet (manual console creation), treat as admin for now or handle gracefully
            // For safety in this migration phase, if email is 'admin@aleen.com', give admin role
            const role = firebaseUser.email === 'admin@aleen.com' ? 'admin' : 'cashier';
            setUser({ ...firebaseUser, role });

            // Create the doc so it exists next time
            try {
              await setDoc(userDocRef, {
                email: firebaseUser.email,
                role,
                createdAt: new Date().toISOString()
              });
            } catch (docError) {
              console.error("Error creating user profile:", docError);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to allow login even if Firestore fails
          setUser({ ...firebaseUser, role: 'cashier' });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  // Admin function to create new staff users
  const createStaffUser = async (email, password, role, name) => {
    // Note: This will sign in as the new user immediately if used on client side without a secondary app instance.
    // For a simple app, we can use a Cloud Function or just accept the relog behavior for now, 
    // OR just creating them in Firebase Console is safer for the existing Admin.
    // For this implementation, we will assume Admin creates them via Console or a separate process, 
    // BUT we need a way to set their role. Here is a helper to just set role for a UID if we know it, 
    // or we can implement a full "Manage Users" page later.

    // For now, let's just stick to standard Auth functions.
    // The previous 'changePassword' logic is no longer needed as Firebase handles it.
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
