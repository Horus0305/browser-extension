/**
 * Unit tests for DataManager class
 */

import { DataManager } from '../DataManager';
import { UsageData, UserSettings } from '../../types';
import * as encryption from '../../encryption';
import * as browserCompat from '../../browser-compat';

// Mock dependencies
jest.mock('../../encryption');
jest.mock('../../browser-compat');

const mockEncryption = encryption as jest.Mocked<typeof encryption>;
const mockBrowserCompat = browserCompat as jest.Mocked<typeof browserCompat>;

describe('DataManager', () => {
  let dataManager: DataManager;
  let mockStorageData: Record<string, any>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockStorageData = {};
    
    // Mock browser storage
    mockBrowserCompat.getStorageData.mockImplementation(async (keys: string[]) => {
      const result: Record<string, any> = {};
      keys.forEach(key => {
        if (mockStorageData[key] !== undefined) {
          result[key] = mockStorageData[key];
        }
      });
      return result;
    });

    mockBrowserCompat.setStorageData.mockImplementation(async (data: Record<string, any>) => {
      Object.assign(mockStorageData, data);
    });

    // Mock global browser API
    (globalThis as any).browser = {
      storage: {
        local: {
          remove: jest.fn().mockResolvedValue(undefined),
          getBytesInUse: jest.fn().mockResolvedValue(1024 * 1024) // 1MB
        }
      }
    };

    // Mock encryption functions
    mockEncryption.generateSalt.mockReturnValue('mock-salt');
    mockEncryption.generateMasterKey.mockReturnValue('mock-master-key');
    mockEncryption.encryptData.mockReturnValue('encrypted-data');
    mockEncryption.decryptData.mockReturnValue({
      totalTime: 0,
      websites: {},
      dailyStats: {}
    });
    mockEncryption.createDataHash.mockReturnValue('mock-hash');
    mockEncryption.verifyDataIntegrity.mockReturnValue(true);

    // Get fresh instance
    dataManager = DataManager.getInstance();
  });

  describe('initialization', () => {
    it('should initialize with new encryption for first-time setup', async () => {
      await dataManager.initialize();

      expect(mockBrowserCompat.setStorageData).toHaveBeenCalledWith({
        encryption_salt: 'mock-salt',
        data_version: '1.0.0'
      });
      expect(mockEncryption.generateSalt).toHaveBeenCalled();
      expect(mockEncryption.generateMasterKey).toHaveBeenCalled();
    });

    it('should load existing encryption setup', async () => {
      mockStorageData.encryption_salt = 'existing-salt';

      await dataManager.initialize();

      expect(mockEncryption.generateMasterKey).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockBrowserCompat.getStorageData.mockRejectedValue(new Error('Storage error'));

      await expect(dataManager.initialize()).rejects.toThrow('DataManager initialization failed');
    });
  });

  describe('usage data operations', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should save usage data with encryption', async () => {
      const usageData: UsageData = {
        totalTime: 3600000,
        websites: {
          'example.com': {
            domain: 'example.com',
            timeSpent: 1800000,
            lastVisited: new Date(),
            visitCount: 5
          }
        },
        dailyStats: {}
      };

      await dataManager.saveUsageData(usageData);

      expect(mockEncryption.createDataHash).toHaveBeenCalledWith(usageData);
      expect(mockEncryption.encryptData).toHaveBeenCalledWith(usageData, 'mock-master-key');
      expect(mockBrowserCompat.setStorageData).toHaveBeenCalledWith({
        encrypted_usage_data: 'encrypted-data',
        data_integrity_hash: 'mock-hash',
        data_version: '1.0.0'
      });
    });

    it('should load and decrypt usage data', async () => {
      mockStorageData.encrypted_usage_data = 'encrypted-data';
      mockStorageData.data_integrity_hash = 'mock-hash';

      const result = await dataManager.loadUsageData();

      expect(mockEncryption.decryptData).toHaveBeenCalledWith('encrypted-data', 'mock-master-key');
      expect(mockEncryption.verifyDataIntegrity).toHaveBeenCalled();
      expect(result).toEqual({
        totalTime: 0,
        websites: {},
        dailyStats: {}
      });
    });

    it('should return empty data when no stored data exists', async () => {
      const result = await dataManager.loadUsageData();

      expect(result).toEqual({
        totalTime: 0,
        websites: {},
        dailyStats: {}
      });
    });

    it('should handle decryption errors gracefully', async () => {
      mockStorageData.encrypted_usage_data = 'corrupted-data';
      mockEncryption.decryptData.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const result = await dataManager.loadUsageData();

      expect(result).toEqual({
        totalTime: 0,
        websites: {},
        dailyStats: {}
      });
    });

    it('should throw error when not initialized', async () => {
      // Create a fresh instance by clearing the singleton
      (DataManager as any).instance = null;
      const uninitializedManager = DataManager.getInstance();
      const usageData: UsageData = { totalTime: 0, websites: {}, dailyStats: {} };

      await expect(uninitializedManager.saveUsageData(usageData))
        .rejects.toThrow('DataManager not initialized');
    });
  });

  describe('user settings operations', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should save user settings', async () => {
      const settings: UserSettings = {
        isLoggedIn: true,
        syncEnabled: true,
        lastSyncTime: Date.now(),
        trackingEnabled: true,
        workModeEnabled: false,
        excludedDomains: ['example.com'],
        dataRetentionDays: 365
      };

      await dataManager.saveUserSettings(settings);

      expect(mockBrowserCompat.setStorageData).toHaveBeenCalledWith({
        user_settings: settings
      });
    });

    it('should load user settings', async () => {
      const settings: UserSettings = {
        isLoggedIn: true,
        syncEnabled: true,
        lastSyncTime: Date.now(),
        trackingEnabled: true,
        workModeEnabled: false,
        excludedDomains: ['example.com'],
        dataRetentionDays: 365
      };
      mockStorageData.user_settings = settings;

      const result = await dataManager.loadUserSettings();

      expect(result).toEqual(settings);
    });

    it('should return default settings when none exist', async () => {
      const result = await dataManager.loadUserSettings();

      expect(result).toEqual({
        isLoggedIn: false,
        syncEnabled: false,
        lastSyncTime: 0,
        trackingEnabled: true,
        workModeEnabled: false,
        excludedDomains: [],
        dataRetentionDays: 730
      });
    });
  });

  describe('data cleanup operations', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should perform data cleanup based on retention policy', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 800); // 800 days ago

      const usageData: UsageData = {
        totalTime: 7200000,
        websites: {
          'old-site.com': {
            domain: 'old-site.com',
            timeSpent: 1800000,
            lastVisited: oldDate,
            visitCount: 5
          },
          'recent-site.com': {
            domain: 'recent-site.com',
            timeSpent: 1800000,
            lastVisited: new Date(),
            visitCount: 3
          }
        },
        dailyStats: {
          '2022-01-01': {
            date: '2022-01-01',
            totalTime: 3600000,
            websites: new Map(),
            sessionCount: 1
          },
          [new Date().toISOString().split('T')[0]]: {
            date: new Date().toISOString().split('T')[0],
            totalTime: 3600000,
            websites: new Map(),
            sessionCount: 1
          }
        }
      };

      // Mock the loadUsageData to return our test data
      mockEncryption.decryptData.mockReturnValue(usageData);
      mockBrowserCompat.getStorageData.mockResolvedValue({
        encrypted_usage_data: 'encrypted-data'
      });

      const removedEntries = await dataManager.performDataCleanup(730);

      expect(removedEntries).toBe(2); // Should remove old website and old daily stat
      expect(mockEncryption.encryptData).toHaveBeenCalled();
    });

    it('should clear all data', async () => {
      await dataManager.clearAllData();

      expect((globalThis as any).browser.storage.local.remove).toHaveBeenCalledWith([
        'encrypted_usage_data',
        'user_settings',
        'encryption_salt',
        'data_version',
        'data_integrity_hash'
      ]);
    });
  });

  describe('storage quota operations', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should get storage quota information', async () => {
      const quota = await dataManager.getStorageQuota();

      expect(quota).toEqual({
        used: 1024 * 1024,
        available: 9 * 1024 * 1024,
        percentage: 10
      });
    });

    it('should check if cleanup is needed', async () => {
      // Mock high usage
      (globalThis as any).browser.storage.local.getBytesInUse.mockResolvedValue(9 * 1024 * 1024);

      const needsCleanup = await dataManager.isCleanupNeeded();

      expect(needsCleanup).toBe(true);
    });
  });

  describe('encryption key rotation', () => {
    beforeEach(async () => {
      await dataManager.initialize();
    });

    it('should rotate encryption key', async () => {
      const usageData: UsageData = { totalTime: 0, websites: {}, dailyStats: {} };
      mockEncryption.decryptData.mockReturnValue(usageData);
      mockEncryption.generateSalt.mockReturnValue('new-salt');
      mockEncryption.generateMasterKey.mockReturnValue('new-master-key');

      await dataManager.rotateEncryptionKey();

      expect(mockEncryption.generateSalt).toHaveBeenCalledTimes(2); // Once for init, once for rotation
      expect(mockEncryption.generateMasterKey).toHaveBeenCalledTimes(2);
      expect(mockBrowserCompat.setStorageData).toHaveBeenCalledWith({
        encryption_salt: 'new-salt'
      });
    });
  });

  describe('data migration', () => {
    it('should handle version migrations', async () => {
      mockStorageData.data_version = '0.9.0';
      mockStorageData.encryption_salt = 'existing-salt';

      await dataManager.initialize();

      // Should call setStorageData for version update
      expect(mockBrowserCompat.setStorageData).toHaveBeenCalledWith(
        expect.objectContaining({
          data_version: '1.0.0'
        })
      );
    });

    it('should skip migration for current version', async () => {
      mockStorageData.data_version = '1.0.0';
      mockStorageData.encryption_salt = 'existing-salt';

      // Clear previous calls
      mockBrowserCompat.setStorageData.mockClear();

      await dataManager.initialize();

      // Should not perform version update since version is current
      const setStorageCalls = mockBrowserCompat.setStorageData.mock.calls;
      const versionUpdateCalls = setStorageCalls.filter(call => 
        call[0] && call[0].data_version === '1.0.0'
      );
      expect(versionUpdateCalls.length).toBe(0);
    });
  });
});