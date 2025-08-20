/**
 * React hook for Appwrite authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { appwriteAuth } from '../appwrite/AppwriteAuth';
import type { AuthUser } from '../appwrite/AppwriteAuth';

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  forceRefresh: () => void;
}

/**
 * Main authentication hook
 */
export function useAppwriteAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Initialize authentication on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        await appwriteAuth.initialize();
        
        if (mounted) {
          setState({
            user: appwriteAuth.getCurrentUser(),
            isAuthenticated: appwriteAuth.isAuthenticated(),
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        if (mounted) {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication initialization failed'
          });
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await appwriteAuth.signIn(email, password);
      
      setState({
        user: appwriteAuth.getCurrentUser(),
        isAuthenticated: appwriteAuth.isAuthenticated(),
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await appwriteAuth.signUp(email, password, name);
      
      setState({
        user: appwriteAuth.getCurrentUser(),
        isAuthenticated: appwriteAuth.isAuthenticated(),
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await appwriteAuth.signInWithGoogle();
      
      setState({
        user: appwriteAuth.getCurrentUser(),
        isAuthenticated: appwriteAuth.isAuthenticated(),
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await appwriteAuth.signOut();
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      }));
      throw error;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      await appwriteAuth.refreshSession();
      
      setState(prev => ({
        ...prev,
        user: appwriteAuth.getCurrentUser(),
        isAuthenticated: appwriteAuth.isAuthenticated(),
        error: null
      }));
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Session refresh failed'
      });
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const forceRefresh = useCallback(() => {
    setState(prev => ({
      ...prev,
      user: appwriteAuth.getCurrentUser(),
      isAuthenticated: appwriteAuth.isAuthenticated()
    }));
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshSession,
    clearError,
    forceRefresh
  };
}

/**
 * Hook for checking authentication status only
 */
export function useAuthStatus(): {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
} {
  const { isAuthenticated, user, isLoading } = useAppwriteAuth();
  
  return { isAuthenticated, user, isLoading };
}

/**
 * Hook for authentication actions only
 */
export function useAuthActions(): Pick<AuthActions, 'signIn' | 'signUp' | 'signInWithGoogle' | 'signOut'> {
  const { signIn, signUp, signInWithGoogle, signOut } = useAppwriteAuth();
  
  return { signIn, signUp, signInWithGoogle, signOut };
}
