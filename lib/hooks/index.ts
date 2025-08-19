/**
 * Hooks index - exports all React hooks
 */

// Appwrite hooks
export { useAppwriteAuth, useAuthStatus, useAuthActions } from './useAppwriteAuth';

// Re-export types for convenience
export type { AuthState, AuthActions } from './useAppwriteAuth';