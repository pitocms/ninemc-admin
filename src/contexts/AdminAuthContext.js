'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminApi } from '@/lib/adminApi';

const AdminAuthContext = createContext({
  admin: null,
  adminToken: null,
  loading: true,
  isAdminAuthenticated: false,
  adminLogin: () => {},
  logoutAdmin: () => {}
});

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Initialize admin auth state from localStorage
  useEffect(() => {
    const initializeAdminAuth = async () => {
      
      if (typeof window !== 'undefined') {
        const savedAdmin = localStorage.getItem('admin');
        const savedAdminToken = localStorage.getItem('adminToken');

        // Check for valid values (not undefined, null, or empty strings)
        if (savedAdmin && savedAdminToken && 
            savedAdmin !== 'undefined' && savedAdmin !== 'null' && savedAdmin !== '' &&
            savedAdminToken !== 'undefined' && savedAdminToken !== 'null' && savedAdminToken !== '') {
          try {
            // Additional validation for valid JSON
            const parsedAdmin = JSON.parse(savedAdmin);

            if (parsedAdmin && typeof parsedAdmin === 'object') {
              setAdmin(parsedAdmin);
              setAdminToken(savedAdminToken);
              setIsAdminAuthenticated(true);
            } else {
              throw new Error('Invalid admin data');
            }
          } catch (error) {
            localStorage.removeItem('admin');
            localStorage.removeItem('adminToken');
          }
        }
      }
      
      setLoading(false);
    };

    initializeAdminAuth();
  }, []);

  const adminLogin = async (email, password) => {
    try {
      const response = await adminApi.post('/auth/login', { email: email.trim(), password });
      
      if (response && response.data && response.data.success) {
        setAdmin(response.data.admin);
        setAdminToken(response.data.token);
        setIsAdminAuthenticated(true);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin', JSON.stringify(response.data.admin));
          localStorage.setItem('adminToken', response.data.token);
        }
        
        toast.success('Admin login successful');
        return { success: true, admin: response.data.admin };
      } else {
        const errorMessage = response.data.message || 'Admin login failed';
        
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Admin login failed';
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logoutAdmin = () => {
    setAdmin(null);
    setAdminToken(null);
    setIsAdminAuthenticated(false);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin');
      localStorage.removeItem('adminToken');
    }
    
  };

  const value = {
    admin,
    adminToken,
    loading,
    isAdminAuthenticated,
    adminLogin,
    logoutAdmin
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    console.warn('useAdminAuth must be used within an AdminAuthProvider');
    return {
      admin: null,
      adminToken: null,
      loading: true,
      isAdminAuthenticated: false,
      adminLogin: () => {},
      logoutAdmin: () => {}
    };
  }
  return context;
};