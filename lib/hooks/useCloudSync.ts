/**
 * React hooks for Appwrite cloud sync operations
 */

import { useState, useEffect, useCallback } from 'react';
import { appwriteDatabase } from '../appwrite/AppwriteDatabase';
import { UsageData, SyncStatus } from '../types';
import { useAppwriteAuth } from './useAppwriteAuth';

export interface CloudSyncState {
  syncStatus: SyncStatus;
  isLoading: boolean;
  error: string | null;
}

export interface CloudSyncActions {
  syncToCloud: (data: UsageData) => Promise<void>;
  loadFromCloud: () => Promise<UsageData | null>;
  deleteCloudData: () => Promise<void>;
  forceSync: () => Promise<void>;
  clearError: () => void;
}

/**
 * Main cloud sync hook
 */
export function useCloudSync(): CloudSyncState & CloudSyncActions {
  const { isAuthenticated } = useAppwriteAuth();
  const [state, setState] = useState<CloudSyncState>({
    syncStatus: {
      isOnline: navigator.onLine,
      lastSyncTime: 0,
      syncInProgress: false,
      pendingChanges: 0
    },
    isLoading: false,
    error: null
  });

  // Initialize database and update sync status
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await appwriteDatabase.initialize();
        updateSyncStatus();
      } catch (error) {
        console.error('Database initialization failed:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Database initialization failed'
        }));
      }
    };

    if (isAuthenticated) {
      initializeDatabase();
    }
  }, [isAuthenticated]);

  // Update sync status periodically
  useEffect(() => {
    const updateStatus = () => {
      updateSyncStatus();
    };

    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds
    
    // Listen for network changes
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const updateSyncStatus = useCallback(() => {
    const status = appwriteDatabase.getSyncStatus();
    setState(prev => ({
      ...prev,
      syncStatus: status
    }));
  }, []);

  const syncToCloud = useCallback(async (data: UsageData) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to sync data');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await appwriteDatabase.syncToCloud(data);
      updateSyncStatus();
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync to cloud failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [isAuthenticated, updateSyncStatus]);

  const loadFromCloud = useCallback(async (): Promise<UsageData | null> => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to load data');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const data = await appwriteDatabase.loadFromCloud();
      updateSyncStatus();
      
      setState(prev => ({ ...prev, isLoading: false }));
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Load from cloud failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [isAuthenticated, updateSyncStatus]);

  const deleteCloudData = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to delete data');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await appwriteDatabase.deleteCloudData();
      updateSyncStatus();
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete cloud data failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [isAuthenticated, updateSyncStatus]);

  const forceSync = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to sync');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await appwriteDatabase.forcSync();
      updateSyncStatus();
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Force sync failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [isAuthenticated, updateSyncStatus]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    syncToCloud,
    loadFromCloud,
    deleteCloudData,
    forceSync,
    clearError
  };
}

/**
 * Hook for sync status only
 */
export function useSyncStatus(): SyncStatus & { isLoading: boolean } {
  const { syncStatus, isLoading } = useCloudSync();
  
  return {
    ...syncStatus,
    isLoading
  };
}

/**
 * Hook for automatic sync operations
 */
export function useAutoSync(data: UsageData | null, enabled: boolean = true) {
  const { syncToCloud, syncStatus } = useCloudSync();
  const { isAuthenticated } = useAppwriteAuth();
  const [lastSyncData, setLastSyncData] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !data || syncStatus.syncInProgress) {
      return;
    }

    // Check if data has changed since last sync
    const dataString = JSON.stringify(data);
    if (dataString === lastSyncData) {
      return;
    }

    // Debounce sync operations
    const timeoutId = setTimeout(async () => {
      try {
        await syncToCloud(data);
        setLastSyncData(dataString);
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [data, enabled, isAuthenticated, syncToCloud, syncStatus.syncInProgress, lastSyncData]);
}

/**
 * Hook for offline sync queue management
 */
export function useOfflineSync() {
  const { syncStatus, forceSync } = useCloudSync();
  const { isAuthenticated } = useAppwriteAuth();

  // Auto-sync when coming back online
  useEffect(() => {
    if (syncStatus.isOnline && isAuthenticated && syncStatus.pendingChanges > 0) {
      const timeoutId = setTimeout(() => {
        forceSync().catch(error => {
          console.error('Auto sync after coming online failed:', error);
        });
      }, 1000); // 1 second delay to ensure connection is stable

      return () => clearTimeout(timeoutId);
    }
  }, [syncStatus.isOnline, isAuthenticated, syncStatus.pendingChanges, forceSync]);

  return {
    pendingChanges: syncStatus.pendingChanges,
    isOffline: !syncStatus.isOnline,
    forceSync
  };
}