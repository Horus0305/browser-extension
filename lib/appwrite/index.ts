/**
 * Appwrite integration module exports
 */

export { client, account, databases, appwriteConfig } from './client';
export { AppwriteAuth, appwriteAuth } from './AppwriteAuth';
export { getAppwriteConfig, validateAppwriteConfig, testAppwriteConnection } from './config';

export type { AuthUser, AuthSession } from './AppwriteAuth';
export type { AppwriteConfig } from './config';

// Re-export hooks for convenience
export { useAppwriteAuth, useAuthStatus, useAuthActions } from '../hooks/useAppwriteAuth';