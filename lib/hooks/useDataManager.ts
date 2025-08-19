/**
 * React hook for DataManager operations and real-time data updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dataManager, StorageQuota, MigrationResult } from '../storage/DataManager';
import { UsageData, UserSettings } from '../types';

export interface DataManagerState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  usageData: UsageData | null;
  userSettings: UserSettings | null;
  storageQuota: StorageQuota | null;
  lastSyncTime: number;
}

export interface DataManagerActions {
  initialize: () => Promise<void>;
  saveUsageData: (data: UsageData) => Promise<void>;
  loadUsageData: () => Promise<UsageData>;
  saveUserSettings: (settings: UserSettings) => Promise<void>;
  loadUserSettings: () => Promise<UserSettings>;
  clearAllData: () => Promise<void>;
  performDataCleanup: (retentionDays?: number) => Promise<number>;
  rotateEncryptionKey: () => Promise<void>;
  refreshStorageQuota: () => Promise<void>;
  checkCleanupNeeded: () => Promise<boolean>;
}

export function useDataManager() {
  const [state, setState] = useState<DataManagerState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    usageData: null,
    userSettings: null,
    storageQuota: null,
    lastSyncTime: 0
  });

  const initializationRef = useRef<Promise<void> | null>(null);

  // Initialize DataManager
  const initialize = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (initializationRef.current) {
      return initializationRef.current;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const initPromise = (async () => {
      try {
        await dataManager.initialize();
        
        // Load initial data
        const [usageData, userSettings, storageQuota] = await Promise.all([
          dataManager.loadUsageData(),
          dataManager.loadUserSettings(),
          dataManager.getStorageQuota()
        ]);

        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          usageData,
          userSettings,
          storageQuota,
          lastSyncTime: Date.now()
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
        throw error;
      }
    })();

    initializationRef.current = initPromise;
    return initPromise;
  }, []);

  // Save usage data
  const saveUsageData = useCallback(async (data: UsageData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await dataManager.saveUsageData(data);
      setState(prev => ({
        ...prev,
        isLoading: false,
        usageData: data,
        lastSyncTime: Date.now()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save data';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Load usage data
  const loadUsageData = useCallback(async (): Promise<UsageData> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const data = await dataManager.loadUsageData();
      setState(prev => ({
        ...prev,
        isLoading: false,
        usageData: data,
        lastSyncTime: Date.now()
      }));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Save user settings
  const saveUserSettings = useCallback(async (settings: UserSettings) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await dataManager.saveUserSettings(settings);
      setState(prev => ({
        ...prev,
        isLoading: false,
        userSettings: settings
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Load user settings
  const loadUserSettings = useCallback(async (): Promise<UserSettings> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const settings = await dataManager.loadUserSettings();
      setState(prev => ({
        ...prev,
        isLoading: false,
        userSettings: settings
      }));
      return settings;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Clear all data
  const clearAllData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await dataManager.clearAllData();
      setState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: false,
        usageData: null,
        userSettings: null,
        storageQuota: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear data';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Perform data cleanup
  const performDataCleanup = useCallback(async (retentionDays?: number): Promise<number> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const removedEntries = await dataManager.performDataCleanup(retentionDays);
      
      // Refresh data after cleanup
      const [usageData, storageQuota] = await Promise.all([
        dataManager.loadUsageData(),
        dataManager.getStorageQuota()
      ]);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        usageData,
        storageQuota,
        lastSyncTime: Date.now()
      }));
      
      return removedEntries;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup data';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Rotate encryption key
  const rotateEncryptionKey = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await dataManager.rotateEncryptionKey();
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime: Date.now()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rotate encryption key';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // Refresh storage quota
  const refreshStorageQuota = useCallback(async () => {
    try {
      const storageQuota = await dataManager.getStorageQuota();
      setState(prev => ({
        ...prev,
        storageQuota
      }));
    } catch (error) {
      console.error('Failed to refresh storage quota:', error);
    }
  }, []);

  // Check if cleanup is needed
  const checkCleanupNeeded = useCallback(async (): Promise<boolean> => {
    try {
      return await dataManager.isCleanupNeeded();
    } catch (error) {
      console.error('Failed to check cleanup status:', error);
      return false;
    }
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    initialize().catch(error => {
      console.error('Auto-initialization failed:', error);
    });
  }, [initialize]);

  // Periodic storage quota refresh
  useEffect(() => {
    if (!state.isInitialized) return;

    const interval = setInterval(() => {
      refreshStorageQuota();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [state.isInitialized, refreshStorageQuota]);

  // Auto-cleanup check
  useEffect(() => {
    if (!state.isInitialized || !state.userSettings) return;

    const checkAndCleanup = async () => {
      try {
        const needsCleanup = await checkCleanupNeeded();
        if (needsCleanup) {
          console.log('Storage cleanup needed, performing automatic cleanup');
          await performDataCleanup(state.userSettings!.dataRetentionDays);
        }
      } catch (error) {
        console.error('Auto-cleanup failed:', error);
      }
    };

    // Check on initialization and then periodically
    checkAndCleanup();
    const interval = setInterval(checkAndCleanup, 24 * 60 * 60 * 1000); // Daily check

    return () => clearInterval(interval);
  }, [state.isInitialized, state.userSettings, checkCleanupNeeded, performDataCleanup]);

  const actions: DataManagerActions = {
    initialize,
    saveUsageData,
    loadUsageData,
    saveUserSettings,
    loadUserSettings,
    clearAllData,
    performDataCleanup,
    rotateEncryptionKey,
    refreshStorageQuota,
    checkCleanupNeeded
  };

  return {
    ...state,
    actions
  };
}