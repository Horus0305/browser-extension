/**
 * TimeCalculator class for managing active session timers with memory limits
 * Handles time tracking for websites and total browser usage
 */

import { getCurrentDateString } from '../time-utils';
import type { WebsiteUsage, DailyUsage, UserSession, TabInfo } from '../types';

export interface ActiveTimer {
  domain: string;
  startTime: number;
  lastUpdate: number;
}

export interface TimeCalculatorMetrics {
  activeTimers: number;
  memoryUsage: number; // in MB
  totalSessionTime: number;
  websiteCount: number;
}

export class TimeCalculator {
  private activeTimers: Map<string, ActiveTimer> = new Map();
  private sessionStartTime: number;
  private totalSessionTime: number = 0;
  private isTracking: boolean = false;
  private currentSession: UserSession | null = null;
  
  // Memory management
  private readonly MAX_ACTIVE_TIMERS = 50; // Limit to prevent memory bloat
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  // Performance monitoring
  private performanceMetrics: TimeCalculatorMetrics = {
    activeTimers: 0,
    memoryUsage: 0,
    totalSessionTime: 0,
    websiteCount: 0
  };

  constructor() {
    this.sessionStartTime = Date.now();
    this.startCleanupTimer();
    
    console.log('TimeCalculator initialized');
  }

  /**
   * Start tracking time for a specific domain
   */
  public startTracking(tabInfo: TabInfo): void {
    try {
      const now = Date.now();
      const { domain } = tabInfo;
      
      // Stop any existing timer for this domain
      this.stopTracking(domain);
      
      // Check memory limits before adding new timer
      if (this.activeTimers.size >= this.MAX_ACTIVE_TIMERS) {
        this.cleanupOldTimers();
      }
      
      // Start new timer
      const timer: ActiveTimer = {
        domain,
        startTime: now,
        lastUpdate: now
      };
      
      this.activeTimers.set(domain, timer);
      this.isTracking = true;
      
      // Update session if needed
      if (!this.currentSession) {
        this.currentSession = {
          startTime: new Date(this.sessionStartTime),
          totalTime: 0,
          activeWebsites: new Map()
        };
      }
      
      this.updateMetrics();
      
      console.log(`Started tracking: ${domain}`);
      
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  }

  /**
   * Stop tracking time for a specific domain and return the elapsed time
   */
  public stopTracking(domain: string): number {
    try {
      const timer = this.activeTimers.get(domain);
      if (!timer) {
        return 0;
      }
      
      const now = Date.now();
      const elapsedTime = now - timer.startTime;
      
      // Remove the timer
      this.activeTimers.delete(domain);
      
      // Update session data
      if (this.currentSession) {
        const currentTime = this.currentSession.activeWebsites.get(domain) || 0;
        this.currentSession.activeWebsites.set(domain, currentTime + elapsedTime);
      }
      
      // Update total session time
      this.totalSessionTime += elapsedTime;
      
      this.updateMetrics();
      
      console.log(`Stopped tracking: ${domain}, elapsed: ${elapsedTime}ms`);
      
      return elapsedTime;
      
    } catch (error) {
      console.error('Error stopping tracking:', error);
      return 0;
    }
  }

  /**
   * Stop all active tracking
   */
  public stopAllTracking(): Map<string, number> {
    const results = new Map<string, number>();
    
    try {
      for (const [domain] of this.activeTimers) {
        const elapsedTime = this.stopTracking(domain);
        results.set(domain, elapsedTime);
      }
      
      this.isTracking = false;
      
      console.log('Stopped all tracking');
      
    } catch (error) {
      console.error('Error stopping all tracking:', error);
    }
    
    return results;
  }

  /**
   * Pause tracking (e.g., when window loses focus)
   */
  public pauseTracking(): Map<string, number> {
    const pausedTimes = new Map<string, number>();
    
    try {
      const now = Date.now();
      
      for (const [domain, timer] of this.activeTimers) {
        const elapsedTime = now - timer.startTime;
        pausedTimes.set(domain, elapsedTime);
        
        // Update the timer's start time to now (effectively pausing)
        timer.startTime = now;
        timer.lastUpdate = now;
      }
      
      console.log('Paused tracking for all active timers');
      
    } catch (error) {
      console.error('Error pausing tracking:', error);
    }
    
    return pausedTimes;
  }

  /**
   * Resume tracking (e.g., when window regains focus)
   */
  public resumeTracking(): void {
    try {
      const now = Date.now();
      
      for (const [domain, timer] of this.activeTimers) {
        timer.startTime = now;
        timer.lastUpdate = now;
      }
      
      console.log('Resumed tracking for all active timers');
      
    } catch (error) {
      console.error('Error resuming tracking:', error);
    }
  }

  /**
   * Get current elapsed time for a domain without stopping the timer
   */
  public getCurrentElapsedTime(domain: string): number {
    try {
      const timer = this.activeTimers.get(domain);
      if (!timer) {
        return 0;
      }
      
      return Date.now() - timer.startTime;
      
    } catch (error) {
      console.error('Error getting elapsed time:', error);
      return 0;
    }
  }

  /**
   * Get total session time
   */
  public getTotalSessionTime(): number {
    let currentSessionTime = this.totalSessionTime;
    
    // Add time from currently active timers
    const now = Date.now();
    for (const timer of this.activeTimers.values()) {
      currentSessionTime += now - timer.startTime;
    }
    
    return currentSessionTime;
  }

  /**
   * Get current session information
   */
  public getCurrentSession(): UserSession {
    const now = new Date();
    const session: UserSession = {
      startTime: new Date(this.sessionStartTime),
      endTime: now,
      totalTime: this.getTotalSessionTime(),
      activeWebsites: new Map()
    };
    
    // Add current session data
    if (this.currentSession) {
      for (const [domain, time] of this.currentSession.activeWebsites) {
        session.activeWebsites.set(domain, time);
      }
    }
    
    // Add time from currently active timers
    const currentTime = Date.now();
    for (const [domain, timer] of this.activeTimers) {
      const elapsedTime = currentTime - timer.startTime;
      const existingTime = session.activeWebsites.get(domain) || 0;
      session.activeWebsites.set(domain, existingTime + elapsedTime);
    }
    
    return session;
  }

  /**
   * Check if currently tracking any domain
   */
  public isCurrentlyTracking(): boolean {
    return this.isTracking && this.activeTimers.size > 0;
  }

  /**
   * Get list of currently tracked domains
   */
  public getActivelyTrackedDomains(): string[] {
    return Array.from(this.activeTimers.keys());
  }

  /**
   * Clean up old or inactive timers to manage memory
   */
  private cleanupOldTimers(): void {
    try {
      const now = Date.now();
      const STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
      
      for (const [domain, timer] of this.activeTimers) {
        if (now - timer.lastUpdate > STALE_THRESHOLD) {
          console.log(`Cleaning up stale timer for: ${domain}`);
          this.stopTracking(domain);
        }
      }
      
      // If still too many timers, remove oldest ones
      if (this.activeTimers.size >= this.MAX_ACTIVE_TIMERS) {
        const sortedTimers = Array.from(this.activeTimers.entries())
          .sort(([, a], [, b]) => a.lastUpdate - b.lastUpdate);
        
        const toRemove = sortedTimers.slice(0, Math.floor(this.MAX_ACTIVE_TIMERS * 0.2));
        for (const [domain] of toRemove) {
          console.log(`Removing timer due to memory limit: ${domain}`);
          this.stopTracking(domain);
        }
      }
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldTimers();
      this.updateMetrics();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    this.performanceMetrics = {
      activeTimers: this.activeTimers.size,
      memoryUsage: this.estimateMemoryUsage(),
      totalSessionTime: this.getTotalSessionTime(),
      websiteCount: this.currentSession?.activeWebsites.size || 0
    };
  }

  /**
   * Estimate memory usage of the TimeCalculator
   */
  private estimateMemoryUsage(): number {
    try {
      // Rough estimation based on data structures
      const timerSize = 100; // bytes per timer (approximate)
      const sessionSize = this.currentSession ? 
        this.currentSession.activeWebsites.size * 150 : 0; // bytes per website entry
      
      const totalBytes = (this.activeTimers.size * timerSize) + sessionSize + 1000; // base overhead
      return totalBytes / (1024 * 1024); // Convert to MB
      
    } catch (error) {
      console.error('Error estimating memory usage:', error);
      return 0;
    }
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): TimeCalculatorMetrics {
    this.updateMetrics();
    return { ...this.performanceMetrics };
  }

  /**
   * Reset session data
   */
  public resetSession(): void {
    try {
      this.stopAllTracking();
      this.sessionStartTime = Date.now();
      this.totalSessionTime = 0;
      this.currentSession = null;
      this.updateMetrics();
      
      console.log('Session reset');
      
    } catch (error) {
      console.error('Error resetting session:', error);
    }
  }

  /**
   * Graceful shutdown - stop all tracking and cleanup
   */
  public shutdown(): UserSession | null {
    try {
      console.log('TimeCalculator shutting down...');
      
      // Stop all active tracking
      this.stopAllTracking();
      
      // Clear cleanup timer
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }
      
      // Return final session data
      const finalSession = this.getCurrentSession();
      finalSession.endTime = new Date();
      
      console.log('TimeCalculator shutdown complete');
      
      return finalSession;
      
    } catch (error) {
      console.error('Error during shutdown:', error);
      return null;
    }
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): {
    activeTimers: Array<{ domain: string; startTime: number; elapsed: number }>;
    sessionStartTime: number;
    totalSessionTime: number;
    isTracking: boolean;
    metrics: TimeCalculatorMetrics;
  } {
    const now = Date.now();
    const activeTimers = Array.from(this.activeTimers.entries()).map(([domain, timer]) => ({
      domain,
      startTime: timer.startTime,
      elapsed: now - timer.startTime
    }));
    
    return {
      activeTimers,
      sessionStartTime: this.sessionStartTime,
      totalSessionTime: this.totalSessionTime,
      isTracking: this.isTracking,
      metrics: this.getPerformanceMetrics()
    };
  }
}