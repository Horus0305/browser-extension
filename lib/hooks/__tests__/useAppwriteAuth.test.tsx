/**
 * Tests for useAppwriteAuth hook
 */

import { renderHook, act } from '@testing-library/react';
import { useAppwriteAuth } from '../useAppwriteAuth';

// Mock AppwriteAuth
jest.mock('../../appwrite/AppwriteAuth', () => {
  const mockAuth = {
    initialize: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    updatePassword: jest.fn(),
    recoverPassword: jest.fn(),
    sendEmailVerification: jest.fn(),
    refreshSession: jest.fn(),
    deleteAccount: jest.fn(),
    getCurrentUser: jest.fn(),
    isAuthenticated: jest.fn()
  };
  
  return {
    appwriteAuth: mockAuth
  };
});

describe('useAppwriteAuth', () => {
  let mockAuth: any;
  
  beforeEach(() => {
    // Get the mocked auth instance
    const { appwriteAuth } = require('../../appwrite/AppwriteAuth');
    mockAuth = appwriteAuth;
    
    jest.clearAllMocks();
    mockAuth.getCurrentUser.mockReturnValue(null);
    mockAuth.isAuthenticated.mockReturnValue(false);
  });

  it('should initialize with loading state', async () => {
    mockAuth.initialize.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAppwriteAuth());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle successful sign in', async () => {
    const mockUser = {
      $id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      emailVerification: true
    };
    
    mockAuth.initialize.mockResolvedValue(undefined);
    mockAuth.signIn.mockResolvedValue(mockUser);
    
    const { result } = renderHook(() => useAppwriteAuth());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password123');
    });
    
    expect(mockAuth.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle sign in errors', async () => {
    mockAuth.initialize.mockResolvedValue(undefined);
    mockAuth.signIn.mockRejectedValue(new Error('Invalid credentials'));
    
    const { result } = renderHook(() => useAppwriteAuth());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrongpassword');
      } catch (error) {
        // Expected to throw
      }
    });
    
    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle successful sign up', async () => {
    const mockUser = {
      $id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      emailVerification: false
    };
    
    mockAuth.initialize.mockResolvedValue(undefined);
    mockAuth.signUp.mockResolvedValue(mockUser);
    
    const { result } = renderHook(() => useAppwriteAuth());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.signUp('test@example.com', 'password123', 'Test User');
    });
    
    expect(mockAuth.signUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle successful sign out', async () => {
    mockAuth.initialize.mockResolvedValue(undefined);
    mockAuth.signOut.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAppwriteAuth());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.signOut();
    });
    
    expect(mockAuth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle password update', async () => {
    mockAuth.initialize.mockResolvedValue(undefined);
    mockAuth.updatePassword.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAppwriteAuth());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.updatePassword('newpassword', 'oldpassword');
    });
    
    expect(mockAuth.updatePassword).toHaveBeenCalledWith('newpassword', 'oldpassword');
    expect(result.current.error).toBeNull();
  });

  it('should handle session refresh', async () => {
    const mockUser = {
      $id: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
      emailVerification: true
    };
    
    mockAuth.initialize.mockResolvedValue(undefined);
    mockAuth.refreshSession.mockResolvedValue(undefined);
    mockAuth.getCurrentUser.mockReturnValue(mockUser);
    mockAuth.isAuthenticated.mockReturnValue(true);
    
    const { result } = renderHook(() => useAppwriteAuth());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.refreshSession();
    });
    
    expect(mockAuth.refreshSession).toHaveBeenCalled();
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle session refresh failure', async () => {
    mockAuth.initialize.mockResolvedValue(undefined);
    mockAuth.refreshSession.mockRejectedValue(new Error('Session expired'));
    
    const { result } = renderHook(() => useAppwriteAuth());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      try {
        await result.current.refreshSession();
      } catch (error) {
        // Expected to throw
      }
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Session expired');
  });

  it('should clear errors', async () => {
    mockAuth.initialize.mockResolvedValue(undefined);
    mockAuth.signIn.mockRejectedValue(new Error('Test error'));
    
    const { result } = renderHook(() => useAppwriteAuth());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Trigger an error
    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrongpassword');
      } catch (error) {
        // Expected to throw
      }
    });
    
    expect(result.current.error).toBe('Test error');
    
    // Clear the error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBeNull();
  });

  it('should handle account deletion', async () => {
    mockAuth.initialize.mockResolvedValue(undefined);
    mockAuth.deleteAccount.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useAppwriteAuth());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      await result.current.deleteAccount();
    });
    
    expect(mockAuth.deleteAccount).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});