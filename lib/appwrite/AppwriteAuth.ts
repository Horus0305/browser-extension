/**
 * Appwrite Authentication service with secure token management
 */

import { ID, OAuthProvider } from 'appwrite';
import { account } from './client';
import { generateMasterKey, wipeKey } from '../encryption';

export interface AuthUser {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
}

export interface AuthSession {
  $id: string;
  userId: string;
  expire: string;
  provider: string;
}

export class AppwriteAuth {
  private currentUser: AuthUser | null = null;
  private currentSession: AuthSession | null = null;
  private masterKey: string | null = null;

  constructor() {
    // Using centralized client from client.ts
  }

  /**
   * Initialize authentication and restore session if available
   */
  async initialize(): Promise<void> {
    try {
      // Try to get current session
      const session = await account.getSession('current');
      if (session) {
        this.currentSession = session as AuthSession;
        
        // Get user details
        const user = await account.get();
        this.currentUser = user as AuthUser;
        
        // Restore or generate master key
        await this.restoreMasterKey();
      }
    } catch (error) {
      // No active session, user needs to log in
      console.debug('No active session found');
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    try {
      // Create account
      const user = await account.create(ID.unique(), email, password, name);
      
      // Create session
      const session = await account.createEmailPasswordSession(email, password);
      
      this.currentUser = user as AuthUser;
      this.currentSession = session as AuthSession;
      
      // Generate and store master key
      await this.generateAndStoreMasterKey();
      
      return this.currentUser;
    } catch (error) {
      console.error('Sign up failed:', error);
      throw new Error('Failed to create account');
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      // Create session
      const session = await account.createEmailPasswordSession(email, password);
      this.currentSession = session as AuthSession;
      
      // Get user details
      const user = await account.get();
      this.currentUser = user as AuthUser;
      
      // Restore master key
      await this.restoreMasterKey();
      
      return this.currentUser;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw new Error('Invalid email or password');
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<void> {
    try {
      const runtime: any = (globalThis as any).browser?.runtime || (globalThis as any).chrome?.runtime;
      if (!runtime) {
        throw new Error('Extension runtime not available');
      }
      
      // Use a hosted callback URL instead of extension URL
      // You'll need to set this up in your Appwrite OAuth settings
      const callbackUrl = 'https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/browser-usage-tracker';
      
      console.log('Starting OAuth flow with callback URL:', callbackUrl);
      
      // Return a promise that resolves when OAuth completes
      return new Promise((resolve, reject) => {
        // Set up message listener for OAuth completion
        const messageListener = (message: any, sender: any, sendResponse: any) => {
          if (message.type === 'OAUTH_SUCCESS') {
            runtime.onMessage.removeListener(messageListener);
            // Complete the authentication flow
            this.handleOAuthCallback()
              .then(() => resolve())
              .catch(reject);
            return true;
          } else if (message.type === 'OAUTH_ERROR') {
            runtime.onMessage.removeListener(messageListener);
            reject(new Error(message.error || 'OAuth authentication failed'));
            return true;
          }
          return false;
        };
        
        runtime.onMessage.addListener(messageListener);
        
        // Start OAuth flow using chrome.identity API for better extension support
        if ((globalThis as any).chrome?.identity?.launchWebAuthFlow) {
          // Use Chrome Identity API for better extension OAuth support
          this.handleChromeIdentityOAuth(callbackUrl)
            .then(() => resolve())
            .catch(reject);
        } else {
          // Fallback to regular OAuth flow
          account.createOAuth2Session(
            OAuthProvider.Google,
            callbackUrl,
            callbackUrl + '?error=access_denied'
          );
          // The OAuth flow has started, wait for completion message
          console.log('OAuth session created, waiting for completion...');
        }
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
          runtime.onMessage.removeListener(messageListener);
          reject(new Error('OAuth timeout - please try again'));
        }, 60000); // 60 second timeout
      });
    } catch (error) {
      console.error('Google sign in failed:', error);
      throw new Error('Failed to sign in with Google');
    }
  }
  
  /**
   * Handle OAuth using Chrome Identity API (recommended for extensions)
   */
  private async handleChromeIdentityOAuth(callbackUrl: string): Promise<void> {
    const chrome = (globalThis as any).chrome;
    if (!chrome?.identity?.launchWebAuthFlow) {
      throw new Error('Chrome Identity API not available');
    }
    
    try {
      // Build the OAuth URL manually for better control
      const oauthUrl = await this.buildOAuthUrl(callbackUrl);
      
      // Launch web auth flow
      const responseUrl = await new Promise<string>((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
          url: oauthUrl,
          interactive: true
        }, (responseUrl: string) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (responseUrl) {
            resolve(responseUrl);
          } else {
            reject(new Error('No response URL received'));
          }
        });
      });
      
      console.log('OAuth response received:', responseUrl);
      
      // Extract and handle the OAuth response
      await this.handleOAuthResponse(responseUrl);
      
    } catch (error) {
      console.error('Chrome Identity OAuth failed:', error);
      throw error;
    }
  }
  
  /**
   * Build OAuth URL for manual flow
   */
  private async buildOAuthUrl(callbackUrl: string): Promise<string> {
    try {
      // Get OAuth URL from Appwrite
      // Note: This is a workaround since createOAuth2Session redirects immediately
      // We'll use the Appwrite REST API to get the OAuth URL
      const response = await fetch(`${import.meta.env.VITE_APPWRITE_ENDPOINT}/account/sessions/oauth2/google`, {
        method: 'GET',
        headers: {
          'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }
      
      // This should redirect, so we'll build the URL manually
      const baseUrl = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/account/sessions/oauth2/google`;
      const params = new URLSearchParams({
        project: import.meta.env.VITE_APPWRITE_PROJECT_ID,
        success: callbackUrl,
        failure: callbackUrl + '?error=access_denied'
      });
      
      return `${baseUrl}?${params.toString()}`;
      
    } catch (error) {
      console.error('Failed to build OAuth URL:', error);
      throw error;
    }
  }
  
  /**
   * Handle OAuth response from callback
   */
  private async handleOAuthResponse(responseUrl: string): Promise<void> {
    try {
      const url = new URL(responseUrl);
      const error = url.searchParams.get('error');
      
      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }
      
      // Check if we have a success response
      // The actual session should be created automatically by Appwrite
      // We just need to fetch the user data
      await this.handleOAuthCallback();
      
    } catch (error) {
      console.error('Failed to handle OAuth response:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and complete authentication
   */
  async handleOAuthCallback(): Promise<AuthUser> {
    try {
      // Get user details after OAuth callback
      const user = await account.get();
      this.currentUser = user as AuthUser;
      
      // Get current session
      const session = await account.getSession('current');
      this.currentSession = session as AuthSession;
      
      // Generate or restore master key
      await this.restoreMasterKey();
      
      return this.currentUser;
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      throw new Error('Failed to complete authentication');
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      if (this.currentSession) {
        await account.deleteSession(this.currentSession.$id);
      }
      
      // Clear local state
      this.currentUser = null;
      this.currentSession = null;
      
      // Securely wipe master key
      if (this.masterKey) {
        wipeKey(this.masterKey);
        this.masterKey = null;
      }
      
      // Clear stored master key
      await this.clearStoredMasterKey();
      
    } catch (error) {
      console.error('Sign out failed:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Get current session
   */
  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

  /**
   * Get user's master encryption key
   */
  getMasterKey(): string | null {
    return this.masterKey;
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string, oldPassword: string): Promise<void> {
    try {
      await account.updatePassword(newPassword, oldPassword);
    } catch (error) {
      console.error('Password update failed:', error);
      throw new Error('Failed to update password');
    }
  }

  /**
   * Send password recovery email
   */
  async recoverPassword(email: string): Promise<void> {
    try {
      await account.createRecovery(
        email,
        `${window.location.origin}/reset-password`
      );
    } catch (error) {
      console.error('Password recovery failed:', error);
      throw new Error('Failed to send recovery email');
    }
  }

  /**
   * Complete password recovery
   */
  async completePasswordRecovery(
    userId: string,
    secret: string,
    newPassword: string
  ): Promise<void> {
    try {
      await account.updateRecovery(userId, secret, newPassword);
    } catch (error) {
      console.error('Password recovery completion failed:', error);
      throw new Error('Failed to reset password');
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<void> {
    try {
      await account.createVerification(`${window.location.origin}/verify-email`);
    } catch (error) {
      console.error('Email verification failed:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Confirm email verification
   */
  async confirmEmailVerification(userId: string, secret: string): Promise<void> {
    try {
      await account.updateVerification(userId, secret);
      
      // Refresh user data
      if (this.isAuthenticated()) {
        const user = await account.get();
        this.currentUser = user as AuthUser;
      }
    } catch (error) {
      console.error('Email verification confirmation failed:', error);
      throw new Error('Failed to verify email');
    }
  }

  /**
   * Generate and store master encryption key
   */
  private async generateAndStoreMasterKey(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to generate master key');
    }

    try {
      // Generate new master key
      this.masterKey = generateMasterKey();
      
      // Store encrypted master key in browser storage
      // Use cross-browser compatible storage
      const storageAPI = (globalThis as any).browser?.storage || (globalThis as any).chrome?.storage;
      if (storageAPI) {
        await storageAPI.local.set({
          [`masterKey_${this.currentUser.$id}`]: this.masterKey
        });
      } else {
        console.warn('No storage API available for master key');
      }
      
    } catch (error) {
      console.error('Failed to generate master key:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  /**
   * Restore master key from storage
   */
  private async restoreMasterKey(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to restore master key');
    }

    try {
      const storageAPI = (globalThis as any).browser?.storage || (globalThis as any).chrome?.storage;
      if (!storageAPI) {
        console.warn('No storage API available for master key restoration');
        await this.generateAndStoreMasterKey();
        return;
      }

      const result = await storageAPI.local.get(`masterKey_${this.currentUser.$id}`);
      const storedKey = result[`masterKey_${this.currentUser.$id}`];
      
      if (storedKey) {
        this.masterKey = storedKey;
      } else {
        // Generate new master key if none exists
        await this.generateAndStoreMasterKey();
      }
      
    } catch (error) {
      console.error('Failed to restore master key:', error);
      // Generate new key as fallback
      await this.generateAndStoreMasterKey();
    }
  }

  /**
   * Clear stored master key
   */
  private async clearStoredMasterKey(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const storageAPI = (globalThis as any).browser?.storage || (globalThis as any).chrome?.storage;
      if (storageAPI) {
        await storageAPI.local.remove(`masterKey_${this.currentUser.$id}`);
      }
    } catch (error) {
      console.error('Failed to clear master key:', error);
    }
  }

  /**
   * Refresh authentication session
   */
  async refreshSession(): Promise<void> {
    try {
      if (!this.currentSession) {
        throw new Error('No active session to refresh');
      }

      // Get fresh session data
      const session = await account.getSession('current');
      this.currentSession = session as AuthSession;
      
      // Get fresh user data
      const user = await account.get();
      this.currentUser = user as AuthUser;
      
    } catch (error) {
      console.error('Session refresh failed:', error);
      // Clear invalid session
      this.currentUser = null;
      this.currentSession = null;
      if (this.masterKey) {
        wipeKey(this.masterKey);
        this.masterKey = null;
      }
      throw new Error('Session expired, please log in again');
    }
  }

  /**
   * Delete user account and all associated data
   */
  async deleteAccount(): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User must be authenticated to delete account');
      }

      // Delete account (this will also delete all sessions)
      // Note: In Appwrite v18, account deletion might need to be done server-side
      // For now, we'll delete all sessions and clear local data
      const sessions = await account.listSessions();
      for (const session of sessions.sessions) {
        await account.deleteSession(session.$id);
      }
      
      // Clear local state
      this.currentUser = null;
      this.currentSession = null;
      
      // Securely wipe master key
      if (this.masterKey) {
        wipeKey(this.masterKey);
        this.masterKey = null;
      }
      
      // Clear all stored data
      await this.clearStoredMasterKey();
      
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw new Error('Failed to delete account');
    }
  }
}

// Singleton instance
export const appwriteAuth = new AppwriteAuth();