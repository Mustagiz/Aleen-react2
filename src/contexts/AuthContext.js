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
    if (email === 'admin@aleen.com' && password === 'admin123') {
      const userData = { email };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return Promise.resolve();
    }
    return Promise.reject(new Error('Invalid credentials'));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
