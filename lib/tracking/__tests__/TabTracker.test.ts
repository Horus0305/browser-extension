/**
 * Unit tests for TabTracker class
 */

import { TabTracker, type TabTrackerEvents } from '../TabTracker';
import type { TabInfo } from '../../types';

// Mock Chrome APIs
const mockChrome = {
  tabs: {
    onActivated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    query: jest.fn(),
    get: jest.fn()
  },
  windows: {
    onFocusChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    WINDOW_ID_NONE: -1
  }
};

// Mock global chrome object
(global as any).chrome = mockChrome;

// Mock performance API
(global as any).performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10 // 10MB
  }
};

describe('TabTracker', () => {
  let tabTracker: TabTracker;
  let mockEvents: TabTrackerEvents;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEvents = {
      onTabActivated: jest.fn(),
      onTabDeactivated: jest.fn(),
      onWindowFocusChanged: jest.fn(),
      onTabUpdated: jest.fn()
    };
    
    // Mock successful tab query
    mockChrome.tabs.query.mockResolvedValue([{
      id: 1,
      url: 'https://example.com',
      title: 'Example',
      windowId: 1,
      favIconUrl: 'https://example.com/favicon.ico'
    }]);
  });
  
  afterEach(() => {
    if (tabTracker) {
      tabTracker.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      tabTracker = new TabTracker(mockEvents);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockChrome.tabs.onActivated.addListener).toHaveBeenCalled();
      expect(mockChrome.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(mockChrome.windows.onFocusChanged.addListener).toHaveBeenCalled();
      expect(mockChrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    });

    it('should complete initialization within 2 seconds', async () => {
      const startTime = performance.now();
      tabTracker = new TabTracker(mockEvents);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const metrics = tabTracker.getPerformanceMetrics();
      expect(metrics.initializationTime).toBeLessThan(2000);
    });

    it('should handle excluded domains', () => {
      const excludedDomains = ['facebook.com', 'twitter.com'];
      tabTracker = new TabTracker(mockEvents, excludedDomains);
      
      const state = tabTracker.getTrackingState();
      expect(state.excludedDomains).toEqual(excludedDomains);
    });
  });

  describe('Tab Activation', () => {
    beforeEach(() => {
      tabTracker = new TabTracker(mockEvents);
    });

    it('should handle tab activation events', async () => {
      const mockTab = {
        id: 2,
        url: 'https://github.com',
        title: 'GitHub',
        windowId: 1,
        favIconUrl: 'https://github.com/favicon.ico'
      };
      
      mockChrome.tabs.get.mockResolvedValue(mockTab);
      
      // Get the registered handler
      const activatedHandler = mockChrome.tabs.onActivated.addListener.mock.calls[0][0];
      
      // Trigger tab activation
      await activatedHandler({ tabId: 2, windowId: 1 });
      
      expect(mockEvents.onTabActivated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          domain: 'github.com',
          url: 'https://github.com'
        })
      );
    });

    it('should deactivate previous tab when activating new tab', async () => {
      const prevTab = {
        id: 1,
        url: 'https://example.com',
        title: 'Example',
        windowId: 1
      };
      
      const newTab = {
        id: 2,
        url: 'https://github.com',
        title: 'GitHub',
        windowId: 1
      };
      
      mockChrome.tabs.get
        .mockResolvedValueOnce(prevTab)
        .mockResolvedValueOnce(newTab);
      
      const activatedHandler = mockChrome.tabs.onActivated.addListener.mock.calls[0][0];
      
      // Simulate having an active tab
      await activatedHandler({ tabId: 1, windowId: 1 });
      jest.clearAllMocks();
      
      // Activate new tab
      await activatedHandler({ tabId: 2, windowId: 1 });
      
      expect(mockEvents.onTabDeactivated).toHaveBeenCalledWith(
        expect.objectContaining({ domain: 'example.com' })
      );
      expect(mockEvents.onTabActivated).toHaveBeenCalledWith(
        expect.objectContaining({ domain: 'github.com' })
      );
    });

    it('should not track excluded domains', async () => {
      tabTracker.destroy();
      tabTracker = new TabTracker(mockEvents, ['facebook.com']);
      
      const mockTab = {
        id: 2,
        url: 'https://facebook.com/profile',
        title: 'Facebook',
        windowId: 1
      };
      
      mockChrome.tabs.get.mockResolvedValue(mockTab);
      
      const activatedHandler = mockChrome.tabs.onActivated.addListener.mock.calls[0][0];
      await activatedHandler({ tabId: 2, windowId: 1 });
      
      expect(mockEvents.onTabActivated).not.toHaveBeenCalled();
    });
  });

  describe('Tab Updates', () => {
    beforeEach(() => {
      tabTracker = new TabTracker(mockEvents);
    });

    it('should handle tab URL updates with debouncing', async () => {
      const mockTab = {
        id: 1,
        url: 'https://github.com/new-repo',
        title: 'New Repo',
        windowId: 1
      };
      
      mockChrome.tabs.get.mockResolvedValue(mockTab);
      
      const updateHandler = mockChrome.tabs.onUpdated.addListener.mock.calls[0][0];
      
      // Trigger multiple rapid updates
      updateHandler(1, { url: 'https://github.com/new-repo' }, mockTab);
      updateHandler(1, { url: 'https://github.com/new-repo' }, mockTab);
      updateHandler(1, { url: 'https://github.com/new-repo' }, mockTab);
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Should only be called once due to debouncing
      expect(mockEvents.onTabUpdated).toHaveBeenCalledTimes(1);
    });

    it('should ignore updates for inactive tabs', async () => {
      const updateHandler = mockChrome.tabs.onUpdated.addListener.mock.calls[0][0];
      
      // Update a tab that's not active
      updateHandler(999, { url: 'https://example.com' }, { id: 999, url: 'https://example.com' });
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(mockEvents.onTabUpdated).not.toHaveBeenCalled();
    });
  });

  describe('Window Focus', () => {
    beforeEach(() => {
      tabTracker = new TabTracker(mockEvents);
    });

    it('should handle window focus changes', () => {
      const focusHandler = mockChrome.windows.onFocusChanged.addListener.mock.calls[0][0];
      
      // Lose focus
      focusHandler(mockChrome.windows.WINDOW_ID_NONE);
      expect(mockEvents.onWindowFocusChanged).toHaveBeenCalledWith(false);
      
      // Regain focus
      focusHandler(1);
      expect(mockEvents.onWindowFocusChanged).toHaveBeenCalledWith(true);
    });

    it('should not trigger duplicate focus events', () => {
      const focusHandler = mockChrome.windows.onFocusChanged.addListener.mock.calls[0][0];
      
      // Multiple focus events with same state
      focusHandler(1);
      focusHandler(1);
      focusHandler(1);
      
      // Should only trigger once (initial state is focused)
      expect(mockEvents.onWindowFocusChanged).toHaveBeenCalledTimes(0);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      tabTracker = new TabTracker(mockEvents);
    });

    it('should track performance metrics', () => {
      const metrics = tabTracker.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('initializationTime');
      expect(metrics).toHaveProperty('eventProcessingTime');
      expect(metrics.memoryUsage).toBeGreaterThan(0);
    });

    it('should update event processing time', async () => {
      const mockTab = {
        id: 1,
        url: 'https://example.com',
        windowId: 1
      };
      
      mockChrome.tabs.get.mockResolvedValue(mockTab);
      
      const activatedHandler = mockChrome.tabs.onActivated.addListener.mock.calls[0][0];
      await activatedHandler({ tabId: 1, windowId: 1 });
      
      const metrics = tabTracker.getPerformanceMetrics();
      expect(metrics.eventProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it('should report memory usage under 50MB', () => {
      const metrics = tabTracker.getPerformanceMetrics();
      expect(metrics.memoryUsage).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      tabTracker = new TabTracker(mockEvents);
    });

    it('should handle tab query errors gracefully', async () => {
      mockChrome.tabs.get.mockRejectedValue(new Error('Tab not found'));
      
      const activatedHandler = mockChrome.tabs.onActivated.addListener.mock.calls[0][0];
      
      // Should not throw
      await expect(activatedHandler({ tabId: 999, windowId: 1 })).resolves.toBeUndefined();
      expect(mockEvents.onTabActivated).not.toHaveBeenCalled();
    });

    it('should handle invalid URLs gracefully', async () => {
      const mockTab = {
        id: 1,
        url: 'invalid-url',
        windowId: 1
      };
      
      mockChrome.tabs.get.mockResolvedValue(mockTab);
      
      const activatedHandler = mockChrome.tabs.onActivated.addListener.mock.calls[0][0];
      await activatedHandler({ tabId: 1, windowId: 1 });
      
      // Should handle gracefully and not crash
      expect(mockEvents.onTabActivated).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      tabTracker = new TabTracker(mockEvents);
    });

    it('should remove event listeners on destroy', () => {
      tabTracker.destroy();
      
      expect(mockChrome.tabs.onActivated.removeListener).toHaveBeenCalled();
      expect(mockChrome.tabs.onUpdated.removeListener).toHaveBeenCalled();
      expect(mockChrome.windows.onFocusChanged.removeListener).toHaveBeenCalled();
    });

    it('should handle tab removal events', async () => {
      // Set up active tab
      const activatedHandler = mockChrome.tabs.onActivated.addListener.mock.calls[0][0];
      await activatedHandler({ tabId: 1, windowId: 1 });
      
      // Remove the tab
      const removedHandler = mockChrome.tabs.onRemoved.addListener.mock.calls[0][0];
      await removedHandler(1);
      
      expect(mockEvents.onTabDeactivated).toHaveBeenCalled();
    });
  });

  describe('Tracking State', () => {
    beforeEach(() => {
      tabTracker = new TabTracker(mockEvents);
    });

    it('should provide current tracking state', () => {
      const state = tabTracker.getTrackingState();
      
      expect(state).toHaveProperty('activeTabId');
      expect(state).toHaveProperty('activeWindowId');
      expect(state).toHaveProperty('isWindowFocused');
      expect(state).toHaveProperty('excludedDomains');
      expect(Array.isArray(state.excludedDomains)).toBe(true);
    });

    it('should update excluded domains', () => {
      const newDomains = ['example.com', 'test.com'];
      tabTracker.updateExcludedDomains(newDomains);
      
      const state = tabTracker.getTrackingState();
      expect(state.excludedDomains).toEqual(newDomains);
    });
  });
});