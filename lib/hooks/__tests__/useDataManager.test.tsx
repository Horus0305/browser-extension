/**
 * Unit tests for useDataManager React hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDataManager } from '../useDataManager';
import { dataManager } from '../../storage/DataManager';
import { UsageData, UserSettings } from '../../types';

// Mock DataManager
jest.mock('../../storage/DataManager');

const mockDataManager = dataManager as jest.Mocked<typeof dataManager>;

describe('useDataManager', () => {
  const mockUsageData: UsageData = {
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

  const mockUserSettings: UserSettings = {
    isLoggedIn: true,
    syncEnabled: true,
    lastSyncTime: Date.now(),
    trackingEnabled: true,
    workModeEnabled: false,
    excludedDomains: ['example.com'],
    dataRetentionDays: 365
  };

  const mockStorageQuota = {
    used: 1024 * 1024,
    available: 9 * 1024 * 1024,
    percentage: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockDataManager.initialize.mockResolvedValue();
    mockDataManager.loadUsageData.mockResolvedValue(mockUsageData);
    mockDataManager.loadUserSettings.mockResolvedValue(mockUserSettings);
    mockDataManager.getStorageQuota.mockResolvedValue(mockStorageQuota);
    mockDataManager.saveUsageData.mockResolvedValue();
    mockDataManager.saveUserSettings.mockResolvedValue();
    mockDataManager.clearAllData.mockResolvedValue();
    mockDataManager.performDataCleanup.mockResolvedValue(5);
    mockDataManager.rotateEncryptionKey.mockResolvedValue();
    mockDataManager.isCleanupNeeded.mockResolvedValue(false);
  });

  describe('initialization', () => {
    it('should initialize on mount', async () => {
      const { result } = renderHook(() => useDataManager());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isInitialized).toBe(false);

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockDataManager.initialize).toHaveBeenCalled();
      expect(mockDataManager.loadUsageData).toHaveBeenCalled();
      expect(mockDataManager.loadUserSettings).toHaveBeenCalled();
      expect(mockDataManager.getStorageQuota).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockDataManager.initialize.mockRejectedValue(error);

      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.error).toBe('Initialization failed');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isInitialized).toBe(false);
      });
    });

    it('should prevent multiple simultaneous initializations', async () => {
      const { result } = renderHook(() => useDataManager());

      // Call initialize multiple times quickly
      act(() => {
        result.current.actions.initialize();
        result.current.actions.initialize();
        result.current.actions.initialize();
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Should only be called once (plus the auto-initialization)
      expect(mockDataManager.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('usage data operations', () => {
    it('should save usage data', async () => {
      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const newUsageData: UsageData = {
        ...mockUsageData,
        totalTime: 7200000
      };

      await act(async () => {
        await result.current.actions.saveUsageData(newUsageData);
      });

      expect(mockDataManager.saveUsageData).toHaveBeenCalledWith(newUsageData);
      expect(result.current.usageData).toEqual(newUsageData);
      expect(result.current.lastSyncTime).toBeGreaterThan(0);
    });

    it('should handle save errors', async () => {
      const error = new Error('Save failed');
      mockDataManager.saveUsageData.mockRejectedValue(error);

      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.actions.saveUsageData(mockUsageData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Save failed');
    });

    it('should load usage data', async () => {
      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let loadedData: UsageData;
      await act(async () => {
        loadedData = await result.current.actions.loadUsageData();
      });

      expect(mockDataManager.loadUsageData).toHaveBeenCalled();
      expect(loadedData!).toEqual(mockUsageData);
      expect(result.current.usageData).toEqual(mockUsageData);
    });
  });

  describe('user settings operations', () => {
    it('should save user settings', async () => {
      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const newSettings: UserSettings = {
        ...mockUserSettings,
        trackingEnabled: false
      };

      await act(async () => {
        await result.current.actions.saveUserSettings(newSettings);
      });

      expect(mockDataManager.saveUserSettings).toHaveBeenCalledWith(newSettings);
      expect(result.current.userSettings).toEqual(newSettings);
    });

    it('should load user settings', async () => {
      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let loadedSettings: UserSettings;
      await act(async () => {
        loadedSettings = await result.current.actions.loadUserSettings();
      });

      expect(mockDataManager.loadUserSettings).toHaveBeenCalled();
      expect(loadedSettings!).toEqual(mockUserSettings);
      expect(result.current.userSettings).toEqual(mockUserSettings);
    });
  });

  describe('data management operations', () => {
    it('should clear all data', async () => {
      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.actions.clearAllData();
      });

      expect(mockDataManager.clearAllData).toHaveBeenCalled();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.usageData).toBeNull();
      expect(result.current.userSettings).toBeNull();
    });

    it('should perform data cleanup', async () => {
      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let removedEntries: number;
      await act(async () => {
        removedEntries = await result.current.actions.performDataCleanup(365);
      });

      expect(mockDataManager.performDataCleanup).toHaveBeenCalledWith(365);
      expect(removedEntries!).toBe(5);
      expect(mockDataManager.loadUsageData).toHaveBeenCalled();
      expect(mockDataManager.getStorageQuota).toHaveBeenCalled();
    });

    it('should rotate encryption key', async () => {
      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.actions.rotateEncryptionKey();
      });

      expect(mockDataManager.rotateEncryptionKey).toHaveBeenCalled();
      expect(result.current.lastSyncTime).toBeGreaterThan(0);
    });
  });

  describe('storage monitoring', () => {
    it('should refresh storage quota', async () => {
      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.actions.refreshStorageQuota();
      });

      expect(mockDataManager.getStorageQuota).toHaveBeenCalled();
      expect(result.current.storageQuota).toEqual(mockStorageQuota);
    });

    it('should check if cleanup is needed', async () => {
      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let needsCleanup: boolean;
      await act(async () => {
        needsCleanup = await result.current.actions.checkCleanupNeeded();
      });

      expect(mockDataManager.isCleanupNeeded).toHaveBeenCalled();
      expect(needsCleanup!).toBe(false);
    });

    it('should periodically refresh storage quota', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Clear initial calls
      mockDataManager.getStorageQuota.mockClear();

      // Fast-forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockDataManager.getStorageQuota).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const error = new Error('Operation failed');
      mockDataManager.saveUsageData.mockRejectedValue(error);

      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.actions.saveUsageData(mockUsageData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Operation failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear errors on successful operations', async () => {
      // First, cause an error
      const error = new Error('Operation failed');
      mockDataManager.saveUsageData.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useDataManager());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Cause error
      await act(async () => {
        try {
          await result.current.actions.saveUsageData(mockUsageData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Operation failed');

      // Now succeed
      mockDataManager.saveUsageData.mockResolvedValue();
      await act(async () => {
        await result.current.actions.saveUsageData(mockUsageData);
      });

      expect(result.current.error).toBeNull();
    });
  });
});