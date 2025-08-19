/**
 * Core data models for the Browser Usage Tracker extension
 */

export interface WebsiteUsage {
  domain: string;
  timeSpent: number; // milliseconds
  lastVisited: Date;
  visitCount: number;
  favicon?: string;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD format
  totalTime: number;
  websites: Map<string, WebsiteUsage>;
  sessionCount: number;
}

export interface UserSession {
  startTime: Date;
  endTime?: Date;
  totalTime: number;
  activeWebsites: Map<string, number>;
}

/**
 * User settings and preferences
 */
export interface UserSettings {
  isLoggedIn: boolean;
  syncEnabled: boolean;
  lastSyncTime: number;
  trackingEnabled: boolean;
  workModeEnabled: boolean;
  excludedDomains: string[];
  dataRetentionDays: number;
}

/**
 * Encrypted storage schema
 */
export interface EncryptedStorageData {
  encryptedData: string; // AES-256 encrypted payload
  userSettings: UserSettings;
  encryptionSalt: string;
  version: string;
}

/**
 * Raw usage data structure (before encryption)
 */
export interface UsageData {
  totalTime: number;
  websites: Record<string, WebsiteUsage>;
  dailyStats: Record<string, DailyUsage>;
}

/**
 * Browser tab information
 */
export interface TabInfo {
  id: number;
  url: string;
  domain: string;
  title?: string;
  favicon?: string;
  isActive: boolean;
  windowId: number;
}

/**
 * Sync status for cloud operations
 */
export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: number;
  syncInProgress: boolean;
  pendingChanges: number;
  error?: string;
}