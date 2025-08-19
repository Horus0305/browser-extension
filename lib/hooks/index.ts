/**
 * Hooks index - exports all React hooks
 */

export { useBrowserTabs, useBrowserWindows, useBrowserStorage, useRuntimeMessaging, usePermissions } from './useBrowserAPI';
export { useDataExport } from './useDataExport';
export { useUsageData } from './useUsageData';
export { useDataManager } from './useDataManager';
export { useStorageMonitor } from './useStorageMonitor';

// Appwrite hooks
export { useAppwriteAuth, useAuthStatus, useAuthActions } from './useAppwriteAuth';
export { useCloudSync, useSyncStatus, useAutoSync, useOfflineSync } from './useCloudSync';

// Re-export types for convenience
export type { 
  DataManagerState, 
  DataManagerActions 
} from './useDataManager';

export type { 
  StorageMonitorState, 
  StorageMonitorActions, 
  CleanupEvent, 
  StorageAlert 
} from './useStorageMonitor';

// Appwrite types
export type { AuthState, AuthActions } from './useAppwriteAuth';
export type { CloudSyncState, CloudSyncActions } from './useCloudSync';