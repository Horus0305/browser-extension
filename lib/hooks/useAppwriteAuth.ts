/**
 * React hooks for Appwrite authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { appwriteAuth, AuthUser } from '../appwrite/AppwriteAuth';

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
  updatePassword: (newPassword: string, oldPassword: string) => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  refreshSession: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
    const initializeAuth = async () => {
      try {
        await appwriteAuth.initialize();
        
        setState({
          user: appwriteAuth.getCurrentUser(),
          isAuthenticated: appwriteAuth.isAuthenticated(),
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication failed'
        }));
      }
    };

    // Set up OAuth completion listener
    const runtime = (globalThis as any).browser?.runtime || (globalThis as any).chrome?.runtime;
    const oauthListener = (message: any) => {
      if (message.type === 'OAUTH_SUCCESS') {
        console.log('OAuth success received in hook');
        // Refresh auth state after OAuth success
        setTimeout(async () => {
          try {
            await appwriteAuth.handleOAuthCallback();
            setState({
              user: appwriteAuth.getCurrentUser(),
              isAuthenticated: appwriteAuth.isAuthenticated(),
              isLoading: false,
              error: null
            });
          } catch (error) {
            console.error('OAuth callback handling failed:', error);
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: 'OAuth authentication failed'
            }));
          }
        }, 500);
      } else if (message.type === 'OAUTH_ERROR') {
        console.error('OAuth error received in hook:', message.error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: message.error || 'OAuth authentication failed'
        }));
      }
    };

    if (runtime?.onMessage?.addListener) {
      runtime.onMessage.addListener(oauthListener);
    }

    initializeAuth();

    // Cleanup listener on unmount
    return () => {
      if (runtime?.onMessage?.removeListener) {
        runtime.onMessage.removeListener(oauthListener);
      }
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await appwriteAuth.signIn(email, password);
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      // Force a state update to ensure component re-renders
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          user: appwriteAuth.getCurrentUser(),
          isAuthenticated: appwriteAuth.isAuthenticated()
        }));
      }, 50);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      }));
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await appwriteAuth.signUp(email, password, name);
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      // Force a state update to ensure component re-renders
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          user: appwriteAuth.getCurrentUser(),
          isAuthenticated: appwriteAuth.isAuthenticated()
        }));
      }, 50);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      }));
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await appwriteAuth.signInWithGoogle();
      
      // After OAuth completes, update the auth state
      const user = appwriteAuth.getCurrentUser();
      setState({
        user,
        isAuthenticated: appwriteAuth.isAuthenticated(),
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Google sign in failed'
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

  const updatePassword = useCallback(async (newPassword: string, oldPassword: string) => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await appwriteAuth.updatePassword(newPassword, oldPassword);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const recoverPassword = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await appwriteAuth.recoverPassword(email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password recovery failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const sendEmailVerification = useCallback(async () => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      await appwriteAuth.sendEmailVerification();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
      setState(prev => ({ ...prev, error: errorMessage }));
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

  const deleteAccount = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await appwriteAuth.deleteAccount();
      
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
        error: error instanceof Error ? error.message : 'Account deletion failed'
      }));
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
    updatePassword,
    recoverPassword,
    sendEmailVerification,
    refreshSession,
    deleteAccount,
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