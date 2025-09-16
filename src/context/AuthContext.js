// src/context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Check if user data exists in secure storage
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        const user = JSON.parse(userData);
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Replace with actual API call
      // For now, simulate login
      const mockUser = {
        id: '1',
        email,
        name: 'Guest User',
        avatar: null,
        createdAt: new Date().toISOString(),
      };

      // Store user data securely
      await SecureStore.setItemAsync('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('isLoggedIn', 'true');
      
      dispatch({ type: 'SET_USER', payload: mockUser });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // TODO: Replace with actual API call
      const mockUser = {
        id: Date.now().toString(),
        email,
        name,
        avatar: null,
        createdAt: new Date().toISOString(),
      };

      await SecureStore.setItemAsync('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('isLoggedIn', 'true');
      
      dispatch({ type: 'SET_USER', payload: mockUser });
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('user');
      await AsyncStorage.removeItem('isLoggedIn');
      dispatch({ type: 'LOGOUT' });
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (userData) => {
    try {
      const updatedUser = { ...state.user, ...userData };
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      dispatch({ type: 'SET_USER', payload: updatedUser });
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};