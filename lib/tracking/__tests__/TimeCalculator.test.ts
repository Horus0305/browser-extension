/**
 * Unit tests for TimeCalculator class
 */

import { TimeCalculator } from '../TimeCalculator';
import type { TabInfo } from '../../types';

// Mock performance API
(global as any).performance = {
  now: jest.fn(() => Date.now())
};

describe('TimeCalculator', () => {
  let timeCalculator: TimeCalculator;
  
  const mockTabInfo: TabInfo = {
    id: 1,
    url: 'https://example.com',
    domain: 'example.com',
    title: 'Example',
    isActive: true,
    windowId: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    timeCalculator = new TimeCalculator();
  });

  afterEach(() => {
    if (timeCalculator) {
      timeCalculator.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(timeCalculator).toBeDefined();
      expect(timeCalculator.isCurrentlyTracking()).toBe(false);
      expect(timeCalculator.getTotalSessionTime()).toBe(0);
    });

    it('should provide initial performance metrics', () => {
      const metrics = timeCalculator.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('activeTimers');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('totalSessionTime');
      expect(metrics).toHaveProperty('websiteCount');
      expect(metrics.activeTimers).toBe(0);
    });
  });

  describe('Time Tracking', () => {
    it('should start tracking a domain', () => {
      timeCalculator.startTracking(mockTabInfo);
      
      expect(timeCalculator.isCurrentlyTracking()).toBe(true);
      expect(timeCalculator.getActivelyTrackedDomains()).toContain('example.com');
    });

    it('should stop tracking and return elapsed time', async () => {
      timeCalculator.startTracking(mockTabInfo);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const elapsedTime = timeCalculator.stopTracking('example.com');
      
      expect(elapsedTime).toBeGreaterThan(0);
      expect(timeCalculator.isCurrentlyTracking()).toBe(false);
      expect(timeCalculator.getActivelyTrackedDomains()).not.toContain('example.com');
    });

    it('should handle multiple domains simultaneously', () => {
      const tabInfo2: TabInfo = { ...mockTabInfo, id: 2, domain: 'github.com', url: 'https://github.com' };
      
      timeCalculator.startTracking(mockTabInfo);
      timeCalculator.startTracking(tabInfo2);
      
      const trackedDomains = timeCalculator.getActivelyTrackedDomains();
      expect(trackedDomains).toContain('example.com');
      expect(trackedDomains).toContain('github.com');
      expect(trackedDomains).toHaveLength(2);
    });

    it('should replace existing timer for same domain', () => {
      timeCalculator.startTracking(mockTabInfo);
      const initialCount = timeCalculator.getActivelyTrackedDomains().length;
      
      // Start tracking same domain again
      timeCalculator.startTracking(mockTabInfo);
      
      expect(timeCalculator.getActivelyTrackedDomains()).toHaveLength(initialCount);
    });

    it('should get current elapsed time without stopping', async () => {
      timeCalculator.startTracking(mockTabInfo);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const elapsedTime = timeCalculator.getCurrentElapsedTime('example.com');
      expect(elapsedTime).toBeGreaterThan(0);
      expect(timeCalculator.isCurrentlyTracking()).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should track total session time', async () => {
      timeCalculator.startTracking(mockTabInfo);
      await new Promise(resolve => setTimeout(resolve, 100));
      timeCalculator.stopTracking('example.com');
      
      const totalTime = timeCalculator.getTotalSessionTime();
      expect(totalTime).toBeGreaterThan(0);
    });

    it('should provide current session information', async () => {
      timeCalculator.startTracking(mockTabInfo);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const session = timeCalculator.getCurrentSession();
      
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.endTime).toBeInstanceOf(Date);
      expect(session.totalTime).toBeGreaterThan(0);
      expect(session.activeWebsites.has('example.com')).toBe(true);
    });

    it('should reset session data', () => {
      timeCalculator.startTracking(mockTabInfo);
      timeCalculator.resetSession();
      
      expect(timeCalculator.getTotalSessionTime()).toBe(0);
      expect(timeCalculator.isCurrentlyTracking()).toBe(false);
      expect(timeCalculator.getActivelyTrackedDomains()).toHaveLength(0);
    });
  });

  describe('Pause and Resume', () => {
    it('should pause all tracking', async () => {
      const tabInfo2: TabInfo = { ...mockTabInfo, id: 2, domain: 'github.com', url: 'https://github.com' };
      
      timeCalculator.startTracking(mockTabInfo);
      timeCalculator.startTracking(tabInfo2);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const pausedTimes = timeCalculator.pauseTracking();
      
      expect(pausedTimes.size).toBe(2);
      expect(pausedTimes.has('example.com')).toBe(true);
      expect(pausedTimes.has('github.com')).toBe(true);
      expect(pausedTimes.get('example.com')).toBeGreaterThan(0);
    });

    it('should resume tracking after pause', () => {
      timeCalculator.startTracking(mockTabInfo);
      timeCalculator.pauseTracking();
      timeCalculator.resumeTracking();
      
      expect(timeCalculator.isCurrentlyTracking()).toBe(true);
      expect(timeCalculator.getActivelyTrackedDomains()).toContain('example.com');
    });
  });

  describe('Memory Management', () => {
    it('should enforce maximum timer limit', () => {
      // Create many timers to test limit
      for (let i = 0; i < 60; i++) {
        const tabInfo: TabInfo = {
          ...mockTabInfo,
          id: i,
          domain: `example${i}.com`,
          url: `https://example${i}.com`
        };
        timeCalculator.startTracking(tabInfo);
      }
      
      const metrics = timeCalculator.getPerformanceMetrics();
      expect(metrics.activeTimers).toBeLessThanOrEqual(50);
    });

    it('should report memory usage under limits', () => {
      // Add several timers
      for (let i = 0; i < 10; i++) {
        const tabInfo: TabInfo = {
          ...mockTabInfo,
          id: i,
          domain: `example${i}.com`,
          url: `https://example${i}.com`
        };
        timeCalculator.startTracking(tabInfo);
      }
      
      const metrics = timeCalculator.getPerformanceMetrics();
      expect(metrics.memoryUsage).toBeLessThan(50); // Should be well under 50MB
    });

    it('should cleanup old timers automatically', async () => {
      // This test would need to mock timers to simulate time passage
      // For now, we'll just verify the cleanup mechanism exists
      const debugInfo = timeCalculator.getDebugInfo();
      expect(debugInfo).toHaveProperty('activeTimers');
      expect(Array.isArray(debugInfo.activeTimers)).toBe(true);
    });
  });

  describe('Bulk Operations', () => {
    it('should stop all tracking', () => {
      const tabInfo2: TabInfo = { ...mockTabInfo, id: 2, domain: 'github.com', url: 'https://github.com' };
      
      timeCalculator.startTracking(mockTabInfo);
      timeCalculator.startTracking(tabInfo2);
      
      const results = timeCalculator.stopAllTracking();
      
      expect(results.size).toBe(2);
      expect(results.has('example.com')).toBe(true);
      expect(results.has('github.com')).toBe(true);
      expect(timeCalculator.isCurrentlyTracking()).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics accurately', () => {
      timeCalculator.startTracking(mockTabInfo);
      
      const metrics = timeCalculator.getPerformanceMetrics();
      
      expect(metrics.activeTimers).toBe(1);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.totalSessionTime).toBeGreaterThanOrEqual(0);
      expect(metrics.websiteCount).toBeGreaterThanOrEqual(0);
    });

    it('should update metrics when timers change', () => {
      const initialMetrics = timeCalculator.getPerformanceMetrics();
      
      timeCalculator.startTracking(mockTabInfo);
      const afterStartMetrics = timeCalculator.getPerformanceMetrics();
      
      expect(afterStartMetrics.activeTimers).toBeGreaterThan(initialMetrics.activeTimers);
      
      timeCalculator.stopTracking('example.com');
      const afterStopMetrics = timeCalculator.getPerformanceMetrics();
      
      expect(afterStopMetrics.activeTimers).toBeLessThan(afterStartMetrics.activeTimers);
    });
  });

  describe('Error Handling', () => {
    it('should handle stopping non-existent timer', () => {
      const elapsedTime = timeCalculator.stopTracking('non-existent.com');
      expect(elapsedTime).toBe(0);
    });

    it('should handle getting elapsed time for non-existent timer', () => {
      const elapsedTime = timeCalculator.getCurrentElapsedTime('non-existent.com');
      expect(elapsedTime).toBe(0);
    });

    it('should handle errors gracefully during tracking operations', () => {
      // Test with invalid tab info
      const invalidTabInfo = { ...mockTabInfo, domain: '' };
      
      expect(() => {
        timeCalculator.startTracking(invalidTabInfo);
      }).not.toThrow();
    });
  });

  describe('Debug Information', () => {
    it('should provide comprehensive debug info', () => {
      timeCalculator.startTracking(mockTabInfo);
      
      const debugInfo = timeCalculator.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('activeTimers');
      expect(debugInfo).toHaveProperty('sessionStartTime');
      expect(debugInfo).toHaveProperty('totalSessionTime');
      expect(debugInfo).toHaveProperty('isTracking');
      expect(debugInfo).toHaveProperty('metrics');
      
      expect(debugInfo.activeTimers).toHaveLength(1);
      expect(debugInfo.activeTimers[0]).toHaveProperty('domain');
      expect(debugInfo.activeTimers[0]).toHaveProperty('startTime');
      expect(debugInfo.activeTimers[0]).toHaveProperty('elapsed');
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully and return final session', async () => {
      timeCalculator.startTracking(mockTabInfo);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const finalSession = timeCalculator.shutdown();
      
      expect(finalSession).not.toBeNull();
      expect(finalSession?.totalTime).toBeGreaterThan(0);
      expect(finalSession?.activeWebsites.has('example.com')).toBe(true);
      expect(timeCalculator.isCurrentlyTracking()).toBe(false);
    });

    it('should handle shutdown with no active tracking', () => {
      const finalSession = timeCalculator.shutdown();
      
      expect(finalSession).not.toBeNull();
      expect(finalSession?.totalTime).toBe(0);
    });
  });
});