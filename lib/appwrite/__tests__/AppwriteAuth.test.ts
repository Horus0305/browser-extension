/**
 * Integration tests for AppwriteAuth
 */

import { AppwriteAuth } from '../AppwriteAuth';
import { generateMasterKey } from '../../encryption';

// Mock browser storage
const mockStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
};

// Mock Appwrite SDK
const mockAccount = {
  create: jest.fn(),
  createEmailPasswordSession: jest.fn(),
  get: jest.fn(),
  getSession: jest.fn(),
  deleteSession: jest.fn(),
  listSessions: jest.fn(),
  updatePassword: jest.fn(),
  createRecovery: jest.fn(),
  updateRecovery: jest.fn(),
  createVerification: jest.fn(),
  updateVerification: jest.fn()
};

jest.mock('appwrite', () => ({
  Client: jest.fn().mockImplementation(() => ({
    setEndpoint: jest.fn().mockReturnThis(),
    setProject: jest.fn().mockReturnThis()
  })),
  Account: jest.fn().mockImplementation(() => mockAccount),
  ID: {
    unique: jest.fn(() => 'mock-id')
  }
}));

// Mock the client module
jest.mock('../client', () => ({
  account: mockAccount
}));

// Mock global browser object
(global as any).browser = mockStorage;

describe('AppwriteAuth', () => {
  let auth: AppwriteAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset storage mocks
    mockStorage.local.get.mockResolvedValue({});
    mockStorage.local.set.mockResolvedValue(undefined);
    mockStorage.local.remove.mockResolvedValue(undefined);
    
    auth = new AppwriteAuth();
  });

  describe('initialization', () => {
    it('should initialize without active session', async () => {
      mockAccount.getSession.mockRejectedValue(new Error('No session'));
      
      await auth.initialize();
      
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getCurrentUser()).toBeNull();
    });

    it('should restore active session', async () => {
      const mockSession = {
        $id: 'session-id',
        userId: 'user-id',
        expire: '2024-12-31T23:59:59.000Z',
        provider: 'email'
      };
      
      const mockUser = {
        $id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        emailVerification: true
      };

      mockAccount.getSession.mockResolvedValue(mockSession);
      mockAccount.get.mockResolvedValue(mockUser);
      mockStorage.local.get.mockResolvedValue({ 'masterKey_user-id': 'mock-key' });
      
      await auth.initialize();
      
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.getCurrentUser()).toEqual(mockUser);
      expect(auth.getMasterKey()).toBe('mock-key');
    });
  });

  describe('sign up', () => {
    it('should create new user account', async () => {
      const mockUser = {
        $id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        emailVerification: false
      };
      
      const mockSession = {
        $id: 'session-id',
        userId: 'user-id',
        expire: '2024-12-31T23:59:59.000Z',
        provider: 'email'
      };

      mockAccount.create.mockResolvedValue(mockUser);
      mockAccount.createEmailPasswordSession.mockResolvedValue(mockSession);
      
      const result = await auth.signUp('test@example.com', 'password123', 'Test User');
      
      expect(mockAccount.create).toHaveBeenCalledWith(
        'mock-id',
        'test@example.com',
        'password123',
        'Test User'
      );
      expect(mockAccount.createEmailPasswordSession).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUser);
      expect(auth.isAuthenticated()).toBe(true);
      expect(mockStorage.local.set).toHaveBeenCalled();
    });

    it('should handle sign up errors', async () => {
      mockAccount.create.mockRejectedValue(new Error('Email already exists'));
      
      await expect(auth.signUp('test@example.com', 'password123', 'Test User'))
        .rejects.toThrow('Failed to create account');
    });
  });

  describe('sign in', () => {
    it('should authenticate existing user', async () => {
      const mockSession = {
        $id: 'session-id',
        userId: 'user-id',
        expire: '2024-12-31T23:59:59.000Z',
        provider: 'email'
      };
      
      const mockUser = {
        $id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        emailVerification: true
      };

      mockAccount.createEmailPasswordSession.mockResolvedValue(mockSession);
      mockAccount.get.mockResolvedValue(mockUser);
      mockStorage.local.get.mockResolvedValue({ 'masterKey_user-id': 'existing-key' });
      
      const result = await auth.signIn('test@example.com', 'password123');
      
      expect(mockAccount.createEmailPasswordSession).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUser);
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.getMasterKey()).toBe('existing-key');
    });

    it('should handle invalid credentials', async () => {
      mockAccount.createEmailPasswordSession.mockRejectedValue(new Error('Invalid credentials'));
      
      await expect(auth.signIn('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid email or password');
    });
  });

  describe('sign out', () => {
    it('should sign out authenticated user', async () => {
      // Set up authenticated state
      (auth as any).currentUser = { $id: 'user-id' };
      (auth as any).currentSession = { $id: 'session-id' };
      (auth as any).masterKey = 'test-key';
      
      mockAccount.deleteSession.mockResolvedValue(undefined);
      
      await auth.signOut();
      
      expect(mockAccount.deleteSession).toHaveBeenCalledWith('session-id');
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getCurrentUser()).toBeNull();
      expect(auth.getMasterKey()).toBeNull();
      expect(mockStorage.local.remove).toHaveBeenCalled();
    });
  });

  describe('master key management', () => {
    it('should generate master key for new user', async () => {
      const mockUser = {
        $id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        emailVerification: false
      };
      
      const mockSession = {
        $id: 'session-id',
        userId: 'user-id',
        expire: '2024-12-31T23:59:59.000Z',
        provider: 'email'
      };

      mockAccount.create.mockResolvedValue(mockUser);
      mockAccount.createEmailPasswordSession.mockResolvedValue(mockSession);
      
      await auth.signUp('test@example.com', 'password123', 'Test User');
      
      expect(auth.getMasterKey()).toBeTruthy();
      expect(mockStorage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'masterKey_user-id': expect.any(String)
        })
      );
    });

    it('should restore existing master key', async () => {
      const existingKey = 'existing-master-key';
      mockStorage.local.get.mockResolvedValue({ 'masterKey_user-id': existingKey });
      
      (auth as any).currentUser = { $id: 'user-id' };
      await (auth as any).restoreMasterKey();
      
      expect(auth.getMasterKey()).toBe(existingKey);
    });
  });

  describe('session management', () => {
    it('should refresh valid session', async () => {
      const mockSession = {
        $id: 'session-id',
        userId: 'user-id',
        expire: '2024-12-31T23:59:59.000Z',
        provider: 'email'
      };
      
      const mockUser = {
        $id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        emailVerification: true
      };

      (auth as any).currentSession = mockSession;
      mockAccount.getSession.mockResolvedValue(mockSession);
      mockAccount.get.mockResolvedValue(mockUser);
      
      await auth.refreshSession();
      
      expect(auth.getCurrentUser()).toEqual(mockUser);
      expect(auth.getCurrentSession()).toEqual(mockSession);
    });

    it('should handle expired session', async () => {
      (auth as any).currentSession = { $id: 'session-id' };
      (auth as any).currentUser = { $id: 'user-id' };
      (auth as any).masterKey = 'test-key';
      
      mockAccount.getSession.mockRejectedValue(new Error('Session expired'));
      
      await expect(auth.refreshSession()).rejects.toThrow('Session expired, please log in again');
      
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getCurrentUser()).toBeNull();
      expect(auth.getMasterKey()).toBeNull();
    });
  });

  describe('account deletion', () => {
    it('should delete user account and clear data', async () => {
      (auth as any).currentUser = { $id: 'user-id' };
      (auth as any).currentSession = { $id: 'session-id' };
      (auth as any).masterKey = 'test-key';
      
      mockAccount.listSessions.mockResolvedValue({ 
        sessions: [{ $id: 'session-id' }] 
      });
      mockAccount.deleteSession.mockResolvedValue(undefined);
      
      await auth.deleteAccount();
      
      expect(mockAccount.listSessions).toHaveBeenCalled();
      expect(mockAccount.deleteSession).toHaveBeenCalledWith('session-id');
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getCurrentUser()).toBeNull();
      expect(auth.getMasterKey()).toBeNull();
      expect(mockStorage.local.remove).toHaveBeenCalled();
    });
  });
});