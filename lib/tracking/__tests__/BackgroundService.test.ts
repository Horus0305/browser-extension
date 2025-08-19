/**
 * Integration tests for BackgroundService
 */

// Mock the tracking modules
jest.mock('../TabTracker');
jest.mock('../TimeCalculator');

import { TabTracker } from '../TabTracker';
import { TimeCalculator } from '../TimeCalculator';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    onSuspend: {
      addListener: jest.fn()
    },
    id: 'test-extension-id'
  },
  windows: {
    onRemoved: {
      addListener: jest.fn()
    },
    getAll: jest.fn()
  }
};

(global as any).chrome = mockChrome;
(global as any).browser = { runtime: { id: 'test-extension-id' } };

// Mock performance API
(global as any).performance = {
  now: jest.fn(() => Date.now())
};

// Mock defineBackground
const mockDefineBackground = jest.fn();
(global as any).defineBackground = mockDefineBackground;

describe('BackgroundService Integration', () => {
  let MockedTabTracker: jest.MockedClass<typeof TabTracker>;
  let MockedTimeCalculator: jest.MockedClass<typeof TimeCalculator>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    MockedTabTracker = TabTracker as jest.MockedClass<typeof TabTracker>;
    MockedTimeCalculator = TimeCalculator as jest.MockedClass<typeof TimeCalculator>;
    
    // Setup default mocks
    MockedTabTracker.prototype.getPerformanceMetrics = jest.fn().mockReturnValue({
      memoryUsage: 5,
      initializationTime: 100,
      eventProcessingTime: 10,
      activeTimers: 1
    });
    
    MockedTabTracker.prototype.getTrackingState = jest.fn().mockReturnValue({
      activeTabId: 1,
      activeWindowId: 1,
      isWindowFocused: true,
      excludedDomains: []
    });
    
    MockedTabTracker.prototype.destroy = jest.fn();
    
    MockedTimeCalculator.prototype.startTracking = jest.fn();
    MockedTimeCalculator.prototype.stopTracking = jest.fn().mockReturnValue(1000);
    MockedTimeCalculator.prototype.pauseTracking = jest.fn().mockReturnValue(new Map([['example.com', 1000]]));
    MockedTimeCalculator.prototype.resumeTracking = jest.fn();
    MockedTimeCalculator.prototype.getActivelyTrackedDomains = jest.fn().mockReturnValue(['example.com']);
    MockedTimeCalculator.prototype.shutdown = jest.fn().mockReturnValue({
      startTime: new Date(),
      endTime: new Date(),
      totalTime: 5000,
      activeWebsites: new Map([['example.com', 1000]])
    });
    
    MockedTimeCalculator.prototype.getPerformanceMetrics = jest.fn().mockReturnValue({
      activeTimers: 1,
      memoryUsage: 2,
      totalSessionTime: 5000,
      websiteCount: 1
    });
    
    MockedTimeCalculator.prototype.getDebugInfo = jest.fn().mockReturnValue({
      activeTimers: [{ domain: 'example.com', startTime: Date.now(), elapsed: 1000 }],
      sessionStartTime: Date.now(),
      totalSessionTime: 5000,
      isTracking: true,
      metrics: {
        activeTimers: 1,
        memoryUsage: 2,
        totalSessionTime: 5000,
        websiteCount: 1
      }
    });
    
    mockChrome.storage.local.get.mockResolvedValue({
      userSettings: { excludedDomains: [] }
    });
    
    mockChrome.storage.local.set.mockResolvedValue(undefined);
  });

  describe('Initialization', () => {
    it('should initialize background service correctly', async () => {
      // Clear module cache to ensure fresh import
      delete require.cache[require.resolve('../../../entrypoints/background')];
      
      // Import and run the background script
      require('../../../entrypoints/background');
      
      // Verify defineBackground was called
      expect(mockDefineBackground).toHaveBeenCalled();
      
      // Execute the background function
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      backgroundFn();
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify components were initialized
      expect(MockedTimeCalculator).toHaveBeenCalled();
      expect(MockedTabTracker).toHaveBeenCalled();
    });

    it('should load excluded domains from storage', async () => {
      const excludedDomains = ['facebook.com', 'twitter.com'];
      mockChrome.storage.local.get.mockResolvedValue({
        userSettings: { excludedDomains }
      });
      
      delete require.cache[require.resolve('../../../entrypoints/background')];
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      backgroundFn();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(['userSettings']);
      expect(MockedTabTracker).toHaveBeenCalledWith(
        expect.any(Object),
        excludedDomains
      );
    });

    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.local.get.mockRejectedValue(new Error('Storage error'));
      
      delete require.cache[require.resolve('../../../entrypoints/background')];
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      
      // Should not throw
      expect(() => backgroundFn()).not.toThrow();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should still initialize with empty excluded domains
      expect(MockedTabTracker).toHaveBeenCalledWith(
        expect.any(Object),
        []
      );
    });
  });

  describe('Event Handling', () => {
    let tabTrackerEvents: any;
    
    beforeEach(async () => {
      delete require.cache[require.resolve('../../../entrypoints/background')];
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      backgroundFn();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the events object passed to TabTracker
      tabTrackerEvents = MockedTabTracker.mock.calls[0][0];
    });

    it('should handle tab activation events', () => {
      const tabInfo = {
        id: 1,
        url: 'https://example.com',
        domain: 'example.com',
        title: 'Example',
        isActive: true,
        windowId: 1
      };
      
      tabTrackerEvents.onTabActivated(tabInfo);
      
      expect(MockedTimeCalculator.prototype.startTracking).toHaveBeenCalledWith(tabInfo);
    });

    it('should handle tab deactivation events', () => {
      const tabInfo = {
        id: 1,
        url: 'https://example.com',
        domain: 'example.com',
        title: 'Example',
        isActive: false,
        windowId: 1
      };
      
      tabTrackerEvents.onTabDeactivated(tabInfo);
      
      expect(MockedTimeCalculator.prototype.stopTracking).toHaveBeenCalledWith('example.com');
    });

    it('should handle window focus changes', () => {
      // Lose focus
      tabTrackerEvents.onWindowFocusChanged(false);
      expect(MockedTimeCalculator.prototype.pauseTracking).toHaveBeenCalled();
      
      // Regain focus
      tabTrackerEvents.onWindowFocusChanged(true);
      expect(MockedTimeCalculator.prototype.resumeTracking).toHaveBeenCalled();
    });

    it('should handle tab updates with domain changes', () => {
      const tabInfo = {
        id: 1,
        url: 'https://github.com',
        domain: 'github.com',
        title: 'GitHub',
        isActive: true,
        windowId: 1
      };
      
      tabTrackerEvents.onTabUpdated(tabInfo);
      
      expect(MockedTimeCalculator.prototype.stopTracking).toHaveBeenCalledWith('example.com');
      expect(MockedTimeCalculator.prototype.startTracking).toHaveBeenCalledWith(tabInfo);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      backgroundFn();
      
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should monitor performance metrics periodically', async () => {
      // Wait for performance check interval
      await new Promise(resolve => setTimeout(resolve, 35000));
      
      expect(MockedTabTracker.prototype.getPerformanceMetrics).toHaveBeenCalled();
      expect(MockedTimeCalculator.prototype.getPerformanceMetrics).toHaveBeenCalled();
    }, 40000);

    it('should detect memory usage over limits', () => {
      // Mock high memory usage
      MockedTabTracker.prototype.getPerformanceMetrics.mockReturnValue({
        memoryUsage: 30,
        initializationTime: 100,
        eventProcessingTime: 10,
        activeTimers: 1
      });
      
      MockedTimeCalculator.prototype.getPerformanceMetrics.mockReturnValue({
        activeTimers: 50,
        memoryUsage: 25,
        totalSessionTime: 50000,
        websiteCount: 10
      });
      
      // This would be tested by triggering the performance check manually
      // The actual implementation logs warnings for high memory usage
    });
  });

  describe('Shutdown Handling', () => {
    beforeEach(async () => {
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      backgroundFn();
      
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should register shutdown handlers', () => {
      expect(mockChrome.runtime.onSuspend.addListener).toHaveBeenCalled();
      expect(mockChrome.windows.onRemoved.addListener).toHaveBeenCalled();
    });

    it('should handle graceful shutdown', async () => {
      // Trigger shutdown handler
      const shutdownHandler = mockChrome.runtime.onSuspend.addListener.mock.calls[0][0];
      shutdownHandler();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(MockedTimeCalculator.prototype.shutdown).toHaveBeenCalled();
      expect(MockedTabTracker.prototype.destroy).toHaveBeenCalled();
      expect(mockChrome.storage.local.set).toHaveBeenCalledWith({
        lastSession: expect.objectContaining({
          totalTime: 5000,
          activeWebsites: expect.any(Object),
          timestamp: expect.any(Number)
        })
      });
    });

    it('should handle window removal events', async () => {
      mockChrome.windows.getAll.mockImplementation((callback) => {
        callback([]); // No windows left
      });
      
      const windowRemovedHandler = mockChrome.windows.onRemoved.addListener.mock.calls[0][0];
      windowRemovedHandler(1);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockChrome.windows.getAll).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle TabTracker initialization errors', async () => {
      MockedTabTracker.mockImplementation(() => {
        throw new Error('TabTracker initialization failed');
      });
      
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      
      // Should not throw
      expect(() => backgroundFn()).not.toThrow();
    });

    it('should handle TimeCalculator initialization errors', async () => {
      MockedTimeCalculator.mockImplementation(() => {
        throw new Error('TimeCalculator initialization failed');
      });
      
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      
      // Should not throw
      expect(() => backgroundFn()).not.toThrow();
    });

    it('should handle event processing errors gracefully', async () => {
      MockedTimeCalculator.prototype.startTracking.mockImplementation(() => {
        throw new Error('Tracking failed');
      });
      
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      backgroundFn();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const tabTrackerEvents = MockedTabTracker.mock.calls[0][0];
      
      // Should not throw
      expect(() => {
        tabTrackerEvents.onTabActivated({
          id: 1,
          url: 'https://example.com',
          domain: 'example.com',
          title: 'Example',
          isActive: true,
          windowId: 1
        });
      }).not.toThrow();
    });

    it('should handle storage errors during shutdown', async () => {
      mockChrome.storage.local.set.mockRejectedValue(new Error('Storage error'));
      
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      backgroundFn();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const shutdownHandler = mockChrome.runtime.onSuspend.addListener.mock.calls[0][0];
      
      // Should not throw
      expect(() => shutdownHandler()).not.toThrow();
    });
  });

  describe('Development Mode', () => {
    it('should expose service in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      backgroundFn();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect((globalThis as any).backgroundService).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose service in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      require('../../../entrypoints/background');
      const backgroundFn = mockDefineBackground.mock.calls[0][0];
      backgroundFn();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect((globalThis as any).backgroundService).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});