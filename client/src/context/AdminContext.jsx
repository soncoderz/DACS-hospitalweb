import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in
    const checkAdminLoggedIn = async () => {
      const adminToken = localStorage.getItem('adminToken');
      
      if (adminToken) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
          const response = await api.get('/admin/me');
          
          if (response.data.success) {
            setAdmin(response.data.data);
          } else {
            // If API call fails, remove token and admin data
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
          }
        } catch (error) {
          console.error('Error checking admin login status:', error);
          // If API call throws error, remove token and admin data
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
        }
      }
      
      setLoading(false);
    };

    checkAdminLoggedIn();
  }, []);

  // Login admin
  const loginAdmin = (adminData) => {
    setAdmin(adminData);
    api.defaults.headers.common['Authorization'] = `Bearer ${adminData.token}`;
    localStorage.setItem('adminToken', adminData.token);
    localStorage.setItem('adminData', JSON.stringify(adminData));
  };

  // Logout admin
  const logoutAdmin = () => {
    setAdmin(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    delete api.defaults.headers.common['Authorization'];
  };

  // Check if admin has permission
  const hasPermission = (permission) => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    return admin.permissions.includes(permission);
  };

  return (
    <AdminContext.Provider value={{ admin, loading, loginAdmin, logoutAdmin, hasPermission }}>
      {children}
    </AdminContext.Provider>
  );
}; 