/**
 * Integration tests for AppwriteDatabase
 */

import { AppwriteDatabase } from '../AppwriteDatabase';
import { UsageData } from '../../types';
import { encryptData, decryptData, createDataHash } from '../../encryption';

// Mock Appwrite SDK
const mockDatabases = {
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  listDocuments: jest.fn()
};

jest.mock('appwrite', () => ({
  Client: jest.fn().mockImplementation(() => ({
    setEndpoint: jest.fn().mockReturnThis(),
    setProject: jest.fn().mockReturnThis()
  })),
  Databases: jest.fn().mockImplementation(() => mockDatabases),
  ID: {
    unique: jest.fn(() => 'mock-id')
  },
  Query: {
    equal: jest.fn((field, value) => `equal(${field}, ${value})`),
    orderDesc: jest.fn((field) => `orderDesc(${field})`),
    limit: jest.fn((count) => `limit(${count})`)
  }
}));

// Mock the client module
jest.mock('../client', () => ({
  databases: mockDatabases,
  appwriteConfig: {
    databaseId: 'test-database',
    collectionId: 'test-collection'
  }
}));

// Mock AppwriteAuth
const mockAuth = {
  isAuthenticated: jest.fn(() => true),
  getCurrentUser: jest.fn(() => ({ $id: 'user-id', email: 'test@example.com' })),
  getMasterKey: jest.fn(() => 'test-master-key')
};

jest.mock('../AppwriteAuth', () => ({
  appwriteAuth: mockAuth
}));

// Mock browser storage
const mockStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
};

(global as any).browser = mockStorage;
(global as any).localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

// Mock navigator
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true
});

describe('AppwriteDatabase', () => {
  let database: AppwriteDatabase;
  let mockUsageData: UsageData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset storage mocks
    mockStorage.local.get.mockResolvedValue({});
    mockStorage.local.set.mockResolvedValue(undefined);
    
    // Reset localStorage mocks
    (global.localStorage.getItem as jest.Mock).mockReturnValue(null);
    (global.localStorage.setItem as jest.Mock).mockImplementation(() => {});
    
    database = new AppwriteDatabase();
    
    mockUsageData = {
      totalTime: 3600000, // 1 hour
      websites: {
        'example.com': {
          domain: 'example.com',
          timeSpent: 1800000, // 30 minutes
          lastVisited: new Date('2024-01-01T12:00:00Z'),
          visitCount: 5,
          favicon: 'https://example.com/favicon.ico'
        }
      },
      dailyStats: {
        '2024-01-01': {
          date: '2024-01-01',
          totalTime: 3600000,
          websites: new Map([
            ['example.com', {
              domain: 'example.com',
              timeSpent: 1800000,
              lastVisited: new Date('2024-01-01T12:00:00Z'),
              visitCount: 5
            }]
          ]),
          sessionCount: 2
        }
      }
    };
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockStorage.local.get.mockResolvedValue({ syncQueue: [] });
      
      await database.initialize();
      
      expect(mockStorage.local.get).toHaveBeenCalledWith('syncQueue');
    });

    it('should restore sync queue from storage', async () => {
      const mockQueue = [
        {
          id: 'item-1',
          data: mockUsageData,
          timestamp: Date.now(),
          retryCount: 0
        }
      ];
      
      mockStorage.local.get.mockResolvedValue({ syncQueue: mockQueue });
      
      await database.initialize();
      
      const status = database.getSyncStatus();
      expect(status.pendingChanges).toBe(1);
    });
  });

  describe('cloud sync', () => {
    it('should sync data to cloud successfully', async () => {
      mockDatabases.listDocuments.mockResolvedValue({ documents: [] });
      mockDatabases.createDocument.mockResolvedValue({ $id: 'doc-id' });
      
      await database.syncToCloud(mockUsageData);
      
      expect(mockDatabases.createDocument).toHaveBeenCalledWith(
        'usage-tracker',
        'usage-data',
        'mock-id',
        expect.objectContaining({
          userId: 'user-id',
          encryptedData: expect.any(String),
          dataHash: expect.any(String),
          deviceId: expect.any(String),
          lastUpdated: expect.any(String),
          version: '1.0.0'
        })
      );
    });

    it('should update existing document', async () => {
      const existingDoc = {
        $id: 'existing-doc-id',
        userId: 'user-id',
        deviceId: 'device-id'
      };
      
      mockDatabases.listDocuments.mockResolvedValue({ documents: [existingDoc] });
      mockDatabases.updateDocument.mockResolvedValue(existingDoc);
      
      await database.syncToCloud(mockUsageData);
      
      expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
        'usage-tracker',
        'usage-data',
        'existing-doc-id',
        expect.objectContaining({
          userId: 'user-id',
          encryptedData: expect.any(String),
          dataHash: expect.any(String)
        })
      );
    });

    it('should add to sync queue when offline', async () => {
      // Simulate offline state
      Object.defineProperty(global.navigator, 'onLine', { value: false });
      database = new AppwriteDatabase();
      
      await database.syncToCloud(mockUsageData);
      
      const status = database.getSyncStatus();
      expect(status.pendingChanges).toBe(1);
      expect(mockStorage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          syncQueue: expect.arrayContaining([
            expect.objectContaining({
              data: mockUsageData,
              retryCount: 0
            })
          ])
        })
      );
    });

    it('should handle sync errors gracefully', async () => {
      mockDatabases.listDocuments.mockRejectedValue(new Error('Network error'));
      
      await expect(database.syncToCloud(mockUsageData)).rejects.toThrow('Failed to sync data to cloud');
      
      // Should add to sync queue for retry
      const status = database.getSyncStatus();
      expect(status.pendingChanges).toBe(1);
    });
  });

  describe('load from cloud', () => {
    it('should load and decrypt data from cloud', async () => {
      const masterKey = 'test-master-key';
      const encryptedData = encryptData(mockUsageData, masterKey);
      const dataHash = createDataHash(mockUsageData);
      
      const cloudDoc = {
        $id: 'doc-id',
        userId: 'user-id',
        encryptedData,
        dataHash,
        deviceId: 'device-id',
        lastUpdated: '2024-01-01T12:00:00Z'
      };
      
      mockDatabases.listDocuments.mockResolvedValue({ documents: [cloudDoc] });
      
      const result = await database.loadFromCloud();
      
      expect(result).toEqual(mockUsageData);
      expect(mockDatabases.listDocuments).toHaveBeenCalledWith(
        'usage-tracker',
        'usage-data',
        expect.arrayContaining([
          'equal(userId, user-id)',
          'orderDesc(lastUpdated)',
          'limit(100)'
        ])
      );
    });

    it('should return null when no data exists', async () => {
      mockDatabases.listDocuments.mockResolvedValue({ documents: [] });
      
      const result = await database.loadFromCloud();
      
      expect(result).toBeNull();
    });

    it('should merge data from multiple devices', async () => {
      const masterKey = 'test-master-key';
      
      const device1Data: UsageData = {
        totalTime: 1800000,
        websites: {
          'example.com': {
            domain: 'example.com',
            timeSpent: 900000,
            lastVisited: new Date('2024-01-01T10:00:00Z'),
            visitCount: 3
          }
        },
        dailyStats: {}
      };
      
      const device2Data: UsageData = {
        totalTime: 3600000,
        websites: {
          'example.com': {
            domain: 'example.com',
            timeSpent: 1800000,
            lastVisited: new Date('2024-01-01T12:00:00Z'),
            visitCount: 5
          },
          'test.com': {
            domain: 'test.com',
            timeSpent: 600000,
            lastVisited: new Date('2024-01-01T11:00:00Z'),
            visitCount: 2
          }
        },
        dailyStats: {}
      };
      
      const cloudDocs = [
        {
          $id: 'doc-1',
          userId: 'user-id',
          encryptedData: encryptData(device1Data, masterKey),
          dataHash: createDataHash(device1Data),
          deviceId: 'device-1',
          lastUpdated: '2024-01-01T10:00:00Z'
        },
        {
          $id: 'doc-2',
          userId: 'user-id',
          encryptedData: encryptData(device2Data, masterKey),
          dataHash: createDataHash(device2Data),
          deviceId: 'device-2',
          lastUpdated: '2024-01-01T12:00:00Z'
        }
      ];
      
      mockDatabases.listDocuments.mockResolvedValue({ documents: cloudDocs });
      
      const result = await database.loadFromCloud();
      
      expect(result).toBeDefined();
      expect(result!.totalTime).toBe(3600000); // Max of both devices
      expect(result!.websites['example.com'].timeSpent).toBe(2700000); // Sum of both
      expect(result!.websites['example.com'].visitCount).toBe(8); // Sum of both
      expect(result!.websites['test.com']).toBeDefined();
    });

    it('should skip corrupted documents', async () => {
      const masterKey = 'test-master-key';
      const validData = encryptData(mockUsageData, masterKey);
      const validHash = createDataHash(mockUsageData);
      
      const cloudDocs = [
        {
          $id: 'doc-1',
          userId: 'user-id',
          encryptedData: 'corrupted-data',
          dataHash: 'invalid-hash',
          deviceId: 'device-1',
          lastUpdated: '2024-01-01T10:00:00Z'
        },
        {
          $id: 'doc-2',
          userId: 'user-id',
          encryptedData: validData,
          dataHash: validHash,
          deviceId: 'device-2',
          lastUpdated: '2024-01-01T12:00:00Z'
        }
      ];
      
      mockDatabases.listDocuments.mockResolvedValue({ documents: cloudDocs });
      
      const result = await database.loadFromCloud();
      
      expect(result).toEqual(mockUsageData);
    });
  });

  describe('delete cloud data', () => {
    it('should delete all user documents', async () => {
      const cloudDocs = [
        { $id: 'doc-1', userId: 'user-id' },
        { $id: 'doc-2', userId: 'user-id' }
      ];
      
      mockDatabases.listDocuments.mockResolvedValue({ documents: cloudDocs });
      mockDatabases.deleteDocument.mockResolvedValue(undefined);
      
      await database.deleteCloudData();
      
      expect(mockDatabases.deleteDocument).toHaveBeenCalledTimes(2);
      expect(mockDatabases.deleteDocument).toHaveBeenCalledWith('usage-tracker', 'usage-data', 'doc-1');
      expect(mockDatabases.deleteDocument).toHaveBeenCalledWith('usage-tracker', 'usage-data', 'doc-2');
    });
  });

  describe('sync queue management', () => {
    it('should process sync queue when online', async () => {
      const queueItem = {
        id: 'item-1',
        data: mockUsageData,
        timestamp: Date.now(),
        retryCount: 0
      };
      
      // Set up queue
      (database as any).syncQueue = [queueItem];
      
      mockDatabases.listDocuments.mockResolvedValue({ documents: [] });
      mockDatabases.createDocument.mockResolvedValue({ $id: 'doc-id' });
      
      await database.forcSync();
      
      expect(mockDatabases.createDocument).toHaveBeenCalled();
      
      const status = database.getSyncStatus();
      expect(status.pendingChanges).toBe(0);
    });

    it('should retry failed sync operations', async () => {
      const queueItem = {
        id: 'item-1',
        data: mockUsageData,
        timestamp: Date.now(),
        retryCount: 1
      };
      
      (database as any).syncQueue = [queueItem];
      
      mockDatabases.listDocuments.mockRejectedValue(new Error('Network error'));
      
      await database.forcSync();
      
      const status = database.getSyncStatus();
      expect(status.pendingChanges).toBe(1); // Should still be in queue for retry
      
      // Check retry count increased
      const updatedQueue = (database as any).syncQueue;
      expect(updatedQueue[0].retryCount).toBe(2);
    });

    it('should drop items after max retries', async () => {
      const queueItem = {
        id: 'item-1',
        data: mockUsageData,
        timestamp: Date.now(),
        retryCount: 3 // Already at max retries
      };
      
      (database as any).syncQueue = [queueItem];
      
      mockDatabases.listDocuments.mockRejectedValue(new Error('Network error'));
      
      await database.forcSync();
      
      const status = database.getSyncStatus();
      expect(status.pendingChanges).toBe(0); // Should be dropped
    });
  });

  describe('authentication requirements', () => {
    it('should throw error when not authenticated', async () => {
      mockAuth.isAuthenticated.mockReturnValue(false);
      
      await expect(database.syncToCloud(mockUsageData)).rejects.toThrow('User must be authenticated to sync data');
      await expect(database.loadFromCloud()).rejects.toThrow('User must be authenticated to load data');
      await expect(database.deleteCloudData()).rejects.toThrow('User must be authenticated to delete data');
    });

    it('should throw error when master key not available', async () => {
      (mockAuth.getMasterKey as jest.Mock).mockReturnValue(null);
      
      await expect(database.syncToCloud(mockUsageData)).rejects.toThrow('Master encryption key not available');
      await expect(database.loadFromCloud()).rejects.toThrow('Master encryption key not available');
    });
  });
});