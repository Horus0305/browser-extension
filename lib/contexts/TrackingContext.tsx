/**
 * Tracking context for managing browser usage tracking state
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TabInfo } from '../types';
import { useBrowserTabs, useBrowserWindows, useRuntimeMessaging } from '../hooks/useBrowserAPI';
import { useAppContext } from './AppContext';
import { extractDomain, shouldTrackUrl } from '../domain-utils';
import { debounce } from '../time-utils';

interface TrackingState {
  isTracking: boolean;
  currentDomain: string | null;
  sessionStartTime: number | null;
  lastActivityTime: number;
}

interface TrackingContextValue {
  trackingState: TrackingState;
  startTracking: () => void;
  stopTracking: () => void;
  pauseTracking: () => void;
  resumeTracking: () => void;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

interface TrackingProviderProps {
  children: ReactNode;
}

export function TrackingProvider({ children }: TrackingProviderProps) {
  const { state, dispatch } = useAppContext();
  const { activeTabId, getCurrentTab } = useBrowserTabs();
  const { isFocused } = useBrowserWindows();
  const { sendMessage } = useRuntimeMessaging();
  
  const [trackingState, setTrackingState] = useState<TrackingState>({
    isTracking: false,
    currentDomain: null,
    sessionStartTime: null,
    lastActivityTime: Date.now(),
  });
  
  // Debounced function to update usage data
  const debouncedUpdateUsage = debounce((domain: string, timeSpent: number) => {
    if (timeSpent > 0) {
      dispatch({
        type: 'UPDATE_WEBSITE_USAGE',
        payload: { domain, timeSpent },
      });
    }
  }, 500);
  
  // Start tracking for a domain
  const startTrackingDomain = (domain: string) => {
    const now = Date.now();
    setTrackingState(prev => ({
      ...prev,
      isTracking: true,
      currentDomain: domain,
      sessionStartTime: now,
      lastActivityTime: now,
    }));
  };
  
  // Stop tracking and save time spent
  const stopTrackingDomain = () => {
    if (trackingState.isTracking && trackingState.currentDomain && trackingState.sessionStartTime) {
      const timeSpent = Date.now() - trackingState.sessionStartTime;
      debouncedUpdateUsage(trackingState.currentDomain, timeSpent);
    }
    
    setTrackingState(prev => ({
      ...prev,
      isTracking: false,
      currentDomain: null,
      sessionStartTime: null,
    }));
  };
  
  // Handle tab changes
  useEffect(() => {
    const handleTabChange = async () => {
      if (!state.userSettings.trackingEnabled) return;
      
      // Stop tracking current domain
      stopTrackingDomain();
      
      // Get current tab and start tracking if valid
      const currentTab = await getCurrentTab();
      if (currentTab && currentTab.url) {
        const domain = extractDomain(currentTab.url);
        
        if (shouldTrackUrl(currentTab.url, state.userSettings.excludedDomains)) {
          startTrackingDomain(domain);
          dispatch({ type: 'SET_CURRENT_TAB', payload: currentTab });
        }
      }
    };
    
    handleTabChange();
  }, [activeTabId, state.userSettings.trackingEnabled, state.userSettings.excludedDomains]);
  
  // Handle window focus changes
  useEffect(() => {
    if (!isFocused) {
      // Browser lost focus, pause tracking
      if (trackingState.isTracking) {
        stopTrackingDomain();
      }
    } else {
      // Browser gained focus, resume tracking if tab is valid
      const resumeTracking = async () => {
        if (state.userSettings.trackingEnabled) {
          const currentTab = await getCurrentTab();
          if (currentTab && currentTab.url) {
            const domain = extractDomain(currentTab.url);
            
            if (shouldTrackUrl(currentTab.url, state.userSettings.excludedDomains)) {
              startTrackingDomain(domain);
            }
          }
        }
      };
      
      resumeTracking();
    }
  }, [isFocused, state.userSettings.trackingEnabled]);
  
  // Update tracking state when settings change
  useEffect(() => {
    if (!state.userSettings.trackingEnabled && trackingState.isTracking) {
      stopTrackingDomain();
    }
    
    dispatch({ type: 'SET_TRACKING', payload: trackingState.isTracking });
  }, [state.userSettings.trackingEnabled, trackingState.isTracking]);
  
  // Periodic activity check to handle idle time
  useEffect(() => {
    const activityInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - trackingState.lastActivityTime;
      
      // If idle for more than 5 minutes, stop tracking
      if (timeSinceLastActivity > 5 * 60 * 1000 && trackingState.isTracking) {
        stopTrackingDomain();
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(activityInterval);
  }, [trackingState]);
  
  // Listen for user activity to update last activity time
  useEffect(() => {
    const updateActivity = () => {
      setTrackingState(prev => ({
        ...prev,
        lastActivityTime: Date.now(),
      }));
    };
    
    // Listen for mouse and keyboard activity
    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('keypress', updateActivity);
    document.addEventListener('click', updateActivity);
    document.addEventListener('scroll', updateActivity);
    
    return () => {
      document.removeEventListener('mousemove', updateActivity);
      document.removeEventListener('keypress', updateActivity);
      document.removeEventListener('click', updateActivity);
      document.removeEventListener('scroll', updateActivity);
    };
  }, []);
  
  // Context methods
  const startTracking = () => {
    dispatch({
      type: 'SET_USER_SETTINGS',
      payload: { ...state.userSettings, trackingEnabled: true },
    });
  };
  
  const stopTracking = () => {
    stopTrackingDomain();
    dispatch({
      type: 'SET_USER_SETTINGS',
      payload: { ...state.userSettings, trackingEnabled: false },
    });
  };
  
  const pauseTracking = () => {
    stopTrackingDomain();
  };
  
  const resumeTracking = () => {
    if (state.userSettings.trackingEnabled) {
      getCurrentTab().then(currentTab => {
        if (currentTab && currentTab.url) {
          const domain = extractDomain(currentTab.url);
          
          if (shouldTrackUrl(currentTab.url, state.userSettings.excludedDomains)) {
            startTrackingDomain(domain);
          }
        }
      });
    }
  };
  
  const contextValue: TrackingContextValue = {
    trackingState,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
  };
  
  return (
    <TrackingContext.Provider value={contextValue}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}