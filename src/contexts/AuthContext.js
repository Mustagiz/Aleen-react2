import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = (email, password) => {
    const currentPassword = localStorage.getItem('adminPassword') || 'admin123';
    if (email === 'admin@aleen.com' && password === currentPassword) {
      const userData = { email };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return Promise.resolve();
    }
    return Promise.reject(new Error('Invalid credentials'));
  };

  const changePassword = (currentPassword, newPassword) => {
    const savedPassword = localStorage.getItem('adminPassword') || 'admin123';
    if (currentPassword !== savedPassword) {
      return Promise.reject(new Error('Current password is incorrect'));
    }
    localStorage.setItem('adminPassword', newPassword);
    return Promise.resolve();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
