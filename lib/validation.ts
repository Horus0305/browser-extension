/**
 * Data validation functions for storage integrity
 */

import { WebsiteUsage, DailyUsage, UserSession, UsageData, UserSettings, EncryptedStorageData } from './types';
import { isValidDomain } from './domain-utils';

/**
 * Validates a WebsiteUsage object
 * @param data - The data to validate
 * @returns True if valid, false otherwise
 */
export function validateWebsiteUsage(data: any): data is WebsiteUsage {
  if (!data || typeof data !== 'object') return false;
  
  return (
    typeof data.domain === 'string' &&
    isValidDomain(data.domain) &&
    typeof data.timeSpent === 'number' &&
    data.timeSpent >= 0 &&
    data.lastVisited instanceof Date &&
    typeof data.visitCount === 'number' &&
    data.visitCount >= 0 &&
    (data.favicon === undefined || typeof data.favicon === 'string')
  );
}

/**
 * Validates a DailyUsage object
 * @param data - The data to validate
 * @returns True if valid, false otherwise
 */
export function validateDailyUsage(data: any): data is DailyUsage {
  if (!data || typeof data !== 'object') return false;
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.date)) return false;
  
  // Validate totalTime
  if (typeof data.totalTime !== 'number' || data.totalTime < 0) return false;
  
  // Validate sessionCount
  if (typeof data.sessionCount !== 'number' || data.sessionCount < 0) return false;
  
  // Validate websites Map
  if (!(data.websites instanceof Map)) return false;
  
  // Validate each website entry
  for (const [domain, usage] of data.websites) {
    if (typeof domain !== 'string' || !validateWebsiteUsage(usage)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates a UserSession object
 * @param data - The data to validate
 * @returns True if valid, false otherwise
 */
export function validateUserSession(data: any): data is UserSession {
  if (!data || typeof data !== 'object') return false;
  
  return (
    data.startTime instanceof Date &&
    (data.endTime === undefined || data.endTime instanceof Date) &&
    typeof data.totalTime === 'number' &&
    data.totalTime >= 0 &&
    data.activeWebsites instanceof Map
  );
}

/**
 * Validates UserSettings object
 * @param data - The data to validate
 * @returns True if valid, false otherwise
 */
export function validateUserSettings(data: any): data is UserSettings {
  if (!data || typeof data !== 'object') return false;
  
  return (
    typeof data.isLoggedIn === 'boolean' &&
    typeof data.syncEnabled === 'boolean' &&
    typeof data.lastSyncTime === 'number' &&
    typeof data.trackingEnabled === 'boolean' &&
    typeof data.workModeEnabled === 'boolean' &&
    Array.isArray(data.excludedDomains) &&
    data.excludedDomains.every((domain: any) => typeof domain === 'string') &&
    typeof data.dataRetentionDays === 'number' &&
    data.dataRetentionDays > 0
  );
}

/**
 * Validates UsageData object
 * @param data - The data to validate
 * @returns True if valid, false otherwise
 */
export function validateUsageData(data: any): data is UsageData {
  if (!data || typeof data !== 'object') return false;
  
  // Validate totalTime
  if (typeof data.totalTime !== 'number' || data.totalTime < 0) return false;
  
  // Validate websites object
  if (!data.websites || typeof data.websites !== 'object') return false;
  
  for (const [domain, usage] of Object.entries(data.websites)) {
    if (typeof domain !== 'string' || !validateWebsiteUsage(usage)) {
      return false;
    }
  }
  
  // Validate dailyStats object
  if (!data.dailyStats || typeof data.dailyStats !== 'object') return false;
  
  for (const [date, dailyUsage] of Object.entries(data.dailyStats)) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date) || !validateDailyUsage(dailyUsage)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates EncryptedStorageData object
 * @param data - The data to validate
 * @returns True if valid, false otherwise
 */
export function validateEncryptedStorageData(data: any): data is EncryptedStorageData {
  if (!data || typeof data !== 'object') return false;
  
  return (
    typeof data.encryptedData === 'string' &&
    validateUserSettings(data.userSettings) &&
    typeof data.encryptionSalt === 'string' &&
    typeof data.version === 'string'
  );
}

/**
 * Sanitizes and validates a domain string
 * @param domain - The domain to sanitize
 * @returns Sanitized domain or null if invalid
 */
export function sanitizeDomain(domain: string): string | null {
  if (typeof domain !== 'string') return null;
  
  // Remove protocol, www, and trailing slashes
  let sanitized = domain
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .toLowerCase()
    .trim();
  
  return isValidDomain(sanitized) ? sanitized : null;
}

/**
 * Validates and sanitizes time value
 * @param time - Time value to validate
 * @returns Sanitized time or 0 if invalid
 */
export function sanitizeTime(time: any): number {
  const numTime = Number(time);
  return isNaN(numTime) || numTime < 0 ? 0 : Math.floor(numTime);
}

/**
 * Validates a date string in YYYY-MM-DD format
 * @param dateString - The date string to validate
 * @returns True if valid date format
 */
export function validateDateString(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date.toISOString().startsWith(dateString);
}

/**
 * Creates a default UserSettings object
 * @returns Default UserSettings
 */
export function createDefaultUserSettings(): UserSettings {
  return {
    isLoggedIn: false,
    syncEnabled: false,
    lastSyncTime: 0,
    trackingEnabled: true,
    workModeEnabled: false,
    excludedDomains: [],
    dataRetentionDays: 730, // 2 years
  };
}

/**
 * Creates a default UsageData object
 * @returns Default UsageData
 */
export function createDefaultUsageData(): UsageData {
  return {
    totalTime: 0,
    websites: {},
    dailyStats: {},
  };
}

/**
 * Migrates old data format to current format
 * @param data - The data to migrate
 * @param version - Current version
 * @returns Migrated data
 */
export function migrateData(data: any, version: string): any {
  // Handle data migration between versions
  if (!data) return createDefaultUsageData();
  
  // Add migration logic here as the schema evolves
  // For now, just return the data as-is
  return data;
}