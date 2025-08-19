/**
 * Unit tests for encryption utilities
 */

import {
  generateSalt,
  deriveKey,
  encryptUsageData,
  decryptUsageData,
  encryptData,
  decryptData,
  generateMasterKey,
  isValidEncryptionKey,
  createDataHash,
  verifyDataIntegrity,
} from '../encryption';
import { UsageData } from '../types';

describe('Encryption Utilities', () => {
  const testUsageData: UsageData = {
    totalTime: 3600000, // 1 hour
    websites: {
      'example.com': {
        domain: 'example.com',
        timeSpent: 1800000, // 30 minutes
        lastVisited: new Date('2024-01-01T12:00:00Z'),
        visitCount: 5,
      },
      'test.com': {
        domain: 'test.com',
        timeSpent: 1800000, // 30 minutes
        lastVisited: new Date('2024-01-01T13:00:00Z'),
        visitCount: 3,
      },
    },
    dailyStats: {
      '2024-01-01': {
        date: '2024-01-01',
        totalTime: 3600000,
        websites: new Map([
          ['example.com', {
            domain: 'example.com',
            timeSpent: 1800000,
            lastVisited: new Date('2024-01-01T12:00:00Z'),
            visitCount: 5,
          }],
        ]),
        sessionCount: 2,
      },
    },
  };

  const testPassword = 'test-password-123';
  let testSalt: string;
  let testKey: string;

  beforeEach(() => {
    testSalt = generateSalt();
    testKey = deriveKey(testPassword, testSalt);
  });

  describe('generateSalt', () => {
    it('should generate a valid base64 salt', () => {
      const salt = generateSalt();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBeGreaterThan(0);
      
      // Should be valid base64
      expect(() => Buffer.from(salt, 'base64')).not.toThrow();
    });

    it('should generate different salts each time', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('deriveKey', () => {
    it('should derive a consistent key from password and salt', () => {
      const key1 = deriveKey(testPassword, testSalt);
      const key2 = deriveKey(testPassword, testSalt);
      expect(key1).toBe(key2);
    });

    it('should derive different keys for different passwords', () => {
      const key1 = deriveKey('password1', testSalt);
      const key2 = deriveKey('password2', testSalt);
      expect(key1).not.toBe(key2);
    });

    it('should derive different keys for different salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const key1 = deriveKey(testPassword, salt1);
      const key2 = deriveKey(testPassword, salt2);
      expect(key1).not.toBe(key2);
    });
  });

  describe('encryptUsageData and decryptUsageData', () => {
    it('should encrypt and decrypt usage data correctly', () => {
      const encrypted = encryptUsageData(testUsageData, testKey);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = decryptUsageData(encrypted, testKey);
      expect(decrypted.totalTime).toBe(testUsageData.totalTime);
      expect(decrypted.websites['example.com'].domain).toBe('example.com');
      expect(decrypted.websites['example.com'].timeSpent).toBe(1800000);
    });

    it('should fail to decrypt with wrong key', () => {
      const encrypted = encryptUsageData(testUsageData, testKey);
      const wrongKey = deriveKey('wrong-password', testSalt);
      
      expect(() => {
        decryptUsageData(encrypted, wrongKey);
      }).toThrow('Failed to decrypt data');
    });

    it('should handle empty usage data', () => {
      const emptyData: UsageData = {
        totalTime: 0,
        websites: {},
        dailyStats: {},
      };

      const encrypted = encryptUsageData(emptyData, testKey);
      const decrypted = decryptUsageData(encrypted, testKey);
      
      expect(decrypted.totalTime).toBe(0);
      expect(Object.keys(decrypted.websites)).toHaveLength(0);
      expect(Object.keys(decrypted.dailyStats)).toHaveLength(0);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt generic data', () => {
      const testData = { message: 'Hello, World!', number: 42, array: [1, 2, 3] };
      
      const encrypted = encryptData(testData, testKey);
      const decrypted = decryptData<typeof testData>(encrypted, testKey);
      
      expect(decrypted).toEqual(testData);
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        user: {
          id: 123,
          name: 'Test User',
          preferences: {
            theme: 'dark',
            notifications: true,
          },
        },
        data: [
          { id: 1, value: 'first' },
          { id: 2, value: 'second' },
        ],
      };

      const encrypted = encryptData(complexData, testKey);
      const decrypted = decryptData<typeof complexData>(encrypted, testKey);
      
      expect(decrypted).toEqual(complexData);
    });
  });

  describe('generateMasterKey', () => {
    it('should generate a valid master key', () => {
      const masterKey = generateMasterKey();
      expect(typeof masterKey).toBe('string');
      expect(masterKey.length).toBeGreaterThan(0);
      expect(isValidEncryptionKey(masterKey)).toBe(true);
    });

    it('should generate different master keys each time', () => {
      const key1 = generateMasterKey();
      const key2 = generateMasterKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('isValidEncryptionKey', () => {
    it('should validate correct encryption keys', () => {
      const validKey = generateMasterKey();
      expect(isValidEncryptionKey(validKey)).toBe(true);
    });

    it('should reject invalid keys', () => {
      expect(isValidEncryptionKey('')).toBe(false);
      expect(isValidEncryptionKey('short')).toBe(false);
      expect(isValidEncryptionKey('not-base64-!@#$%')).toBe(false);
    });

    it('should reject keys that are too short', () => {
      // Generate a short base64 string (less than 256 bits)
      const shortKey = Buffer.from('short').toString('base64');
      expect(isValidEncryptionKey(shortKey)).toBe(false);
    });
  });

  describe('createDataHash and verifyDataIntegrity', () => {
    it('should create consistent hashes for the same data', () => {
      const hash1 = createDataHash(testUsageData);
      const hash2 = createDataHash(testUsageData);
      expect(hash1).toBe(hash2);
    });

    it('should create different hashes for different data', () => {
      const data1 = { value: 'test1' };
      const data2 = { value: 'test2' };
      
      const hash1 = createDataHash(data1);
      const hash2 = createDataHash(data2);
      expect(hash1).not.toBe(hash2);
    });

    it('should verify data integrity correctly', () => {
      const hash = createDataHash(testUsageData);
      expect(verifyDataIntegrity(testUsageData, hash)).toBe(true);
      
      const modifiedData = { ...testUsageData, totalTime: 999999 };
      expect(verifyDataIntegrity(modifiedData, hash)).toBe(false);
    });

    it('should detect changes in nested objects', () => {
      const originalHash = createDataHash(testUsageData);
      
      const modifiedData = {
        ...testUsageData,
        websites: {
          ...testUsageData.websites,
          'example.com': {
            ...testUsageData.websites['example.com'],
            timeSpent: 999999,
          },
        },
      };
      
      expect(verifyDataIntegrity(modifiedData, originalHash)).toBe(false);
    });
  });

  describe('End-to-end encryption workflow', () => {
    it('should complete full encryption workflow', () => {
      // Generate encryption components
      const password = 'user-password-123';
      const salt = generateSalt();
      const key = deriveKey(password, salt);
      
      // Encrypt data
      const encrypted = encryptUsageData(testUsageData, key);
      
      // Create integrity hash
      const hash = createDataHash(testUsageData);
      
      // Decrypt data
      const decrypted = decryptUsageData(encrypted, key);
      
      // Verify integrity
      expect(verifyDataIntegrity(decrypted, hash)).toBe(true);
      
      // Verify data completeness
      expect(decrypted.totalTime).toBe(testUsageData.totalTime);
      expect(Object.keys(decrypted.websites)).toHaveLength(2);
      expect(decrypted.websites['example.com'].domain).toBe('example.com');
    });

    it('should handle password change workflow', () => {
      const oldPassword = 'old-password';
      const newPassword = 'new-password';
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      
      // Encrypt with old password
      const oldKey = deriveKey(oldPassword, salt1);
      const encrypted1 = encryptUsageData(testUsageData, oldKey);
      
      // Decrypt with old password
      const decrypted = decryptUsageData(encrypted1, oldKey);
      
      // Re-encrypt with new password
      const newKey = deriveKey(newPassword, salt2);
      const encrypted2 = encryptUsageData(decrypted, newKey);
      
      // Verify new encryption works
      const finalDecrypted = decryptUsageData(encrypted2, newKey);
      expect(finalDecrypted.totalTime).toBe(testUsageData.totalTime);
      
      // Verify old key no longer works
      expect(() => {
        decryptUsageData(encrypted2, oldKey);
      }).toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle corrupted encrypted data', () => {
      const encrypted = encryptUsageData(testUsageData, testKey);
      const corrupted = encrypted.slice(0, -10) + 'corrupted';
      
      expect(() => {
        decryptUsageData(corrupted, testKey);
      }).toThrow('Failed to decrypt data');
    });

    it('should handle invalid JSON in encrypted data', () => {
      // This test simulates what happens when decryption produces invalid JSON
      const invalidEncrypted = 'invalid-encrypted-data';
      
      expect(() => {
        decryptUsageData(invalidEncrypted, testKey);
      }).toThrow('Failed to decrypt data');
    });

    it('should handle empty encrypted data', () => {
      expect(() => {
        decryptUsageData('', testKey);
      }).toThrow('Failed to decrypt data');
    });
  });
});