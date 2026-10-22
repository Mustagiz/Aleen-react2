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
  
  // Real-time Staff Members with RBAC permissions
  const [staffList, setStaffList] = useState(() => {
    try {
      const saved = localStorage.getItem('aleen_staff_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'staff_default_cashier',
        name: 'Front Counter Cashier',
        loginId: 'cashier',
        email: 'cashier@aleen.com',
        role: 'cashier',
        password: 'cashier123',
        status: 'active',
        phone: '+91 98765 00000',
        permissions: {
          dashboard: true,
          invoices: true,
          inventory: true,
          tailoring: true,
          customers: true,
          reports: false,
          purchases: false,
          settings: false
        }
      }
    ];
  });

  const [loading, setLoading] = useState(false);

  // Sync passwords and staff from Firestore
  useEffect(() => {
    let unsubAuth = () => {};
    let unsubStaff = () => {};

    try {
      // 1. Sync admin and cashier credentials
      unsubAuth = onSnapshot(
        doc(db, 'settings', 'auth'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setAdminPassword(data.password || 'admin123');
            setCashierPassword(data.cashierPassword || 'cashier123');
          } else {
            setDoc(doc(db, 'settings', 'auth'), {
              password: 'admin123',
              cashierPassword: 'cashier123'
            }).catch(() => {});
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Auth settings sync warning:', error);
          setLoading(false);
        }
      );

      // 2. Sync staff roster
      unsubStaff = onSnapshot(
        doc(db, 'settings', 'staff'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data.members)) {
              setStaffList(data.members);
              try {
                localStorage.setItem('aleen_staff_members', JSON.stringify(data.members));
              } catch (e) {}
            }
          } else {
            // Initialize staff collection if not present
            setDoc(doc(db, 'settings', 'staff'), { members: staffList }).catch(() => {});
          }
        },
        (error) => {
          console.warn('Staff roster sync warning:', error);
        }
      );
    } catch (err) {
      console.warn('Error attaching auth listeners:', err);
      setLoading(false);
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => {
      clearTimeout(timer);
      if (typeof unsubAuth === 'function') unsubAuth();
      if (typeof unsubStaff === 'function') unsubStaff();
    };
  }, []);

  // Save staff list helper (Firestore + LocalStorage)
  const persistStaffList = async (newList) => {
    setStaffList(newList);
    try {
      localStorage.setItem('aleen_staff_members', JSON.stringify(newList));
      await setDoc(doc(db, 'settings', 'staff'), { members: newList }, { merge: true });
    } catch (e) {
      console.warn('Error persisting staff roster:', e);
    }
  };

  // Add new staff member
  const addStaff = async (staffData) => {
    const newStaff = {
      id: 'staff_' + Date.now(),
      name: staffData.name?.trim() || 'Atelier Staff',
      loginId: staffData.loginId?.trim().toLowerCase() || 'staff_' + Math.random().toString(36).substring(2, 6),
      email: staffData.email?.trim() || '',
      phone: staffData.phone?.trim() || '',
      role: staffData.role || 'stylist',
      password: staffData.password || 'staff123',
      status: 'active',
      createdAt: new Date().toISOString(),
      permissions: {
        dashboard: staffData.permissions?.dashboard ?? true,
        invoices: staffData.permissions?.invoices ?? true,
        inventory: staffData.permissions?.inventory ?? true,
        tailoring: staffData.permissions?.tailoring ?? true,
        customers: staffData.permissions?.customers ?? true,
        reports: staffData.permissions?.reports ?? false,
        purchases: staffData.permissions?.purchases ?? false,
        settings: staffData.permissions?.settings ?? false
      }
    };

    // Check duplicate login ID
    if (staffList.some(s => s.loginId.toLowerCase() === newStaff.loginId)) {
      throw new Error(`Login ID "${newStaff.loginId}" is already taken. Please choose another.`);
    }

    const updated = [newStaff, ...staffList];
    await persistStaffList(updated);
    return newStaff;
  };

  // Update staff details or permissions
  const updateStaff = async (staffId, updates) => {
    const updated = staffList.map(s => {
      if (s.id === staffId) {
        return {
          ...s,
          ...updates,
          permissions: updates.permissions ? { ...s.permissions, ...updates.permissions } : s.permissions
        };
      }
      return s;
    });
    await persistStaffList(updated);
  };

  // Reset or change staff password
  const resetStaffPassword = async (staffId, newPassword) => {
    if (!newPassword || newPassword.length < 4) {
      throw new Error('Password must be at least 4 characters long');
    }
    const updated = staffList.map(s => {
      if (s.id === staffId) {
        return { ...s, password: newPassword };
      }
      return s;
    });
    await persistStaffList(updated);
  };

  // Delete staff member
  const deleteStaff = async (staffId) => {
    const updated = staffList.filter(s => s.id !== staffId);
    await persistStaffList(updated);
  };

  // Login with support for Admin, Cashier, and Custom Staff Login IDs
  const login = (identifier, password) => {
    return new Promise((resolve, reject) => {
      const cleanId = (identifier || '').trim().toLowerCase();

      // 1. Master Administrator check
      if ((cleanId === 'admin@aleen.com' || cleanId === 'admin') && password === adminPassword) {
        const userData = {
          email: 'admin@aleen.com',
          loginId: 'admin',
          displayName: 'Atelier Director',
          role: 'admin',
          permissions: {
            dashboard: true,
            invoices: true,
            inventory: true,
            tailoring: true,
            customers: true,
            reports: true,
            purchases: true,
            settings: true
          }
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return resolve(userData);
      }

      // 2. Legacy Default Cashier check
      if ((cleanId === 'cashier@aleen.com' || cleanId === 'cashier') && password === cashierPassword) {
        const userData = {
          email: 'cashier@aleen.com',
          loginId: 'cashier',
          displayName: 'Sales Stylist',
          role: 'cashier',
          permissions: {
            dashboard: true,
            invoices: true,
            inventory: true,
            tailoring: true,
            customers: true,
            reports: false,
            purchases: false,
            settings: false
          }
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return resolve(userData);
      }

      // 3. Custom Staff Member Login ID or Email lookup
      const matchedStaff = staffList.find(s => 
        (s.loginId && s.loginId.toLowerCase() === cleanId) ||
        (s.email && s.email.toLowerCase() === cleanId)
      );

      if (matchedStaff) {
        if (matchedStaff.status === 'suspended') {
          return reject(new Error('This staff account is currently suspended. Please contact store management.'));
        }
        if (matchedStaff.password === password) {
          const userData = {
            id: matchedStaff.id,
            loginId: matchedStaff.loginId,
            email: matchedStaff.email || `${matchedStaff.loginId}@aleen.com`,
            displayName: matchedStaff.name,
            role: matchedStaff.role || 'staff',
            permissions: matchedStaff.permissions || {
              dashboard: true,
              invoices: true,
              inventory: true,
              tailoring: true,
              customers: true,
              reports: false,
              purchases: false,
              settings: false
            }
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          return resolve(userData);
        }
      }

      reject(new Error('Invalid Login ID or Password. Please check your credentials.'));
    });
  };

  const changePassword = (currentPassword, newPassword) => {
    if (currentPassword !== adminPassword) {
      return Promise.resolve({ success: false, error: 'Current password is incorrect' });
    }
    return updateDoc(doc(db, 'settings', 'auth'), { password: newPassword })
      .then(() => {
        setAdminPassword(newPassword);
        return { success: true };
      });
  };

  const changeCashierPassword = (newPassword) => {
    return updateDoc(doc(db, 'settings', 'auth'), { cashierPassword: newPassword })
      .then(() => {
        setCashierPassword(newPassword);
        return { success: true };
      });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      changePassword,
      changeCashierPassword,
      staffList,
      addStaff,
      updateStaff,
      resetStaffPassword,
      deleteStaff,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
