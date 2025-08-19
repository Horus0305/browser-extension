/**
 * Appwrite integration module exports
 */

export { client, account, databases, appwriteConfig } from './client';
export { AppwriteAuth, appwriteAuth } from './AppwriteAuth';
export { AppwriteDatabase, appwriteDatabase } from './AppwriteDatabase';
export { getAppwriteConfig, validateAppwriteConfig, testAppwriteConnection } from './config';

export type { AuthUser, AuthSession } from './AppwriteAuth';
export type { CloudUsageDocument, SyncQueueItem } from './AppwriteDatabase';
export type { AppwriteConfig } from './config';

// Re-export hooks for convenience
export { useAppwriteAuth, useAuthStatus, useAuthActions } from '../hooks/useAppwriteAuth';
export { useCloudSync, useSyncStatus, useAutoSync, useOfflineSync } from '../hooks/useCloudSync';