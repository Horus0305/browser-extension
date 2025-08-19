/**
 * Integration tests for privacy and encryption system
 */

import {
  generateSalt,
  deriveKey,
  encryptUsageData,
  decryptUsageData,
  generateMasterKey,
} from '../encryption';
import { createDefaultUsageData, createDefaultUserSettings } from '../validation';
import { UsageData, UserSettings } from '../types';

describe('Privacy Integration Tests', () => {
  let testUsageData: UsageData;
  let testUserSettings: UserSettings;

  beforeEach(() => {
    testUsageData = {
      ...createDefaultUsageData(),
      totalTime: 7200000, // 2 hours
      websites: {
        'example.com': {
          domain: 'example.com',
          timeSpent: 3600000, // 1 hour
          lastVisited: new Date('2024-01-01T12:00:00Z'),
          visitCount: 10,
        },
        'test.com': {
          domain: 'test.com',
          timeSpent: 3600000, // 1 hour
          lastVisited: new Date('2024-01-01T13:00:00Z'),
          visitCount: 5,
        },
      },
    };

    testUserSettings = {
      ...createDefaultUserSettings(),
      trackingEnabled: true,
      workModeEnabled: false,
      excludedDomains: ['private.com', 'secret.org'],
    };
  });

  describe('End-to-end privacy workflow', () => {
    it('should complete full privacy setup and data protection workflow', () => {
      // Step 1: User enables privacy with password
      const userPassword = 'my-secure-password-123';
      const salt = generateSalt();
      const encryptionKey = deriveKey(userPassword, salt);

      // Step 2: Encrypt user data
      const encryptedData = encryptUsageData(testUsageData, encryptionKey);
      expect(encryptedData).toBeDefined();
      expect(typeof encryptedData).toBe('string');

      // Step 3: Simulate storage (encrypted data + settings)
      const storagePackage = {
        encryptedData,
        userSettings: testUserSettings,
        encryptionSalt: salt,
        version: '1.0',
      };

      // Step 4: Simulate loading from storage and decryption
      const loadedSalt = storagePackage.encryptionSalt;
      const loadedKey = deriveKey(userPassword, loadedSalt);
      const decryptedData = decryptUsageData(storagePackage.encryptedData, loadedKey);

      // Step 5: Verify data integrity
      expect(decryptedData.totalTime).toBe(testUsageData.totalTime);
      expect(decryptedData.websites['example.com'].domain).toBe('example.com');
      expect(decryptedData.websites['example.com'].timeSpent).toBe(3600000);
      expect(decryptedData.websites['test.com'].visitCount).toBe(5);
    });

    it('should handle work mode separation', () => {
      // Enable work mode
      const workModeSettings = {
        ...testUserSettings,
        workModeEnabled: true,
      };

      // Simulate work-only data
      const workData: UsageData = {
        totalTime: 3600000, // 1 hour work time
        websites: {
          'company.com': {
            domain: 'company.com',
            timeSpent: 1800000, // 30 minutes
            lastVisited: new Date('2024-01-01T09:00:00Z'),
            visitCount: 5,
          },
          'work-tool.com': {
            domain: 'work-tool.com',
            timeSpent: 1800000, // 30 minutes
            lastVisited: new Date('2024-01-01T10:00:00Z'),
            visitCount: 3,
          },
        },
        dailyStats: {},
      };

      // Encrypt work data separately
      const masterKey = generateMasterKey();
      const encryptedWorkData = encryptUsageData(workData, masterKey);
      const decryptedWorkData = decryptUsageData(encryptedWorkData, masterKey);

      expect(decryptedWorkData.totalTime).toBe(3600000);
      expect(Object.keys(decryptedWorkData.websites)).toHaveLength(2);
      expect(decryptedWorkData.websites['company.com']).toBeDefined();
    });

    it('should handle domain exclusions', () => {
      const excludedDomains = ['private.com', 'secret.org', 'personal.net'];
      
      // Test domain filtering logic
      const shouldTrackDomain = (domain: string) => {
        return !excludedDomains.includes(domain);
      };

      expect(shouldTrackDomain('example.com')).toBe(true);
      expect(shouldTrackDomain('private.com')).toBe(false);
      expect(shouldTrackDomain('secret.org')).toBe(false);
      expect(shouldTrackDomain('work.com')).toBe(true);

      // Create filtered data (simulating what would be stored)
      const filteredWebsites = Object.fromEntries(
        Object.entries(testUsageData.websites).filter(([domain]) => 
          shouldTrackDomain(domain)
        )
      );

      expect(Object.keys(filteredWebsites)).toHaveLength(2);
      expect(filteredWebsites['example.com']).toBeDefined();
      expect(filteredWebsites['test.com']).toBeDefined();
    });

    it('should handle password change workflow', () => {
      const oldPassword = 'old-password';
      const newPassword = 'new-secure-password';
      
      // Initial encryption
      const oldSalt = generateSalt();
      const oldKey = deriveKey(oldPassword, oldSalt);
      const encryptedData = encryptUsageData(testUsageData, oldKey);

      // Password change process
      // 1. Decrypt with old password
      const decryptedData = decryptUsageData(encryptedData, oldKey);
      
      // 2. Generate new salt and key
      const newSalt = generateSalt();
      const newKey = deriveKey(newPassword, newSalt);
      
      // 3. Re-encrypt with new password
      const reEncryptedData = encryptUsageData(decryptedData, newKey);
      
      // 4. Verify new password works
      const finalDecryptedData = decryptUsageData(reEncryptedData, newKey);
      expect(finalDecryptedData.totalTime).toBe(testUsageData.totalTime);
      
      // 5. Verify old password no longer works
      expect(() => {
        decryptUsageData(reEncryptedData, oldKey);
      }).toThrow();
    });

    it('should handle data export with privacy controls', () => {
      // Simulate export with privacy preferences
      const exportWithPersonalData = (includePersonalData: boolean) => {
        if (!includePersonalData) {
          return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            settings: testUserSettings,
            // No usage data included
          };
        }

        return {
          version: '1.0',
          exportDate: new Date().toISOString(),
          settings: testUserSettings,
          usageData: testUsageData,
        };
      };

      // Export without personal data
      const privateExport = exportWithPersonalData(false);
      expect(privateExport.settings).toBeDefined();
      expect(privateExport.usageData).toBeUndefined();

      // Export with personal data
      const fullExport = exportWithPersonalData(true);
      expect(fullExport.settings).toBeDefined();
      expect(fullExport.usageData).toBeDefined();
      expect(fullExport.usageData?.totalTime).toBe(7200000);
    });

    it('should handle encrypted backup and restore', () => {
      const password = 'backup-password-123';
      const salt = generateSalt();
      const key = deriveKey(password, salt);

      // Create encrypted backup
      const encryptedData = encryptUsageData(testUsageData, key);
      const backupPackage = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        encryptedData,
        encryptionSalt: salt,
        metadata: {
          totalWebsites: Object.keys(testUsageData.websites).length,
          totalTime: testUsageData.totalTime,
        },
      };

      // Simulate backup file
      const backupJson = JSON.stringify(backupPackage, null, 2);
      expect(backupJson.length).toBeGreaterThan(0);

      // Restore from backup
      const restoredPackage = JSON.parse(backupJson);
      const restoredKey = deriveKey(password, restoredPackage.encryptionSalt);
      const restoredData = decryptUsageData(restoredPackage.encryptedData, restoredKey);

      // Verify restoration
      expect(restoredData.totalTime).toBe(testUsageData.totalTime);
      expect(restoredData.websites['example.com'].domain).toBe('example.com');
      expect(restoredPackage.metadata.totalWebsites).toBe(2);
    });
  });

  describe('Privacy compliance scenarios', () => {
    it('should handle user consent withdrawal', () => {
      // Simulate user withdrawing consent
      const updatedSettings = {
        ...testUserSettings,
        trackingEnabled: false,
      };

      expect(updatedSettings.trackingEnabled).toBe(false);
      
      // When tracking is disabled, no new data should be collected
      // Existing data should remain encrypted and accessible
      const masterKey = generateMasterKey();
      const encryptedExistingData = encryptUsageData(testUsageData, masterKey);
      
      // User can still access their existing data
      const accessibleData = decryptUsageData(encryptedExistingData, masterKey);
      expect(accessibleData.totalTime).toBe(testUsageData.totalTime);
    });

    it('should handle data retention policies', () => {
      const retentionDays = 90; // 3 months
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Simulate data cleanup based on retention policy
      const filterDataByRetention = (data: UsageData, cutoffDate: Date) => {
        const filteredWebsites = Object.fromEntries(
          Object.entries(data.websites).filter(([, website]) => 
            website.lastVisited >= cutoffDate
          )
        );

        return {
          ...data,
          websites: filteredWebsites,
        };
      };

      // Test with recent data (should be kept)
      const recentData = {
        ...testUsageData,
        websites: {
          'recent.com': {
            domain: 'recent.com',
            timeSpent: 1800000,
            lastVisited: new Date(), // Today
            visitCount: 5,
          },
        },
      };

      const filteredRecentData = filterDataByRetention(recentData, cutoffDate);
      expect(Object.keys(filteredRecentData.websites)).toHaveLength(1);

      // Test with old data (should be removed)
      const oldData = {
        ...testUsageData,
        websites: {
          'old.com': {
            domain: 'old.com',
            timeSpent: 1800000,
            lastVisited: new Date('2023-01-01'), // Old date
            visitCount: 5,
          },
        },
      };

      const filteredOldData = filterDataByRetention(oldData, cutoffDate);
      expect(Object.keys(filteredOldData.websites)).toHaveLength(0);
    });

    it('should handle incognito mode exclusion', () => {
      // Simulate incognito mode detection
      const isIncognitoMode = (url: string) => {
        // In real implementation, this would check browser APIs
        // For testing, we simulate based on URL patterns
        return url.includes('private') || url.includes('incognito');
      };

      const testUrls = [
        'https://example.com/page',
        'https://private.example.com/secret',
        'https://normal-site.com',
        'https://incognito-test.com',
      ];

      const trackedUrls = testUrls.filter(url => !isIncognitoMode(url));
      
      expect(trackedUrls).toHaveLength(2);
      expect(trackedUrls).toContain('https://example.com/page');
      expect(trackedUrls).toContain('https://normal-site.com');
    });
  });
});