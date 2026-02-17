import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [cashierPassword, setCashierPassword] = useState('cashier123');
  const [loading, setLoading] = useState(true);

  // Sync passwords from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'auth'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setAdminPassword(data.password || 'admin123');
        setCashierPassword(data.cashierPassword || 'cashier123');
      } else {
        // Initialize if not exists
        setDoc(doc(db, 'settings', 'auth'), {
          password: 'admin123',
          cashierPassword: 'cashier123'
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      if (email === 'admin@aleen.com' && password === adminPassword) {
        const userData = { email, role: 'admin' };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        resolve(userData);
      } else if (email === 'cashier@aleen.com' && password === cashierPassword) {
        const userData = { email, role: 'cashier' };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        resolve(userData);
      } else {
        reject(new Error('Invalid credentials'));
      }
    });
  };

  const changePassword = (currentPassword, newPassword) => {
    if (currentPassword !== adminPassword) {
      return Promise.resolve({ success: false, error: 'Current password is incorrect' });
    }
    return updateDoc(doc(db, 'settings', 'auth'), { password: newPassword })
      .then(() => ({ success: true }));
  };

  const changeCashierPassword = (newPassword) => {
    return updateDoc(doc(db, 'settings', 'auth'), { cashierPassword: newPassword })
      .then(() => ({ success: true }));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, changeCashierPassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
