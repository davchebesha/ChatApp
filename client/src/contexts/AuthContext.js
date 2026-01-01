import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('🔍 AuthContext: Checking stored auth data', { token: !!token, userData: !!userData });
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('✅ AuthContext: Found stored user', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ AuthContext: Error parsing stored user data', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log('🔐 AuthContext: Attempting login', { email });
    
    try {
      const apiUrl = 'http://localhost:5001/api/auth/login';
      console.log('📡 AuthContext: Making request to', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 AuthContext: Response status', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ AuthContext: Login failed', errorData);
        toast.error(errorData.message || 'Login failed');
        return {
          success: false,
          message: errorData.message || 'Login failed'
        };
      }

      const data = await response.json();
      console.log('✅ AuthContext: Login successful', { user: data.user });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      toast.success('Login successful!');
      navigate('/chat');
      
      return { success: true };
    } catch (error) {
      console.error('🚨 AuthContext: Network error during login', error);
      toast.error('Network error. Please check your connection and try again.');
      return {
        success: false,
        message: 'Network error. Please check your connection.'
      };
    }
  };

  const register = async (username, email, password) => {
    console.log('📝 AuthContext: Attempting registration', { username, email });
    
    try {
      const apiUrl = 'http://localhost:5001/api/auth/register';
      console.log('📡 AuthContext: Making request to', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      console.log('📡 AuthContext: Response status', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ AuthContext: Registration failed', errorData);
        toast.error(errorData.message || 'Registration failed');
        return {
          success: false,
          message: errorData.message || 'Registration failed'
        };
      }

      const data = await response.json();
      console.log('✅ AuthContext: Registration successful', { user: data.user });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      toast.success('Registration successful! Welcome to NexusChat!');
      navigate('/chat');
      
      return { success: true };
    } catch (error) {
      console.error('🚨 AuthContext: Network error during registration', error);
      toast.error('Network error. Please check your connection and try again.');
      return {
        success: false,
        message: 'Network error. Please check your connection.'
      };
    }
  };

  const logout = () => {
    console.log('🚪 AuthContext: Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const updateUser = (userData) => {
    console.log('🔄 AuthContext: Updating user data', userData);
    setUser(prev => ({ ...prev, ...userData }));
    localStorage.setItem('user', JSON.stringify({ ...user, ...userData }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
