/**
 * Background service for browser usage tracking
 * Integrates TabTracker and TimeCalculator with performance monitoring
 */

import { TabTracker, type TabTrackerEvents } from '../lib/tracking/TabTracker';
import { TimeCalculator } from '../lib/tracking/TimeCalculator';
import { getStorageData, setStorageData, getAllWindows, logBrowserInfo } from '../lib/browser-compat';
import { dataManager } from '../lib/storage/DataManager';
import type { TabInfo, UserSession, WebsiteUsage, DailyUsage } from '../lib/types';
import { getCurrentDateString } from '../lib/time-utils';

class BackgroundService {
  private tabTracker: TabTracker | null = null;
  private timeCalculator: TimeCalculator | null = null;
  private isInitialized: boolean = false;
  private initializationStartTime: number = 0;
  private performanceMonitorInterval: NodeJS.Timeout | null = null;
  
  // Performance monitoring
  private readonly PERFORMANCE_CHECK_INTERVAL = 30 * 1000; // 30 seconds
  private readonly MAX_MEMORY_USAGE_MB = 50; // 50MB limit
  private readonly MAX_INITIALIZATION_TIME_MS = 2000; // 2 second limit

  constructor() {
    this.initializationStartTime = performance.now();
    this.initialize();
  }

  /**
   * Initialize the background service
   */
  private async initialize(): Promise<void> {
    try {
      console.log('Initializing BackgroundService...');
      
      // Log browser compatibility info
      logBrowserInfo();
      
      // Initialize DataManager first
      await dataManager.initialize();
      
      // Load user settings (for excluded domains)
      const excludedDomains = await this.loadExcludedDomains();
      
      // Initialize TimeCalculator
      this.timeCalculator = new TimeCalculator();
      
      // Initialize TabTracker with event handlers
      const events: TabTrackerEvents = {
        onTabActivated: this.handleTabActivated.bind(this),
        onTabDeactivated: this.handleTabDeactivated.bind(this),
        onWindowFocusChanged: this.handleWindowFocusChanged.bind(this),
        onTabUpdated: this.handleTabUpdated.bind(this)
      };
      
      this.tabTracker = new TabTracker(events, excludedDomains);
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      // Set up shutdown handlers
      this.setupShutdownHandlers();
      
      const initializationTime = performance.now() - this.initializationStartTime;
      this.isInitialized = true;
      
      console.log('BackgroundService initialized', {
        initializationTime: `${initializationTime.toFixed(2)}ms`,
        withinLimit: initializationTime < this.MAX_INITIALIZATION_TIME_MS
      });
      
      // Check if initialization was within performance limits
      if (initializationTime > this.MAX_INITIALIZATION_TIME_MS) {
        console.warn(`Initialization time exceeded limit: ${initializationTime}ms > ${this.MAX_INITIALIZATION_TIME_MS}ms`);
      }
      
    } catch (error) {
      console.error('Failed to initialize BackgroundService:', error);
    }
  }

  /**
   * Handle tab activation events
   */
  private handleTabActivated(tabInfo: TabInfo): void {
    try {
      console.log('Tab activated:', tabInfo.domain, 'URL:', tabInfo.url);
      
      if (this.timeCalculator) {
        this.timeCalculator.startTracking(tabInfo);
      }
      
    } catch (error) {
      console.error('Error handling tab activation:', error);
    }
  }

  /**
   * Handle tab deactivation events
   */
  private async handleTabDeactivated(tabInfo: TabInfo): Promise<void> {
    try {
      console.log('Tab deactivated:', tabInfo.domain, 'URL:', tabInfo.url);
      
      if (this.timeCalculator) {
        const elapsedTime = this.timeCalculator.stopTracking(tabInfo.domain);
        console.log(`Time spent on ${tabInfo.domain}: ${elapsedTime}ms (${Math.round(elapsedTime/1000)}s)`);
        
        // Save the updated usage data
        if (elapsedTime > 0) {
          await this.saveUsageData(tabInfo.domain, elapsedTime);
        }
      }
      
    } catch (error) {
      console.error('Error handling tab deactivation:', error);
    }
  }

  /**
   * Persist elapsed time for a domain into encrypted storage
   */
  private async saveUsageData(domain: string, elapsedTime: number): Promise<void> {
    try {
      // Load existing usage data
      const usageData = await dataManager.loadUsageData();

      // Update aggregate total time
      usageData.totalTime = (usageData.totalTime || 0) + elapsedTime;

      // Update overall website stats
      const now = new Date();
      const existingWebsite: WebsiteUsage | undefined = usageData.websites[domain] as any;
      if (existingWebsite) {
        existingWebsite.timeSpent += elapsedTime;
        existingWebsite.lastVisited = now;
        existingWebsite.visitCount += 1;
        usageData.websites[domain] = existingWebsite;
      } else {
        usageData.websites[domain] = {
          domain,
          timeSpent: elapsedTime,
          lastVisited: now,
          visitCount: 1
        } as WebsiteUsage;
      }

      // Update today's daily stats
      const today = getCurrentDateString();
      let todayUsage: DailyUsage | undefined = usageData.dailyStats[today] as any;
      if (!todayUsage) {
        todayUsage = {
          date: today,
          totalTime: 0,
          websites: new Map<string, WebsiteUsage>(),
          sessionCount: 0
        } as DailyUsage;
      }

      todayUsage.totalTime += elapsedTime;
      todayUsage.sessionCount += 1;

      const currentWebsite = todayUsage.websites.get(domain);
      if (currentWebsite) {
        currentWebsite.timeSpent += elapsedTime;
        currentWebsite.lastVisited = now;
        currentWebsite.visitCount += 1;
        todayUsage.websites.set(domain, currentWebsite);
      } else {
        todayUsage.websites.set(domain, {
          domain,
          timeSpent: elapsedTime,
          lastVisited: now,
          visitCount: 1
        });
      }

      usageData.dailyStats[today] = todayUsage;

      // Save back to storage (encrypted)
      await dataManager.saveUsageData(usageData);

      console.log('Usage data updated:', { 
        domain, 
        elapsedMs: elapsedTime, 
        totalTime: usageData.totalTime,
        websiteCount: Object.keys(usageData.websites).length,
        todayTotalTime: todayUsage.totalTime 
      });
    } catch (error) {
      console.error('Failed to save usage data:', error);
    }
  }

  /**
   * Handle window focus changes
   */
  private handleWindowFocusChanged(focused: boolean): void {
    try {
      console.log('Window focus changed:', focused);
      
      if (this.timeCalculator) {
        if (focused) {
          this.timeCalculator.resumeTracking();
        } else {
          const pausedTimes = this.timeCalculator.pauseTracking();
          console.log('Paused tracking for domains:', Array.from(pausedTimes.keys()));
        }
      }
      
    } catch (error) {
      console.error('Error handling window focus change:', error);
    }
  }

  /**
   * Handle tab update events
   */
  private handleTabUpdated(tabInfo: TabInfo): void {
    try {
      console.log('Tab updated:', tabInfo.domain);
      
      // If the domain changed, we need to switch tracking
      if (this.timeCalculator) {
        const activelyTracked = this.timeCalculator.getActivelyTrackedDomains();
        
        // Stop tracking previous domain if it's different
        for (const domain of activelyTracked) {
          if (domain !== tabInfo.domain) {
            this.timeCalculator.stopTracking(domain);
          }
        }
        
        // Start tracking new domain
        this.timeCalculator.startTracking(tabInfo);
      }
      
    } catch (error) {
      console.error('Error handling tab update:', error);
    }
  }

  /**
   * Load excluded domains from storage
   */
  private async loadExcludedDomains(): Promise<string[]> {
    try {
      const storageAPI = (globalThis as any).browser?.storage || (globalThis as any).chrome?.storage;
      if (!storageAPI) {
        console.warn('No storage API available');
        return [];
      }
      const result = await storageAPI.local.get(['userSettings']);
      return result.userSettings?.excludedDomains || [];
    } catch (error) {
      console.error('Error loading excluded domains:', error);
      return [];
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.performanceMonitorInterval = setInterval(() => {
      this.checkPerformanceMetrics();
    }, this.PERFORMANCE_CHECK_INTERVAL);
  }

  /**
   * Check performance metrics and log warnings if limits exceeded
   */
  private checkPerformanceMetrics(): void {
    try {
      if (!this.tabTracker || !this.timeCalculator) {
        return;
      }
      
      const tabTrackerMetrics = this.tabTracker.getPerformanceMetrics();
      const timeCalculatorMetrics = this.timeCalculator.getPerformanceMetrics();
      
      const totalMemoryUsage = tabTrackerMetrics.memoryUsage + timeCalculatorMetrics.memoryUsage;
      
      // Log performance metrics
      console.log('Performance metrics:', {
        totalMemoryUsage: `${totalMemoryUsage.toFixed(2)}MB`,
        tabTrackerInit: `${tabTrackerMetrics.initializationTime.toFixed(2)}ms`,
        eventProcessing: `${tabTrackerMetrics.eventProcessingTime.toFixed(2)}ms`,
        activeTimers: timeCalculatorMetrics.activeTimers,
        totalSessionTime: `${(timeCalculatorMetrics.totalSessionTime / 1000 / 60).toFixed(2)}min`
      });
      
      // Check memory usage limit
      if (totalMemoryUsage > this.MAX_MEMORY_USAGE_MB) {
        console.warn(`Memory usage exceeded limit: ${totalMemoryUsage.toFixed(2)}MB > ${this.MAX_MEMORY_USAGE_MB}MB`);
        
        // Trigger cleanup if possible
        if (this.timeCalculator) {
          console.log('Triggering memory cleanup...');
          // The TimeCalculator will handle cleanup internally
        }
      }
      
      // Check for performance issues
      if (tabTrackerMetrics.eventProcessingTime > 100) {
        console.warn(`Event processing time high: ${tabTrackerMetrics.eventProcessingTime.toFixed(2)}ms`);
      }
      
    } catch (error) {
      console.error('Error checking performance metrics:', error);
    }
  }

  /**
   * Set up shutdown handlers for graceful cleanup
   */
  private setupShutdownHandlers(): void {
    const browserAPI = (globalThis as any).browser || (globalThis as any).chrome;
    
    if (!browserAPI) {
      console.warn('Browser API not available for shutdown handlers');
      return;
    }
    
    // Handle extension shutdown
    if (browserAPI.runtime && browserAPI.runtime.onSuspend) {
      browserAPI.runtime.onSuspend.addListener(() => {
        this.shutdown();
      });
    }
    
    // Handle browser shutdown (if supported)
    if (browserAPI.windows && browserAPI.windows.onRemoved) {
      browserAPI.windows.onRemoved.addListener(async () => {
        // Check if this was the last window
        try {
          const windows = await getAllWindows();
          if (windows.length === 0) {
            this.shutdown();
          }
        } catch (error) {
          console.error('Error checking remaining windows:', error);
        }
      });
    }
  }

  /**
   * Graceful shutdown
   */
  private shutdown(): void {
    try {
      console.log('BackgroundService shutting down...');
      
      // Stop performance monitoring
      if (this.performanceMonitorInterval) {
        clearInterval(this.performanceMonitorInterval);
        this.performanceMonitorInterval = null;
      }
      
      // Get final session data before shutdown
      let finalSession: UserSession | null = null;
      if (this.timeCalculator) {
        finalSession = this.timeCalculator.shutdown();
      }
      
      // Cleanup TabTracker
      if (this.tabTracker) {
        this.tabTracker.destroy();
      }
      
      // Save final session data if available
      if (finalSession) {
        this.saveFinalSession(finalSession);
      }
      
      console.log('BackgroundService shutdown complete');
      
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  /**
   * Save final session data to storage
   */
  private async saveFinalSession(session: UserSession): Promise<void> {
    try {
      const sessionData = {
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        totalTime: session.totalTime,
        activeWebsites: Object.fromEntries(session.activeWebsites),
        timestamp: Date.now()
      };
      
      const storageAPI = (globalThis as any).browser?.storage || (globalThis as any).chrome?.storage;
      if (storageAPI) {
        await storageAPI.local.set({
          lastSession: sessionData
        });
      }
      
      console.log('Final session saved:', {
        totalTime: `${(session.totalTime / 1000 / 60).toFixed(2)}min`,
        websites: session.activeWebsites.size
      });
      
    } catch (error) {
      console.error('Error saving final session:', error);
    }
  }

  /**
   * Get current service status (for debugging)
   */
  public getStatus(): {
    isInitialized: boolean;
    initializationTime: number;
    tabTracker: any;
    timeCalculator: any;
  } {
    return {
      isInitialized: this.isInitialized,
      initializationTime: performance.now() - this.initializationStartTime,
      tabTracker: this.tabTracker?.getTrackingState(),
      timeCalculator: this.timeCalculator?.getDebugInfo()
    };
  }
}

// Initialize the background service
export default defineBackground(() => {
  const runtime = (globalThis as any).browser?.runtime || (globalThis as any).chrome?.runtime;
  const extensionId = runtime?.id || 'unknown';
  
  console.log('Browser Usage Tracker background service starting...', { 
    id: extensionId,
    timestamp: new Date().toISOString()
  });
  
  // Create and initialize the background service
  const backgroundService = new BackgroundService();
  
  // Handle OAuth callback messages
  if (runtime?.onMessage?.addListener) {
    runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
      if (message.type === 'OAUTH_SUCCESS') {
        console.log('OAuth success received in background');
        // Send message to all tabs/popups that might be listening
        runtime.sendMessage({ type: 'OAUTH_SUCCESS' }).catch(() => {
          // Ignore errors if no listeners
        });
        if (sendResponse) sendResponse({ success: true });
        return true;
      } else if (message.type === 'OAUTH_ERROR') {
        console.error('OAuth error received in background:', message.error);
        // Send message to all tabs/popups that might be listening
        runtime.sendMessage({ type: 'OAUTH_ERROR', error: message.error }).catch(() => {
          // Ignore errors if no listeners
        });
        if (sendResponse) sendResponse({ success: false, error: message.error });
        return true;
      }
      return false;
    });
  }
  
  // Expose service for debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    (globalThis as any).backgroundService = backgroundService;
  }
});
