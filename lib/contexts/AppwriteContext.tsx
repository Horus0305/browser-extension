import React, { createContext, useContext, useEffect, useState } from 'react';
import { account } from '../appwrite/client';
import { Models } from 'appwrite';

interface AppwriteContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppwriteContext = createContext<AppwriteContextType | undefined>(undefined);

export const useAppwrite = () => {
  const context = useContext(AppwriteContext);
  if (!context) {
    throw new Error('useAppwrite must be used within an AppwriteProvider');
  }
  return context;
};

export const AppwriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      await account.create('unique()', email, password, name);
      await login(email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AppwriteContext.Provider value={value}>
      {children}
    </AppwriteContext.Provider>
  );
};