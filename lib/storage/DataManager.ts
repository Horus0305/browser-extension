/**
 * DataManager class with client-side encryption for browser storage
 * Handles encrypted local storage, data migration, and cleanup
 */

import { 
  UsageData, 
  EncryptedStorageData, 
  UserSettings, 
  WebsiteUsage, 
  DailyUsage 
} from '../types';
import { 
  encryptData, 
  decryptData, 
  generateSalt, 
  generateMasterKey,
  createDataHash,
  verifyDataIntegrity 
} from '../encryption';
import { getStorageData, setStorageData } from '../browser-compat';
import { getCurrentDateString } from '../time-utils';

export interface StorageQuota {
  used: number;
  available: number;
  percentage: number;
}

export interface MigrationResult {
  success: boolean;
  version: string;
  migratedData?: boolean;
  error?: string;
}

export class DataManager {
  private static instance: DataManager;
  private masterKey: string | null = null;
  private currentVersion = '1.0.0';
  private storageKeys = {
    ENCRYPTED_DATA: 'encrypted_usage_data',
    USER_SETTINGS: 'user_settings',
    ENCRYPTION_SALT: 'encryption_salt',
    MASTER_KEY: 'master_key',
    VERSION: 'data_version',
    DATA_HASH: 'data_integrity_hash'
  };

  private constructor() {}

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  /**
   * Initialize the DataManager with encryption key
   */
  public async initialize(): Promise<void> {
    try {
      // Check if we have existing data
      const existingData = await getStorageData([
        this.storageKeys.ENCRYPTION_SALT,
        this.storageKeys.MASTER_KEY
      ]);
      
      if (!existingData[this.storageKeys.ENCRYPTION_SALT] || !existingData[this.storageKeys.MASTER_KEY]) {
        // First time setup - generate new encryption key and salt
        await this.setupNewEncryption();
      } else {
        // Load existing encryption setup
        await this.loadExistingEncryption();
      }

      // Perform any necessary migrations
      await this.performMigrations();
      
      console.log('DataManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DataManager:', error);
      // On initialization failure, try to reset and create new encryption
      try {
        console.log('Attempting to reset encryption and start fresh...');
        await this.setupNewEncryption();
        console.log('Successfully reset encryption');
      } catch (resetError) {
        console.error('Failed to reset encryption:', resetError);
        throw new Error('DataManager initialization failed completely');
      }
    }
  }

  /**
   * Save encrypted usage data to browser storage
   */
  public async saveUsageData(data: UsageData): Promise<void> {
    if (!this.masterKey) {
      throw new Error('DataManager not initialized');
    }

    try {
      console.log('Saving usage data:', {
        totalTime: data.totalTime,
        websiteCount: Object.keys(data.websites).length,
        dailyStatsCount: Object.keys(data.dailyStats).length,
        todayStats: data.dailyStats[getCurrentDateString()]
      });
      
      // Create data hash for integrity checking
      const dataHash = createDataHash(data);
      
      // Encrypt the usage data
      const encryptedData = encryptData(data, this.masterKey);
      
      // Save to storage
      await setStorageData({
        [this.storageKeys.ENCRYPTED_DATA]: encryptedData,
        [this.storageKeys.DATA_HASH]: dataHash,
        [this.storageKeys.VERSION]: this.currentVersion
      });

      console.log('Usage data saved successfully');
    } catch (error) {
      console.error('Failed to save usage data:', error);
      throw new Error('Failed to save usage data');
    }
  }

  /**
   * Load and decrypt usage data from browser storage
   */
  public async loadUsageData(): Promise<UsageData> {
    if (!this.masterKey) {
      throw new Error('DataManager not initialized');
    }

    try {
      const storageData = await getStorageData([
        this.storageKeys.ENCRYPTED_DATA,
        this.storageKeys.DATA_HASH
      ]);

      const encryptedData = storageData[this.storageKeys.ENCRYPTED_DATA];
      const expectedHash = storageData[this.storageKeys.DATA_HASH];

      if (!encryptedData) {
        // Return empty data structure for new installations
        console.log('No encrypted data found, returning empty usage data');
        return this.createEmptyUsageData();
      }

      // Decrypt the data
      const decryptedData = decryptData<UsageData>(encryptedData, this.masterKey);
      
      // Verify data integrity
      if (expectedHash && !verifyDataIntegrity(decryptedData, expectedHash)) {
        console.warn('Data integrity check failed, data may be corrupted');
        // Could implement recovery logic here
      }

      // Convert serialized Maps back to Map objects
      const processedData = this.deserializeUsageData(decryptedData);
      
      console.log('Usage data loaded successfully:', {
        totalTime: processedData.totalTime,
        websiteCount: Object.keys(processedData.websites).length,
        dailyStatsCount: Object.keys(processedData.dailyStats).length,
        todayStats: processedData.dailyStats[getCurrentDateString()]
      });
      return processedData;
    } catch (error) {
      console.error('Failed to load usage data:', error);
      
      // If decryption fails, it might be due to corrupted data or key mismatch
      // Try to reset and start fresh
      if (error instanceof Error && error.message.includes('decrypt')) {
        console.warn('Decryption failed, clearing corrupted data and starting fresh');
        try {
          await this.clearCorruptedData();
          return this.createEmptyUsageData();
        } catch (clearError) {
          console.error('Failed to clear corrupted data:', clearError);
        }
      }
      
      // Return empty data structure on error
      return this.createEmptyUsageData();
    }
  }

  /**
   * Save user settings (unencrypted for quick access)
   */
  public async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      await setStorageData({
        [this.storageKeys.USER_SETTINGS]: settings
      });
      console.log('User settings saved successfully');
    } catch (error) {
      console.error('Failed to save user settings:', error);
      throw new Error('Failed to save user settings');
    }
  }

  /**
   * Load user settings
   */
  public async loadUserSettings(): Promise<UserSettings> {
    try {
      const storageData = await getStorageData([this.storageKeys.USER_SETTINGS]);
      const settings = storageData[this.storageKeys.USER_SETTINGS];
      
      if (!settings) {
        return this.createDefaultUserSettings();
      }
      
      return settings;
    } catch (error) {
      console.error('Failed to load user settings:', error);
      return this.createDefaultUserSettings();
    }
  }

  /**
   * Clear all stored data
   */
  public async clearAllData(): Promise<void> {
    try {
      const keysToRemove = Object.values(this.storageKeys);
      
      // Clear from browser storage
      await (globalThis as any).browser.storage.local.remove(keysToRemove);
      
      // Reset internal state
      this.masterKey = null;
      
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw new Error('Failed to clear data');
    }
  }

  /**
   * Clear corrupted encrypted data while preserving encryption setup
   */
  private async clearCorruptedData(): Promise<void> {
    try {
      await (globalThis as any).browser.storage.local.remove([
        this.storageKeys.ENCRYPTED_DATA,
        this.storageKeys.DATA_HASH
      ]);
      
      console.log('Corrupted data cleared successfully');
    } catch (error) {
      console.error('Failed to clear corrupted data:', error);
      throw new Error('Failed to clear corrupted data');
    }
  }

  /**
   * Get storage quota information
   */
  public async getStorageQuota(): Promise<StorageQuota> {
    try {
      // Get storage usage information
      const usage = await (globalThis as any).browser.storage.local.getBytesInUse();
      
      // Browser storage limits (approximate)
      const maxStorage = 10 * 1024 * 1024; // 10MB for local storage
      
      return {
        used: usage,
        available: maxStorage - usage,
        percentage: (usage / maxStorage) * 100
      };
    } catch (error) {
      console.error('Failed to get storage quota:', error);
      return {
        used: 0,
        available: 0,
        percentage: 0
      };
    }
  }

  /**
   * Perform automatic data cleanup based on retention policies
   */
  public async performDataCleanup(retentionDays: number = 730): Promise<number> {
    try {
      const usageData = await this.loadUsageData();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      let removedEntries = 0;
      
      // Clean up old daily stats
      const dailyStatsToRemove: string[] = [];
      Object.keys(usageData.dailyStats).forEach(dateStr => {
        const date = new Date(dateStr);
        if (date < cutoffDate) {
          dailyStatsToRemove.push(dateStr);
          removedEntries++;
        }
      });
      
      // Remove old entries
      dailyStatsToRemove.forEach(dateStr => {
        delete usageData.dailyStats[dateStr];
      });
      
      // Clean up websites that haven't been visited recently
      const websitesToRemove: string[] = [];
      Object.entries(usageData.websites).forEach(([domain, website]) => {
        if (new Date(website.lastVisited) < cutoffDate) {
          websitesToRemove.push(domain);
          removedEntries++;
        }
      });
      
      websitesToRemove.forEach(domain => {
        delete usageData.websites[domain];
      });
      
      // Save cleaned data
      if (removedEntries > 0) {
        await this.saveUsageData(usageData);
        console.log(`Data cleanup completed: removed ${removedEntries} old entries`);
      }
      
      return removedEntries;
    } catch (error) {
      console.error('Failed to perform data cleanup:', error);
      return 0;
    }
  }

  /**
   * Check if storage cleanup is needed
   */
  public async isCleanupNeeded(): Promise<boolean> {
    try {
      const quota = await this.getStorageQuota();
      return quota.percentage > 80; // Cleanup when over 80% full
    } catch (error) {
      console.error('Failed to check cleanup status:', error);
      return false;
    }
  }

  /**
   * Rotate encryption key (for security)
   */
  public async rotateEncryptionKey(): Promise<void> {
    if (!this.masterKey) {
      throw new Error('DataManager not initialized');
    }

    try {
      // Load current data with old key
      const currentData = await this.loadUsageData();
      
      // Generate new key and salt
      const newSalt = generateSalt();
      const newMasterKey = generateMasterKey();
      
      // Update internal key
      const oldKey = this.masterKey;
      this.masterKey = newMasterKey;
      
      // Save data with new key
      await this.saveUsageData(currentData);
      
      // Update salt and key in storage
      await setStorageData({
        [this.storageKeys.ENCRYPTION_SALT]: newSalt,
        [this.storageKeys.MASTER_KEY]: newMasterKey
      });
      
      console.log('Encryption key rotated successfully');
    } catch (error) {
      console.error('Failed to rotate encryption key:', error);
      throw new Error('Failed to rotate encryption key');
    }
  }

  // Private helper methods

  private async setupNewEncryption(): Promise<void> {
    const salt = generateSalt();
    const masterKey = generateMasterKey();
    
    await setStorageData({
      [this.storageKeys.ENCRYPTION_SALT]: salt,
      [this.storageKeys.MASTER_KEY]: masterKey,
      [this.storageKeys.VERSION]: this.currentVersion
    });
    
    this.masterKey = masterKey;
    console.log('New encryption setup completed');
  }

  private async loadExistingEncryption(): Promise<void> {
    const storageData = await getStorageData([
      this.storageKeys.ENCRYPTION_SALT,
      this.storageKeys.MASTER_KEY
    ]);
    
    const salt = storageData[this.storageKeys.ENCRYPTION_SALT];
    const masterKey = storageData[this.storageKeys.MASTER_KEY];
    
    if (!salt) {
      throw new Error('Encryption salt not found');
    }
    
    if (!masterKey) {
      throw new Error('Master key not found');
    }
    
    this.masterKey = masterKey;
    console.log('Existing encryption loaded successfully');
  }

  private async performMigrations(): Promise<MigrationResult> {
    try {
      const storageData = await getStorageData([this.storageKeys.VERSION]);
      const storedVersion = storageData[this.storageKeys.VERSION] || '0.0.0';
      
      if (storedVersion === this.currentVersion) {
        return { success: true, version: this.currentVersion };
      }
      
      // Perform version-specific migrations
      let migrationPerformed = false;
      
      if (this.isVersionLessThan(storedVersion, '1.0.0')) {
        await this.migrateToV1();
        migrationPerformed = true;
      }
      
      // Update version
      await setStorageData({
        [this.storageKeys.VERSION]: this.currentVersion
      });
      
      return { 
        success: true, 
        version: this.currentVersion, 
        migratedData: migrationPerformed 
      };
    } catch (error) {
      console.error('Migration failed:', error);
      return { 
        success: false, 
        version: this.currentVersion, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async migrateToV1(): Promise<void> {
    // Migration logic for version 1.0.0
    console.log('Migrating data to version 1.0.0');
    // Add any necessary data structure changes here
  }

  private isVersionLessThan(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return true;
      if (v1Part > v2Part) return false;
    }
    
    return false;
  }

  private createEmptyUsageData(): UsageData {
    return {
      totalTime: 0,
      websites: {},
      dailyStats: {}
    };
  }

  private createDefaultUserSettings(): UserSettings {
    return {
      isLoggedIn: false,
      syncEnabled: false,
      lastSyncTime: 0,
      trackingEnabled: true,
      workModeEnabled: false,
      excludedDomains: [],
      dataRetentionDays: 730 // 2 years default
    };
  }

  private deserializeUsageData(data: UsageData): UsageData {
    // Convert serialized objects back to proper structure
    const processedData: UsageData = {
      ...data,
      websites: { ...data.websites },
      dailyStats: {}
    };
    
    // Restore Date objects in top-level websites
    Object.entries(processedData.websites).forEach(([domain, website]) => {
      if (website && typeof (website as any).lastVisited === 'string') {
        (processedData.websites as any)[domain] = {
          ...website,
          lastVisited: new Date((website as any).lastVisited)
        } as any;
      }
    });

    // Process daily stats to restore Map structures
    Object.entries(data.dailyStats).forEach(([date, dailyUsage]) => {
      let websitesMap: Map<string, WebsiteUsage>;
      
      // Handle both serialized Map (as object) and already-deserialized Map
      if (dailyUsage.websites instanceof Map) {
        websitesMap = dailyUsage.websites;
      } else if (dailyUsage.websites && typeof dailyUsage.websites === 'object') {
        // Check if it's a serialized Map (has entries property) or a plain object
        const websitesObj = dailyUsage.websites as any;
        if (Array.isArray(websitesObj)) {
          // It's already in Map entries format
          websitesMap = new Map(websitesObj);
        } else {
          // It's a plain object, convert to Map
          websitesMap = new Map(Object.entries(websitesObj));
        }
      } else {
        websitesMap = new Map();
      }
      
      // Restore Date objects in website entries
      const processedWebsitesMap = new Map<string, WebsiteUsage>();
      websitesMap.forEach((usage, domain) => {
        processedWebsitesMap.set(domain, {
          ...usage,
          lastVisited: typeof (usage as any).lastVisited === 'string'
            ? new Date((usage as any).lastVisited)
            : (usage as any).lastVisited
        });
      });
      
      processedData.dailyStats[date] = {
        ...dailyUsage,
        websites: processedWebsitesMap
      };
    });
    
    return processedData;
  }
}

// Export singleton instance
export const dataManager = DataManager.getInstance();