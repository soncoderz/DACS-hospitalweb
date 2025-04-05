import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!user;

  useEffect(() => {
    // Check for user in localStorage or sessionStorage
    const userFromStorage = 
      JSON.parse(localStorage.getItem('userInfo')) || 
      JSON.parse(sessionStorage.getItem('userInfo'));
    
    if (userFromStorage) {
      console.log('User from storage:', userFromStorage); // Debug
      setUser(userFromStorage);
      // Set axios default header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${userFromStorage.token}`;
    }
    
    setLoading(false);
  }, []);

  // Login handler
  const login = (userData, rememberMe = false) => {
    console.log('Login called with userData:', userData); // Debug
    console.log('User role type:', userData.roleType); // Log role type for debugging
    
    // Debug avatar data
    console.log('Avatar data present:', !!userData.avatarData); 
    console.log('Avatar URL present:', !!userData.avatarUrl);

    // Nếu là cập nhật profile (không có token mới)
    if (!userData.token) {
      // Get the current token from storage
      const currentUser = JSON.parse(localStorage.getItem('userInfo')) || 
                           JSON.parse(sessionStorage.getItem('userInfo'));
      
      if (currentUser && currentUser.token) {
        // Preserve the token when updating user data
        userData = { ...userData, token: currentUser.token };
        console.log('Preserved token during profile update:', userData.token);
      } else {
        console.warn('No token found when updating user profile');
      }
    }
    
    console.log('Final userData to store:', userData); // Debug
    
    // Determine which storage to use (prefer the one already in use if any)
    let storageToUse;
    if (localStorage.getItem('userInfo')) {
      storageToUse = localStorage;
    } else if (sessionStorage.getItem('userInfo')) {
      storageToUse = sessionStorage;
    } else {
      storageToUse = rememberMe ? localStorage : sessionStorage;
    }
    
    // Cập nhật storage
    storageToUse.setItem('userInfo', JSON.stringify(userData));
    
    // Cập nhật state
    setUser(userData);
    
    // Cập nhật header cho axios
    if (userData && userData.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
  };

  // Add updateUserData function
  const updateUserData = (userData) => {
    // Get current user from state
    const currentUser = user;
    
    if (!currentUser) {
      console.warn('No user found to update');
      return;
    }
    
    // Merge new data with current user data, preserving the token
    const updatedUser = { ...currentUser, ...userData };
    
    // Determine which storage to use
    const storageToUse = localStorage.getItem('userInfo') 
      ? localStorage 
      : sessionStorage;
    
    // Cập nhật storage
    storageToUse.setItem('userInfo', JSON.stringify(updatedUser));
    
    // Cập nhật state
    setUser(updatedUser);
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
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated, 
      login, 
      logout, 
      updateUserData, 
      getAuthHeader 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 