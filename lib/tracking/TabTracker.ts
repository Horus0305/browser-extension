/**
 * TabTracker class for monitoring active tabs and browser focus
 * Handles tab activation, updates, and window focus changes with performance monitoring
 */

import { extractDomain, shouldTrackUrl } from "../domain-utils";
import { debounce } from "../time-utils";
import {
  getWindowIdNone,
  getMemoryUsage,
  queryTabs,
  getTab,
} from "../browser-compat";
import type { TabInfo } from "../types";

// Global type extensions for cross-browser compatibility
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
    };
  }
}

export interface TabTrackerEvents {
  onTabActivated: (tabInfo: TabInfo) => void;
  onTabDeactivated: (tabInfo: TabInfo) => void;
  onWindowFocusChanged: (focused: boolean) => void;
  onTabUpdated: (tabInfo: TabInfo) => void;
}

export interface PerformanceMetrics {
  memoryUsage: number; // in MB
  initializationTime: number; // in ms
  eventProcessingTime: number; // in ms
  activeTimers: number;
}

export class TabTracker {
  private activeTabId: number | null = null;
  private activeWindowId: number | null = null;
  private isWindowFocused: boolean = true;
  private excludedDomains: string[] = [];
  private events: TabTrackerEvents;
  private performanceMetrics: PerformanceMetrics;
  private initStartTime: number;

  // Debounced update handler to prevent excessive processing
  private debouncedTabUpdate: (
    tabId: number,
    changeInfo: any,
    tab: any
  ) => void;

  constructor(events: TabTrackerEvents, excludedDomains: string[] = []) {
    this.events = events;
    this.excludedDomains = excludedDomains;
    this.initStartTime = performance.now();

    this.performanceMetrics = {
      memoryUsage: 0,
      initializationTime: 0,
      eventProcessingTime: 0,
      activeTimers: 0,
    };

    // Create debounced tab update handler (500ms debounce)
    this.debouncedTabUpdate = debounce(this.handleTabUpdate.bind(this), 500);

    this.initialize();
  }

  /**
   * Initialize the tab tracker with event listeners
   */
  private async initialize(): Promise<void> {
    try {
      // Set up event listeners
      this.setupEventListeners();

      // Get current active tab
      await this.getCurrentActiveTab();

      // Calculate initialization time
      this.performanceMetrics.initializationTime =
        performance.now() - this.initStartTime;

      console.log("TabTracker initialized", {
        initTime: this.performanceMetrics.initializationTime,
        activeTab: this.activeTabId,
      });
    } catch (error) {
      console.error("Failed to initialize TabTracker:", error);
    }
  }

  /**
   * Set up browser event listeners
   */
  private setupEventListeners(): void {
    const browserAPI = (globalThis as any).browser || (globalThis as any).chrome;
    
    if (!browserAPI || !browserAPI.tabs) {
      console.error('Browser tabs API not available');
      return;
    }
    
    // Tab activation events
    if (browserAPI.tabs.onActivated) {
      browserAPI.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    }

    // Tab update events (URL changes, loading states)
    if (browserAPI.tabs.onUpdated) {
      browserAPI.tabs.onUpdated.addListener(this.debouncedTabUpdate);
    }

    // Window focus events
    if (browserAPI.windows && browserAPI.windows.onFocusChanged) {
      browserAPI.windows.onFocusChanged.addListener(
        this.handleWindowFocusChanged.bind(this)
      );
    }

    // Tab removal events
    if (browserAPI.tabs.onRemoved) {
      browserAPI.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    }

    // Window removal events
    if (browserAPI.windows && browserAPI.windows.onRemoved) {
      browserAPI.windows.onRemoved.addListener(this.handleWindowRemoved.bind(this));
    }
  }

  /**
   * Get the currently active tab
   */
  private async getCurrentActiveTab(): Promise<void> {
    try {
      const tabs = await queryTabs({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (activeTab && activeTab.id) {
        this.activeTabId = activeTab.id;
        this.activeWindowId = activeTab.windowId;

        const tabInfo = await this.createTabInfo(activeTab);
        if (tabInfo && this.shouldTrackTab(tabInfo)) {
          this.events.onTabActivated(tabInfo);
        }
      }
    } catch (error) {
      console.error("Failed to get current active tab:", error);
    }
  }

  /**
   * Handle tab activation events
   */
  private async handleTabActivated(
    activeInfo: any
  ): Promise<void> {
    const startTime = performance.now();

    try {
      // Deactivate previous tab if exists
      if (this.activeTabId && this.activeTabId !== activeInfo.tabId) {
        const prevTab = await this.getTabById(this.activeTabId);
        if (prevTab) {
          const prevTabInfo = await this.createTabInfo(prevTab);
          if (prevTabInfo && this.shouldTrackTab(prevTabInfo)) {
            this.events.onTabDeactivated(prevTabInfo);
          }
        }
      }

      // Activate new tab
      this.activeTabId = activeInfo.tabId;
      this.activeWindowId = activeInfo.windowId;

      const newTab = await this.getTabById(activeInfo.tabId);
      if (newTab) {
        const tabInfo = await this.createTabInfo(newTab);
        if (tabInfo && this.shouldTrackTab(tabInfo)) {
          this.events.onTabActivated(tabInfo);
        }
      }
    } catch (error) {
      console.error("Error handling tab activation:", error);
    } finally {
      this.performanceMetrics.eventProcessingTime =
        performance.now() - startTime;
    }
  }

  /**
   * Handle tab update events (debounced)
   */
  private async handleTabUpdate(
    tabId: number,
    changeInfo: any,
    tab: any
  ): Promise<void> {
    const startTime = performance.now();

    try {
      // Only process updates for the active tab
      if (tabId !== this.activeTabId) {
        return;
      }

      // Only process URL changes and loading completion
      if (!changeInfo.url && changeInfo.status !== "complete") {
        return;
      }

      const tabInfo = await this.createTabInfo(tab);
      if (tabInfo && this.shouldTrackTab(tabInfo)) {
        this.events.onTabUpdated(tabInfo);
      }
    } catch (error) {
      console.error("Error handling tab update:", error);
    } finally {
      this.performanceMetrics.eventProcessingTime =
        performance.now() - startTime;
    }
  }

  /**
   * Handle window focus changes
   */
  private handleWindowFocusChanged(windowId: number): void {
    const startTime = performance.now();

    try {
      const wasFocused = this.isWindowFocused;
      // Use cross-browser compatible WINDOW_ID_NONE
      this.isWindowFocused = windowId !== getWindowIdNone();

      // Only trigger event if focus state actually changed
      if (wasFocused !== this.isWindowFocused) {
        this.events.onWindowFocusChanged(this.isWindowFocused);
      }
    } catch (error) {
      console.error("Error handling window focus change:", error);
    } finally {
      this.performanceMetrics.eventProcessingTime =
        performance.now() - startTime;
    }
  }

  /**
   * Handle tab removal
   */
  private async handleTabRemoved(tabId: number): Promise<void> {
    try {
      if (tabId === this.activeTabId) {
        // Tab was closed, deactivate it
        const tab = {
          id: tabId,
          url: "",
          windowId: this.activeWindowId || 0,
        };
        const tabInfo = await this.createTabInfo(tab);
        if (tabInfo) {
          this.events.onTabDeactivated(tabInfo);
        }

        this.activeTabId = null;
      }
    } catch (error) {
      console.error("Error handling tab removal:", error);
    }
  }

  /**
   * Handle window removal
   */
  private handleWindowRemoved(windowId: number): void {
    try {
      if (windowId === this.activeWindowId) {
        this.activeWindowId = null;
        this.activeTabId = null;
        this.events.onWindowFocusChanged(false);
      }
    } catch (error) {
      console.error("Error handling window removal:", error);
    }
  }

  /**
   * Get tab by ID with error handling
   */
  private async getTabById(tabId: number): Promise<any> {
    return await getTab(tabId);
  }

  /**
   * Create TabInfo object from browser.tabs.Tab
   */
  private async createTabInfo(tab: any): Promise<TabInfo | null> {
    try {
      if (!tab.url || !tab.id) {
        return null;
      }

      const domain = extractDomain(tab.url);

      return {
        id: tab.id,
        url: tab.url,
        domain,
        title: tab.title,
        favicon: tab.favIconUrl,
        isActive: tab.id === this.activeTabId,
        windowId: tab.windowId || 0,
      };
    } catch (error) {
      console.error("Error creating TabInfo:", error);
      return null;
    }
  }

  /**
   * Check if a tab should be tracked
   */
  private shouldTrackTab(tabInfo: TabInfo): boolean {
    return shouldTrackUrl(tabInfo.url, this.excludedDomains);
  }

  /**
   * Update excluded domains list
   */
  public updateExcludedDomains(domains: string[]): void {
    this.excludedDomains = domains;
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    // Update memory usage using cross-browser compatible method
    this.performanceMetrics.memoryUsage = getMemoryUsage();

    return { ...this.performanceMetrics };
  }

  /**
   * Get current tracking state
   */
  public getTrackingState(): {
    activeTabId: number | null;
    activeWindowId: number | null;
    isWindowFocused: boolean;
    excludedDomains: string[];
  } {
    return {
      activeTabId: this.activeTabId,
      activeWindowId: this.activeWindowId,
      isWindowFocused: this.isWindowFocused,
      excludedDomains: [...this.excludedDomains],
    };
  }

  /**
   * Cleanup resources and remove event listeners
   */
  public destroy(): void {
    try {
      const browserAPI = (globalThis as any).browser;
      
      // Remove event listeners
      browserAPI.tabs.onActivated.removeListener(
        this.handleTabActivated.bind(this)
      );
      browserAPI.tabs.onUpdated.removeListener(this.debouncedTabUpdate);
      browserAPI.windows.onFocusChanged.removeListener(
        this.handleWindowFocusChanged.bind(this)
      );
      browserAPI.tabs.onRemoved.removeListener(this.handleTabRemoved.bind(this));
      browserAPI.windows.onRemoved.removeListener(
        this.handleWindowRemoved.bind(this)
      );

      console.log("TabTracker destroyed");
    } catch (error) {
      console.error("Error destroying TabTracker:", error);
    }
  }
}
