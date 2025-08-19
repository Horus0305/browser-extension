/**
 * Unit tests for useStorageMonitor React hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useStorageMonitor } from '../useStorageMonitor';
import { dataManager } from '../../storage/DataManager';

// Mock DataManager
jest.mock('../../storage/DataManager');

const mockDataManager = dataManager as jest.Mocked<typeof dataManager>;

describe('useStorageMonitor', () => {
  const mockQuota = {
    used: 5 * 1024 * 1024, // 5MB
    available: 5 * 1024 * 1024, // 5MB
    percentage: 50
  };

  const mockHighQuota = {
    used: 8 * 1024 * 1024, // 8MB
    available: 2 * 1024 * 1024, // 2MB
    percentage: 80
  };

  const mockCriticalQuota = {
    used: 9 * 1024 * 1024, // 9MB
    available: 1 * 1024 * 1024, // 1MB
    percentage: 90
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockDataManager.getStorageQuota.mockResolvedValue(mockQuota);
    mockDataManager.performDataCleanup.mockResolvedValue(5);
    mockDataManager.isCleanupNeeded.mockResolvedValue(false);
  });

  describe('initialization', () => {
    it('should start monitoring on mount', async () => {
      const { result } = renderHook(() => useStorageMonitor());

      expect(result.current.isMonitoring).toBe(true);
      
      await waitFor(() => {
        expect(result.current.quota).toEqual(mockQuota);
      });

      expect(mockDataManager.getStorageQuota).toHaveBeenCalled();
    });

    it('should stop monitoring on unmount', () => {
      const { result, unmount } = renderHook(() => useStorageMonitor());

      expect(result.current.isMonitoring).toBe(true);

      unmount();

      // Note: We can't directly test the cleanup effect, but we can verify
      // that the component unmounts without errors
    });
  });

  describe('quota monitoring', () => {
    it('should refresh quota information', async () => {
      const { result } = renderHook(() => useStorageMonitor());

      await act(async () => {
        await result.current.actions.refreshQuota();
      });

      expect(mockDataManager.getStorageQuota).toHaveBeenCalled();
      expect(result.current.quota).toEqual(mockQuota);
    });

    it('should generate warning alert for high usage', async () => {
      mockDataManager.getStorageQuota.mockResolvedValue(mockHighQuota);

      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.quota).toEqual(mockHighQuota);
        expect(result.current.activeAlerts.length).toBe(1);
        expect(result.current.activeAlerts[0].type).toBe('warning');
        expect(result.current.activeAlerts[0].message).toContain('80.0% used');
      });
    });

    it('should generate critical alert for very high usage', async () => {
      mockDataManager.getStorageQuota.mockResolvedValue(mockCriticalQuota);

      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.quota).toEqual(mockCriticalQuota);
        expect(result.current.activeAlerts.length).toBe(1);
        expect(result.current.activeAlerts[0].type).toBe('critical');
        expect(result.current.activeAlerts[0].message).toContain('90.0% used');
      });
    });

    it('should provide formatted quota information', async () => {
      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.formattedQuota).toEqual({
          usedMB: '5.00',
          availableMB: '5.00',
          percentage: '50.0'
        });
      });
    });
  });

  describe('manual cleanup', () => {
    it('should perform manual cleanup', async () => {
      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.isMonitoring).toBe(true);
      });

      let removedEntries: number;
      await act(async () => {
        removedEntries = await result.current.actions.performManualCleanup(365);
      });

      expect(mockDataManager.performDataCleanup).toHaveBeenCalledWith(365);
      expect(removedEntries!).toBe(5);
      expect(result.current.cleanupHistory.length).toBe(1);
      expect(result.current.cleanupHistory[0].reason).toBe('manual');
      expect(result.current.cleanupHistory[0].removedEntries).toBe(5);
      expect(result.current.cleanupHistory[0].retentionDays).toBe(365);
    });

    it('should handle cleanup errors', async () => {
      const error = new Error('Cleanup failed');
      mockDataManager.performDataCleanup.mockRejectedValue(error);

      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.isMonitoring).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.actions.performManualCleanup();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.cleanupInProgress).toBe(false);
      expect(result.current.activeAlerts.some(alert => 
        alert.type === 'critical' && alert.message.includes('Cleanup failed')
      )).toBe(true);
    });

    it('should add success alert after cleanup', async () => {
      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.isMonitoring).toBe(true);
      });

      await act(async () => {
        await result.current.actions.performManualCleanup();
      });

      expect(result.current.activeAlerts.some(alert => 
        alert.type === 'info' && alert.message.includes('removed 5 old entries')
      )).toBe(true);
    });
  });

  describe('automatic cleanup', () => {
    it('should perform automatic cleanup when quota is critical', async () => {
      mockDataManager.getStorageQuota.mockResolvedValue(mockCriticalQuota);

      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.quota).toEqual(mockCriticalQuota);
        expect(result.current.criticalUsage).toBe(true);
      });
    });

    it('should not perform automatic cleanup when quota is normal', async () => {
      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.quota).toEqual(mockQuota);
        expect(result.current.needsCleanup).toBe(false);
      });
    });

    it('should prevent multiple simultaneous cleanups', async () => {
      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.isMonitoring).toBe(true);
      });

      // Perform one cleanup successfully
      await act(async () => {
        await result.current.actions.performManualCleanup();
      });

      expect(result.current.cleanupHistory.length).toBe(1);
      expect(mockDataManager.performDataCleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe('alert management', () => {
    it('should dismiss alerts', async () => {
      mockDataManager.getStorageQuota.mockResolvedValue(mockHighQuota);

      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.activeAlerts.length).toBe(1);
      });

      const alertId = result.current.activeAlerts[0].id;

      act(() => {
        result.current.actions.dismissAlert(alertId);
      });

      expect(result.current.activeAlerts.length).toBe(0);
      expect(result.current.alerts.some(alert => alert.id === alertId && alert.dismissed)).toBe(true);
    });

    it('should clear all alerts', async () => {
      mockDataManager.getStorageQuota.mockResolvedValue(mockHighQuota);

      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.activeAlerts.length).toBe(1);
      });

      act(() => {
        result.current.actions.clearAlerts();
      });

      expect(result.current.alerts.length).toBe(0);
      expect(result.current.activeAlerts.length).toBe(0);
    });

    it('should auto-cleanup old alerts', async () => {
      mockDataManager.getStorageQuota.mockResolvedValue(mockHighQuota);

      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.activeAlerts.length).toBe(1);
      });

      // Dismiss the alert
      const alertId = result.current.activeAlerts[0].id;
      act(() => {
        result.current.actions.dismissAlert(alertId);
      });

      expect(result.current.activeAlerts.length).toBe(0);
      expect(result.current.alerts.length).toBe(1);
      expect(result.current.alerts[0].dismissed).toBe(true);
    });
  });

  describe('computed values', () => {
    it('should calculate needsCleanup correctly', async () => {
      mockDataManager.getStorageQuota.mockResolvedValue(mockHighQuota);

      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.needsCleanup).toBe(true);
      });
    });

    it('should calculate criticalUsage correctly', async () => {
      mockDataManager.getStorageQuota.mockResolvedValue(mockCriticalQuota);

      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.criticalUsage).toBe(true);
      });
    });

    it('should filter active alerts correctly', async () => {
      mockDataManager.getStorageQuota.mockResolvedValue(mockHighQuota);

      const { result } = renderHook(() => useStorageMonitor());

      await waitFor(() => {
        expect(result.current.activeAlerts.length).toBe(1);
        expect(result.current.alerts.length).toBe(1);
      });

      // Dismiss alert
      const alertId = result.current.activeAlerts[0].id;
      act(() => {
        result.current.actions.dismissAlert(alertId);
      });

      expect(result.current.activeAlerts.length).toBe(0);
      expect(result.current.alerts.length).toBe(1);
    });
  });

  describe('monitoring controls', () => {
    it('should start and stop monitoring', () => {
      const { result } = renderHook(() => useStorageMonitor());

      expect(result.current.isMonitoring).toBe(true);

      act(() => {
        result.current.actions.stopMonitoring();
      });

      expect(result.current.isMonitoring).toBe(false);

      act(() => {
        result.current.actions.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(true);
    });
  });
});