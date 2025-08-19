/**
 * Privacy context for managing privacy settings and encryption state
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAppContext } from './AppContext';
import { useBrowserStorage } from '../hooks/useBrowserAPI';
import { 
  generateMasterKey, 
  generateSalt, 
  encryptUsageData, 
  decryptUsageData,
  deriveKey,
  isValidEncryptionKey
} from '../encryption';
import { UsageData, UserSettings } from '../types';

interface PrivacyState {
  isEncryptionEnabled: boolean;
  hasConsented: boolean;
  masterKey: string | null;
  encryptionSalt: string | null;
  isInitialized: boolean;
}

interface PrivacyContextValue {
  privacyState: PrivacyState;
  enableEncryption: (password?: string) => Promise<boolean>;
  disableEncryption: () => Promise<boolean>;
  changeEncryptionPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  encryptAndStoreData: (data: UsageData) => Promise<boolean>;
  loadAndDecryptData: () => Promise<UsageData | null>;
  setPrivacyConsent: (consented: boolean) => void;
  clearAllPrivacyData: () => Promise<boolean>;
  exportEncryptedData: () => Promise<string | null>;
  importEncryptedData: (encryptedData: string, password: string) => Promise<boolean>;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

interface PrivacyProviderProps {
  children: ReactNode;
}

const PRIVACY_STORAGE_KEY = 'privacy_settings';
const ENCRYPTED_DATA_KEY = 'encrypted_usage_data';

export function PrivacyProvider({ children }: PrivacyProviderProps) {
  const { state, dispatch } = useAppContext();
  const { getStorageData, setStorageData, removeStorageData } = useBrowserStorage();
  
  const [privacyState, setPrivacyState] = useState<PrivacyState>({
    isEncryptionEnabled: false,
    hasConsented: false,
    masterKey: null,
    encryptionSalt: null,
    isInitialized: false,
  });

  // Initialize privacy settings on mount
  useEffect(() => {
    const initializePrivacy = async () => {
      try {
        const storedPrivacySettings = await getStorageData<any>(PRIVACY_STORAGE_KEY);
        
        if (storedPrivacySettings) {
          setPrivacyState(prev => ({
            ...prev,
            isEncryptionEnabled: storedPrivacySettings.isEncryptionEnabled || false,
            hasConsented: storedPrivacySettings.hasConsented || false,
            encryptionSalt: storedPrivacySettings.encryptionSalt || null,
            isInitialized: true,
          }));
        } else {
          setPrivacyState(prev => ({
            ...prev,
            isInitialized: true,
          }));
        }
      } catch (error) {
        console.error('Failed to initialize privacy settings:', error);
        setPrivacyState(prev => ({
          ...prev,
          isInitialized: true,
        }));
      }
    };

    initializePrivacy();
  }, [getStorageData]);

  // Save privacy settings when they change
  useEffect(() => {
    if (privacyState.isInitialized) {
      const settingsToStore = {
        isEncryptionEnabled: privacyState.isEncryptionEnabled,
        hasConsented: privacyState.hasConsented,
        encryptionSalt: privacyState.encryptionSalt,
      };
      
      setStorageData(PRIVACY_STORAGE_KEY, settingsToStore);
    }
  }, [privacyState, setStorageData]);

  /**
   * Enables encryption with optional password
   */
  const enableEncryption = async (password?: string): Promise<boolean> => {
    try {
      let masterKey: string;
      let salt: string;

      if (password) {
        // Use password-based encryption
        salt = generateSalt();
        masterKey = deriveKey(password, salt);
      } else {
        // Use random master key
        masterKey = generateMasterKey();
        salt = generateSalt();
      }

      // Test encryption with current data
      const testData = state.usageData;
      const encrypted = encryptUsageData(testData, masterKey);
      const decrypted = decryptUsageData(encrypted, masterKey);
      
      // Verify encryption/decryption works
      if (JSON.stringify(testData) !== JSON.stringify(decrypted)) {
        throw new Error('Encryption verification failed');
      }

      // Store encrypted data
      await setStorageData(ENCRYPTED_DATA_KEY, encrypted);

      setPrivacyState(prev => ({
        ...prev,
        isEncryptionEnabled: true,
        masterKey,
        encryptionSalt: salt,
      }));

      return true;
    } catch (error) {
      console.error('Failed to enable encryption:', error);
      return false;
    }
  };

  /**
   * Disables encryption and stores data in plain text
   */
  const disableEncryption = async (): Promise<boolean> => {
    try {
      // Remove encrypted data
      await removeStorageData(ENCRYPTED_DATA_KEY);

      setPrivacyState(prev => ({
        ...prev,
        isEncryptionEnabled: false,
        masterKey: null,
        encryptionSalt: null,
      }));

      return true;
    } catch (error) {
      console.error('Failed to disable encryption:', error);
      return false;
    }
  };

  /**
   * Changes encryption password
   */
  const changeEncryptionPassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      if (!privacyState.encryptionSalt) {
        throw new Error('No encryption salt found');
      }

      // Derive old key and decrypt data
      const oldKey = deriveKey(oldPassword, privacyState.encryptionSalt);
      const encryptedData = await getStorageData<string>(ENCRYPTED_DATA_KEY);
      
      if (!encryptedData) {
        throw new Error('No encrypted data found');
      }

      const decryptedData = decryptUsageData(encryptedData, oldKey);

      // Generate new salt and key
      const newSalt = generateSalt();
      const newKey = deriveKey(newPassword, newSalt);

      // Re-encrypt with new key
      const newEncryptedData = encryptUsageData(decryptedData, newKey);
      await setStorageData(ENCRYPTED_DATA_KEY, newEncryptedData);

      setPrivacyState(prev => ({
        ...prev,
        masterKey: newKey,
        encryptionSalt: newSalt,
      }));

      return true;
    } catch (error) {
      console.error('Failed to change encryption password:', error);
      return false;
    }
  };

  /**
   * Encrypts and stores usage data
   */
  const encryptAndStoreData = async (data: UsageData): Promise<boolean> => {
    try {
      if (!privacyState.isEncryptionEnabled || !privacyState.masterKey) {
        return false;
      }

      const encrypted = encryptUsageData(data, privacyState.masterKey);
      await setStorageData(ENCRYPTED_DATA_KEY, encrypted);
      return true;
    } catch (error) {
      console.error('Failed to encrypt and store data:', error);
      return false;
    }
  };

  /**
   * Loads and decrypts usage data
   */
  const loadAndDecryptData = async (): Promise<UsageData | null> => {
    try {
      if (!privacyState.isEncryptionEnabled || !privacyState.masterKey) {
        return null;
      }

      const encryptedData = await getStorageData<string>(ENCRYPTED_DATA_KEY);
      if (!encryptedData) {
        return null;
      }

      return decryptUsageData(encryptedData, privacyState.masterKey);
    } catch (error) {
      console.error('Failed to load and decrypt data:', error);
      return null;
    }
  };

  /**
   * Sets privacy consent status
   */
  const setPrivacyConsent = (consented: boolean) => {
    setPrivacyState(prev => ({
      ...prev,
      hasConsented: consented,
    }));

    // Update user settings
    dispatch({
      type: 'SET_USER_SETTINGS',
      payload: {
        ...state.userSettings,
        trackingEnabled: consented,
      },
    });
  };

  /**
   * Clears all privacy-related data
   */
  const clearAllPrivacyData = async (): Promise<boolean> => {
    try {
      await removeStorageData(PRIVACY_STORAGE_KEY);
      await removeStorageData(ENCRYPTED_DATA_KEY);

      setPrivacyState({
        isEncryptionEnabled: false,
        hasConsented: false,
        masterKey: null,
        encryptionSalt: null,
        isInitialized: true,
      });

      return true;
    } catch (error) {
      console.error('Failed to clear privacy data:', error);
      return false;
    }
  };

  /**
   * Exports encrypted data for backup
   */
  const exportEncryptedData = async (): Promise<string | null> => {
    try {
      if (!privacyState.isEncryptionEnabled) {
        return null;
      }

      const encryptedData = await getStorageData<string>(ENCRYPTED_DATA_KEY);
      if (!encryptedData) {
        return null;
      }

      const exportPackage = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        encryptedData,
        encryptionSalt: privacyState.encryptionSalt,
        metadata: {
          totalWebsites: Object.keys(state.usageData.websites).length,
          totalTime: state.usageData.totalTime,
        },
      };

      return JSON.stringify(exportPackage, null, 2);
    } catch (error) {
      console.error('Failed to export encrypted data:', error);
      return null;
    }
  };

  /**
   * Imports encrypted data from backup
   */
  const importEncryptedData = async (encryptedDataPackage: string, password: string): Promise<boolean> => {
    try {
      const importPackage = JSON.parse(encryptedDataPackage);
      
      if (!importPackage.encryptedData || !importPackage.encryptionSalt) {
        throw new Error('Invalid import package format');
      }

      // Derive key from password and salt
      const key = deriveKey(password, importPackage.encryptionSalt);
      
      // Test decryption
      const decryptedData = decryptUsageData(importPackage.encryptedData, key);
      
      // Store the imported data
      await setStorageData(ENCRYPTED_DATA_KEY, importPackage.encryptedData);
      
      setPrivacyState(prev => ({
        ...prev,
        isEncryptionEnabled: true,
        masterKey: key,
        encryptionSalt: importPackage.encryptionSalt,
      }));

      // Update app state with decrypted data
      dispatch({
        type: 'SET_USAGE_DATA',
        payload: decryptedData,
      });

      return true;
    } catch (error) {
      console.error('Failed to import encrypted data:', error);
      return false;
    }
  };

  const contextValue: PrivacyContextValue = {
    privacyState,
    enableEncryption,
    disableEncryption,
    changeEncryptionPassword,
    encryptAndStoreData,
    loadAndDecryptData,
    setPrivacyConsent,
    clearAllPrivacyData,
    exportEncryptedData,
    importEncryptedData,
  };

  return (
    <PrivacyContext.Provider value={contextValue}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}