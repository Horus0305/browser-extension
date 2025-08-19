/**
 * Appwrite Database service for cloud sync with zero-knowledge architecture
 */

import { ID, Query, Models } from "appwrite";
import { databases, appwriteConfig } from "./client";
import { appwriteAuth } from "./AppwriteAuth";
import { encryptData, decryptData, createDataHash } from "../encryption";
import { UsageData } from "../types";

export interface CloudUsageDocument {
  $id: string;
  userId: string;
  encryptedData: string;
  dataHash: string;
  deviceId: string;
  lastUpdated: string;
  version: string;
}

export interface SyncQueueItem {
  id: string;
  data: UsageData;
  timestamp: number;
  retryCount: number;
}

export class AppwriteDatabase {
  private databaseId: string;
  private collectionId: string;
  private deviceId: string;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean =
    typeof navigator !== "undefined" ? navigator.onLine : true;
  private syncInProgress: boolean = false;

  constructor() {
    // Use centralized configuration
    this.databaseId = appwriteConfig.databaseId;
    this.collectionId = appwriteConfig.collectionId;

    // Generate or restore device ID
    this.deviceId = this.getOrCreateDeviceId();

    // Set up network monitoring
    this.setupNetworkMonitoring();
  }

  /**
   * Initialize database service
   */
  async initialize(): Promise<void> {
    try {
      // Restore sync queue from storage
      await this.restoreSyncQueue();

      // Process any pending sync operations
      if (this.isOnline && appwriteAuth.isAuthenticated()) {
        await this.processSyncQueue();
      }
    } catch (error) {
      console.error("Database initialization failed:", error);
    }
  }

  /**
   * Sync usage data to cloud with zero-knowledge encryption
   */
  async syncToCloud(data: UsageData): Promise<void> {
    if (!appwriteAuth.isAuthenticated()) {
      throw new Error("User must be authenticated to sync data");
    }

    const masterKey = appwriteAuth.getMasterKey();
    if (!masterKey) {
      throw new Error("Master encryption key not available");
    }

    try {
      // Add to sync queue if offline
      if (!this.isOnline) {
        await this.addToSyncQueue(data);
        return;
      }

      // Set sync in progress
      this.syncInProgress = true;

      // Encrypt data with user's master key
      const encryptedData = encryptData(data, masterKey);
      const dataHash = createDataHash(data);

      const user = appwriteAuth.getCurrentUser();
      if (!user) {
        throw new Error("User information not available");
      }

      // Prepare document
      const document = {
        userId: user.$id,
        encryptedData,
        dataHash,
        deviceId: this.deviceId,
        lastUpdated: new Date().toISOString(),
        version: "1.0.0",
      };

      // Check if document exists for this user and device
      const existingDoc = await this.getExistingDocument(
        user.$id,
        this.deviceId
      );

      if (existingDoc) {
        // Update existing document
        await databases.updateDocument(
          this.databaseId,
          this.collectionId,
          existingDoc.$id,
          document
        );
      } else {
        // Create new document
        await databases.createDocument(
          this.databaseId,
          this.collectionId,
          ID.unique(),
          document
        );
      }

      // Update last sync time on successful sync
      this.updateLastSyncTime();
      console.log("Data synced to cloud successfully");
    } catch (error) {
      console.error("Cloud sync failed:", error);

      // Add to sync queue for retry
      await this.addToSyncQueue(data);

      throw new Error("Failed to sync data to cloud");
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Load usage data from cloud with zero-knowledge decryption
   */
  async loadFromCloud(): Promise<UsageData | null> {
    if (!appwriteAuth.isAuthenticated()) {
      throw new Error("User must be authenticated to load data");
    }

    const masterKey = appwriteAuth.getMasterKey();
    if (!masterKey) {
      throw new Error("Master encryption key not available");
    }

    try {
      const user = appwriteAuth.getCurrentUser();
      if (!user) {
        throw new Error("User information not available");
      }

      // Get all documents for this user
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal("userId", user.$id),
          Query.orderDesc("lastUpdated"),
          Query.limit(100), // Limit to prevent large queries
        ]
      );

      if (response.documents.length === 0) {
        return null;
      }

      // Merge data from all devices
      const mergedData = await this.mergeDeviceData(
        response.documents,
        masterKey
      );

      return mergedData;
    } catch (error) {
      console.error("Failed to load data from cloud:", error);
      throw new Error("Failed to load data from cloud");
    }
  }

  /**
   * Delete all cloud data for current user
   */
  async deleteCloudData(): Promise<void> {
    if (!appwriteAuth.isAuthenticated()) {
      throw new Error("User must be authenticated to delete data");
    }

    try {
      const user = appwriteAuth.getCurrentUser();
      if (!user) {
        throw new Error("User information not available");
      }

      // Get all documents for this user
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [Query.equal("userId", user.$id)]
      );

      // Delete all documents
      const deletePromises = response.documents.map((doc) =>
        databases.deleteDocument(this.databaseId, this.collectionId, doc.$id)
      );

      await Promise.all(deletePromises);

      console.log("All cloud data deleted successfully");
    } catch (error) {
      console.error("Failed to delete cloud data:", error);
      throw new Error("Failed to delete cloud data");
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
    pendingChanges: number;
    lastSyncTime: number;
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingChanges: this.syncQueue.length,
      lastSyncTime: this.getLastSyncTime(),
    };
  }

  /**
   * Force sync all pending changes
   */
  async forcSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    if (!appwriteAuth.isAuthenticated()) {
      throw new Error("User must be authenticated to sync");
    }

    await this.processSyncQueue();
  }

  /**
   * Add data to sync queue for offline handling
   */
  private async addToSyncQueue(data: UsageData): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: ID.unique(),
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.syncQueue.push(queueItem);

    // Persist queue to storage
    await this.persistSyncQueue();

    console.log("Data added to sync queue");
  }

  /**
   * Process sync queue when online
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0 || this.syncInProgress) {
      return;
    }

    console.log(`Processing ${this.syncQueue.length} items in sync queue`);

    const itemsToProcess = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of itemsToProcess) {
      try {
        await this.syncToCloud(item.data);
        console.log(`Synced queued item ${item.id}`);
      } catch (error) {
        console.error(`Failed to sync queued item ${item.id}:`, error);

        // Retry logic
        if (item.retryCount < 3) {
          item.retryCount++;
          this.syncQueue.push(item);
        } else {
          console.error(`Dropping queued item ${item.id} after 3 retries`);
        }
      }
    }

    // Persist updated queue
    await this.persistSyncQueue();
  }

  /**
   * Get existing document for user and device
   */
  private async getExistingDocument(
    userId: string,
    deviceId: string
  ): Promise<CloudUsageDocument | null> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal("userId", userId),
          Query.equal("deviceId", deviceId),
          Query.limit(1),
        ]
      );

      return response.documents.length > 0
        ? (response.documents[0] as unknown as CloudUsageDocument)
        : null;
    } catch (error) {
      console.error("Failed to get existing document:", error);
      return null;
    }
  }

  /**
   * Merge data from multiple devices
   */
  private async mergeDeviceData(
    documents: Models.Document[],
    masterKey: string
  ): Promise<UsageData> {
    const mergedData: UsageData = {
      totalTime: 0,
      websites: {},
      dailyStats: {},
    };

    for (const doc of documents) {
      try {
        const cloudDoc = doc as unknown as CloudUsageDocument;
        const decryptedData = decryptData<UsageData>(
          cloudDoc.encryptedData,
          masterKey
        );

        // Verify data integrity
        const expectedHash = createDataHash(decryptedData);
        if (expectedHash !== cloudDoc.dataHash) {
          console.warn(`Data integrity check failed for document ${doc.$id}`);
          continue;
        }

        // Merge total time (take maximum)
        mergedData.totalTime = Math.max(
          mergedData.totalTime,
          decryptedData.totalTime
        );

        // Merge websites data
        for (const [domain, usage] of Object.entries(decryptedData.websites)) {
          if (!mergedData.websites[domain]) {
            mergedData.websites[domain] = { ...usage };
          } else {
            // Merge website usage data
            const existing = mergedData.websites[domain];
            existing.timeSpent += usage.timeSpent;
            existing.visitCount += usage.visitCount;
            existing.lastVisited = new Date(
              Math.max(
                new Date(existing.lastVisited).getTime(),
                new Date(usage.lastVisited).getTime()
              )
            );
          }
        }

        // Merge daily stats
        for (const [date, dailyUsage] of Object.entries(
          decryptedData.dailyStats
        )) {
          if (!mergedData.dailyStats[date]) {
            mergedData.dailyStats[date] = { ...dailyUsage };
          } else {
            // Merge daily usage data
            const existing = mergedData.dailyStats[date];
            existing.totalTime += dailyUsage.totalTime;
            existing.sessionCount += dailyUsage.sessionCount;

            // Merge websites within daily stats
            for (const [domain, usage] of dailyUsage.websites.entries()) {
              if (!existing.websites.has(domain)) {
                existing.websites.set(domain, { ...usage });
              } else {
                const existingUsage = existing.websites.get(domain)!;
                existingUsage.timeSpent += usage.timeSpent;
                existingUsage.visitCount += usage.visitCount;
                existingUsage.lastVisited = new Date(
                  Math.max(
                    new Date(existingUsage.lastVisited).getTime(),
                    new Date(usage.lastVisited).getTime()
                  )
                );
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to decrypt document ${doc.$id}:`, error);
        continue;
      }
    }

    return mergedData;
  }

  /**
   * Get or create device ID
   */
  private getOrCreateDeviceId(): string {
    try {
      // Check if localStorage is available
      if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem("deviceId");
        if (stored) {
          return stored;
        }

        const newDeviceId = ID.unique();
        localStorage.setItem("deviceId", newDeviceId);
        return newDeviceId;
      } else {
        // Fallback for environments without localStorage
        return ID.unique();
      }
    } catch (error) {
      console.error("Failed to get/create device ID:", error);
      return ID.unique();
    }
  }

  /**
   * Set up network monitoring
   */
  private setupNetworkMonitoring(): void {
    // Check if window is available (not in Node.js/test environment)
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        console.log("Network connection restored");
        this.isOnline = true;

        // Process sync queue when coming back online
        if (appwriteAuth.isAuthenticated()) {
          this.processSyncQueue().catch((error) => {
            console.error(
              "Failed to process sync queue after coming online:",
              error
            );
          });
        }
      });

      window.addEventListener("offline", () => {
        console.log("Network connection lost");
        this.isOnline = false;
      });
    }
  }

  /**
   * Persist sync queue to storage
   */
  private async persistSyncQueue(): Promise<void> {
    try {
      // Check if browser storage is available (for extension context)
      if (typeof browser !== "undefined" && browser.storage) {
        await browser.storage.local.set({
          syncQueue: this.syncQueue,
        });
      } else {
        // Fallback to localStorage for web context
        localStorage.setItem("syncQueue", JSON.stringify(this.syncQueue));
      }
    } catch (error) {
      console.error("Failed to persist sync queue:", error);
    }
  }

  /**
   * Restore sync queue from storage
   */
  private async restoreSyncQueue(): Promise<void> {
    try {
      // Check if browser storage is available (for extension context)
      if (typeof browser !== "undefined" && browser.storage) {
        const result = await browser.storage.local.get("syncQueue");
        if (result.syncQueue && Array.isArray(result.syncQueue)) {
          this.syncQueue = result.syncQueue;
        }
      } else {
        // Fallback to localStorage for web context
        const stored = localStorage.getItem("syncQueue");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.syncQueue = parsed;
          }
        }
      }
    } catch (error) {
      console.error("Failed to restore sync queue:", error);
      this.syncQueue = [];
    }
  }

  /**
   * Get last sync time from storage
   */
  private getLastSyncTime(): number {
    try {
      if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem("lastSyncTime");
        return stored ? parseInt(stored, 10) : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Update last sync time
   */
  private updateLastSyncTime(): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("lastSyncTime", Date.now().toString());
      }
    } catch (error) {
      console.error("Failed to update last sync time:", error);
    }
  }
}

// Singleton instance
export const appwriteDatabase = new AppwriteDatabase();
