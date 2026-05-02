import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// Just create it, don't import it!
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // ... rest of your code
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    // Check if token exists and parse user info
    if (token) {
      const userInfo = authService.getUserFromToken();
      setUser(userInfo);
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const newToken = response.data.token;
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      const userInfo = authService.getUserFromToken();
      setUser(userInfo);
      return userInfo;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, fullName, userType, specialty = null) => {
    try {
      if (userType === 'PATIENT') {
        await authService.registerPatient(email, password, fullName);
      } else if (userType === 'DOCTOR') {
        await authService.registerDoctor(email, password, fullName, specialty);
      } else if (userType === 'ADMIN') {
        await authService.registerAdmin(email, password, fullName);
      }
      return { success: true, message: `${userType} registered successfully!` };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
