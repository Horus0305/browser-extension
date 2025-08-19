/**
 * React hook for monitoring storage usage and automatic cleanup
 */

import { useState, useEffect, useCallback } from 'react';
import { dataManager, StorageQuota } from '../storage/DataManager';

export interface StorageMonitorState {
  quota: StorageQuota | null;
  isMonitoring: boolean;
  cleanupInProgress: boolean;
  lastCleanupTime: number;
  cleanupHistory: CleanupEvent[];
  alerts: StorageAlert[];
}

export interface CleanupEvent {
  timestamp: number;
  removedEntries: number;
  reason: 'manual' | 'automatic' | 'quota_exceeded';
  retentionDays: number;
}

export interface StorageAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: number;
  dismissed: boolean;
}

export interface StorageMonitorActions {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  performManualCleanup: (retentionDays?: number) => Promise<number>;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  refreshQuota: () => Promise<StorageQuota | undefined>;
}

const STORAGE_WARNING_THRESHOLD = 70; // Warn at 70%
const STORAGE_CRITICAL_THRESHOLD = 85; // Critical at 85%
const MONITORING_INTERVAL = 60000; // Check every minute

export function useStorageMonitor() {
  const [state, setState] = useState<StorageMonitorState>({
    quota: null,
    isMonitoring: false,
    cleanupInProgress: false,
    lastCleanupTime: 0,
    cleanupHistory: [],
    alerts: []
  });

  // Generate unique alert ID
  const generateAlertId = useCallback(() => {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add alert
  const addAlert = useCallback((type: StorageAlert['type'], message: string) => {
    const alert: StorageAlert = {
      id: generateAlertId(),
      type,
      message,
      timestamp: Date.now(),
      dismissed: false
    };

    setState(prev => ({
      ...prev,
      alerts: [...prev.alerts, alert]
    }));
  }, [generateAlertId]);

  // Refresh storage quota
  const refreshQuota = useCallback(async () => {
    try {
      const quota = await dataManager.getStorageQuota();
      setState(prev => ({ ...prev, quota }));
      
      // Check for alerts based on quota
      if (quota.percentage >= STORAGE_CRITICAL_THRESHOLD) {
        addAlert('critical', `Storage usage critical: ${quota.percentage.toFixed(1)}% used. Automatic cleanup recommended.`);
      } else if (quota.percentage >= STORAGE_WARNING_THRESHOLD) {
        addAlert('warning', `Storage usage high: ${quota.percentage.toFixed(1)}% used. Consider cleaning up old data.`);
      }
      
      return quota;
    } catch (error) {
      console.error('Failed to refresh storage quota:', error);
      addAlert('critical', 'Failed to check storage usage. Extension may not function properly.');
    }
  }, [addAlert]);

  // Perform manual cleanup
  const performManualCleanup = useCallback(async (retentionDays: number = 730): Promise<number> => {
    // Prevent multiple simultaneous cleanups
    if (state.cleanupInProgress) {
      console.log('Cleanup already in progress, skipping');
      return 0;
    }
    
    setState(prev => ({ ...prev, cleanupInProgress: true }));
    
    try {
      const removedEntries = await dataManager.performDataCleanup(retentionDays);
      
      // Record cleanup event
      const cleanupEvent: CleanupEvent = {
        timestamp: Date.now(),
        removedEntries,
        reason: 'manual',
        retentionDays
      };
      
      setState(prev => ({
        ...prev,
        cleanupInProgress: false,
        lastCleanupTime: Date.now(),
        cleanupHistory: [cleanupEvent, ...prev.cleanupHistory.slice(0, 9)] // Keep last 10 events
      }));
      
      // Refresh quota after cleanup
      await refreshQuota();
      
      if (removedEntries > 0) {
        addAlert('info', `Cleanup completed: removed ${removedEntries} old entries.`);
      } else {
        addAlert('info', 'Cleanup completed: no old data found to remove.');
      }
      
      return removedEntries;
    } catch (error) {
      setState(prev => ({ ...prev, cleanupInProgress: false }));
      const errorMessage = error instanceof Error ? error.message : 'Cleanup failed';
      addAlert('critical', `Cleanup failed: ${errorMessage}`);
      throw error;
    }
  }, [state.cleanupInProgress, refreshQuota, addAlert]);

  // Automatic cleanup when quota is exceeded
  const performAutomaticCleanup = useCallback(async () => {
    if (state.cleanupInProgress) return;
    
    try {
      const quota = await dataManager.getStorageQuota();
      
      if (quota.percentage >= STORAGE_CRITICAL_THRESHOLD) {
        console.log('Performing automatic cleanup due to high storage usage');
        
        setState(prev => ({ ...prev, cleanupInProgress: true }));
        
        const removedEntries = await dataManager.performDataCleanup(365); // More aggressive cleanup
        
        const cleanupEvent: CleanupEvent = {
          timestamp: Date.now(),
          removedEntries,
          reason: 'automatic',
          retentionDays: 365
        };
        
        setState(prev => ({
          ...prev,
          cleanupInProgress: false,
          lastCleanupTime: Date.now(),
          cleanupHistory: [cleanupEvent, ...prev.cleanupHistory.slice(0, 9)]
        }));
        
        addAlert('info', `Automatic cleanup completed: removed ${removedEntries} old entries to free up space.`);
        
        // Refresh quota after cleanup
        await refreshQuota();
      }
    } catch (error) {
      setState(prev => ({ ...prev, cleanupInProgress: false }));
      console.error('Automatic cleanup failed:', error);
      addAlert('critical', 'Automatic cleanup failed. Manual intervention may be required.');
    }
  }, [state.cleanupInProgress, addAlert, refreshQuota]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: true }));
  }, []);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      )
    }));
  }, []);

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setState(prev => ({ ...prev, alerts: [] }));
  }, []);

  // Monitoring effect
  useEffect(() => {
    if (!state.isMonitoring) return;

    // Initial quota check
    refreshQuota();

    // Set up monitoring interval
    const interval = setInterval(async () => {
      await refreshQuota();
      await performAutomaticCleanup();
    }, MONITORING_INTERVAL);

    return () => clearInterval(interval);
  }, [state.isMonitoring, refreshQuota, performAutomaticCleanup]);

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  // Clean up old alerts
  useEffect(() => {
    const cleanup = setInterval(() => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.filter(alert => 
          !alert.dismissed && alert.timestamp > oneHourAgo
        )
      }));
    }, 5 * 60 * 1000); // Clean up every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  const actions: StorageMonitorActions = {
    startMonitoring,
    stopMonitoring,
    performManualCleanup,
    dismissAlert,
    clearAlerts,
    refreshQuota
  };

  return {
    ...state,
    actions,
    // Computed values
    needsCleanup: state.quota ? state.quota.percentage >= STORAGE_WARNING_THRESHOLD : false,
    criticalUsage: state.quota ? state.quota.percentage >= STORAGE_CRITICAL_THRESHOLD : false,
    activeAlerts: state.alerts.filter(alert => !alert.dismissed),
    formattedQuota: state.quota ? {
      usedMB: (state.quota.used / (1024 * 1024)).toFixed(2),
      availableMB: (state.quota.available / (1024 * 1024)).toFixed(2),
      percentage: state.quota.percentage.toFixed(1)
    } : null
  };
}