import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user in localStorage or sessionStorage
    const userFromStorage = 
      JSON.parse(localStorage.getItem('userInfo')) || 
      JSON.parse(sessionStorage.getItem('userInfo'));
    
    if (userFromStorage) {
      setUser(userFromStorage);
      // Set axios default header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${userFromStorage.token}`;
    }
    
    setLoading(false);
  }, []);

  // Login handler
  const login = (userData, rememberMe = false) => {
    if (rememberMe) {
      localStorage.setItem('userInfo', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('userInfo', JSON.stringify(userData));
    }
    
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('userInfo');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Get auth header
  const getAuthHeader = () => {
    return user ? { Authorization: `Bearer ${user.token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getAuthHeader }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 