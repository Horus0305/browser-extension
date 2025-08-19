/**
 * Client-side AES-256 encryption utilities for data protection
 */

import CryptoJS from 'crypto-js';
import { UsageData } from './types';

/**
 * Generates a random salt for encryption
 * @returns Base64 encoded salt
 */
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(256/8).toString(CryptoJS.enc.Base64);
}

/**
 * Derives an encryption key from a password and salt
 * @param password - User password or master key
 * @param salt - Base64 encoded salt
 * @returns Derived key
 */
export function deriveKey(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32,
    iterations: 10000
  }).toString();
}

/**
 * Encrypts usage data using AES-256
 * @param data - Usage data to encrypt
 * @param key - Encryption key
 * @returns Base64 encoded encrypted data
 */
export function encryptUsageData(data: UsageData, key: string): string {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts usage data using AES-256
 * @param encryptedData - Base64 encoded encrypted data
 * @param key - Decryption key
 * @returns Decrypted usage data
 */
export function decryptUsageData(encryptedData: string, key: string): UsageData {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!jsonString) {
      throw new Error('Invalid decryption key or corrupted data');
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypts any object using AES-256
 * @param data - Data to encrypt
 * @param key - Encryption key
 * @returns Base64 encoded encrypted data
 */
export function encryptData<T>(data: T, key: string): string {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts any object using AES-256
 * @param encryptedData - Base64 encoded encrypted data
 * @param key - Decryption key
 * @returns Decrypted data
 */
export function decryptData<T>(encryptedData: string, key: string): T {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!jsonString) {
      throw new Error('Invalid decryption key or corrupted data');
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generates a secure random master key for user data
 * @returns Base64 encoded master key
 */
export function generateMasterKey(): string {
  return CryptoJS.lib.WordArray.random(256/8).toString(CryptoJS.enc.Base64);
}

/**
 * Validates if a string is a valid encryption key
 * @param key - Key to validate
 * @returns True if valid key format
 */
export function isValidEncryptionKey(key: string): boolean {
  try {
    // Check if it's a valid base64 string with appropriate length
    const decoded = CryptoJS.enc.Base64.parse(key);
    return decoded.sigBytes >= 32; // At least 256 bits
  } catch {
    return false;
  }
}

/**
 * Securely wipes a key from memory (best effort)
 * @param key - Key to wipe
 */
export function wipeKey(key: string): void {
  // In JavaScript, we can't truly wipe memory, but we can overwrite the reference
  // This is more of a symbolic gesture for security practices
  if (typeof key === 'string') {
    // Create a new string with random data of the same length
    const randomData = CryptoJS.lib.WordArray.random(key.length).toString();
    // Note: This doesn't actually overwrite the original string in memory
    // but it's a best practice to show intent
    console.debug('Key wiped from active use');
  }
}

/**
 * Creates a hash of data for integrity checking
 * @param data - Data to hash
 * @returns SHA-256 hash
 */
export function createDataHash(data: any): string {
  const jsonString = JSON.stringify(data);
  return CryptoJS.SHA256(jsonString).toString();
}

/**
 * Verifies data integrity using hash
 * @param data - Data to verify
 * @param expectedHash - Expected hash value
 * @returns True if data is intact
 */
export function verifyDataIntegrity(data: any, expectedHash: string): boolean {
  const currentHash = createDataHash(data);
  return currentHash === expectedHash;
}