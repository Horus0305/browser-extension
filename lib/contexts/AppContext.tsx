/**
 * React context providers for global state management
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UsageData, UserSettings, SyncStatus, TabInfo } from '../types';
import { createDefaultUsageData, createDefaultUserSettings } from '../validation';
import { useBrowserStorage } from '../hooks/useBrowserAPI';
import { dataManager } from '../storage/DataManager';
import { getCurrentDateString } from '../time-utils';

// App State Interface
interface AppState {
  usageData: UsageData;
  userSettings: UserSettings;
  syncStatus: SyncStatus;
  currentTab: TabInfo | null;
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
}

// Action Types
type AppAction =
  | { type: 'SET_USAGE_DATA'; payload: UsageData }
  | { type: 'SET_USER_SETTINGS'; payload: UserSettings }
  | { type: 'SET_SYNC_STATUS'; payload: SyncStatus }
  | { type: 'SET_CURRENT_TAB'; payload: TabInfo | null }
  | { type: 'SET_TRACKING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_WEBSITE_USAGE'; payload: { domain: string; timeSpent: number } }
  | { type: 'RESET_DATA' };

// Initial State
const initialState: AppState = {
  usageData: createDefaultUsageData(),
  userSettings: createDefaultUserSettings(),
  syncStatus: {
    isOnline: navigator.onLine,
    lastSyncTime: 0,
    syncInProgress: false,
    pendingChanges: 0,
  },
  currentTab: null,
  isTracking: false,
  isLoading: true,
  error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USAGE_DATA':
      return { ...state, usageData: action.payload };
      
    case 'SET_USER_SETTINGS':
      return { ...state, userSettings: action.payload };
      
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };
      
    case 'SET_CURRENT_TAB':
      return { ...state, currentTab: action.payload };
      
    case 'SET_TRACKING':
      return { ...state, isTracking: action.payload };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'UPDATE_WEBSITE_USAGE':
      const { domain, timeSpent } = action.payload;
      console.log('UPDATE_WEBSITE_USAGE action:', { domain, timeSpent });
      
      const currentDate = getCurrentDateString();
      const updatedWebsites = { ...state.usageData.websites };
      const updatedDailyStats = { ...state.usageData.dailyStats };
      
      // Update overall websites
      if (updatedWebsites[domain]) {
        updatedWebsites[domain] = {
          ...updatedWebsites[domain],
          timeSpent: updatedWebsites[domain].timeSpent + timeSpent,
          lastVisited: new Date(),
          visitCount: updatedWebsites[domain].visitCount + 1,
        };
      } else {
        updatedWebsites[domain] = {
          domain,
          timeSpent,
          lastVisited: new Date(),
          visitCount: 1,
        };
      }
      
      // Update daily stats
      const existingDailyUsage = updatedDailyStats[currentDate];
      if (existingDailyUsage) {
        const updatedWebsitesMap = new Map(existingDailyUsage.websites);
        const existingWebsite = updatedWebsitesMap.get(domain);
        
        if (existingWebsite) {
          updatedWebsitesMap.set(domain, {
            ...existingWebsite,
            timeSpent: existingWebsite.timeSpent + timeSpent,
            lastVisited: new Date(),
            visitCount: existingWebsite.visitCount + 1,
          });
        } else {
          updatedWebsitesMap.set(domain, {
            domain,
            timeSpent,
            lastVisited: new Date(),
            visitCount: 1,
          });
        }
        
        updatedDailyStats[currentDate] = {
          ...existingDailyUsage,
          totalTime: existingDailyUsage.totalTime + timeSpent,
          websites: updatedWebsitesMap,
          sessionCount: existingDailyUsage.sessionCount + 1,
        };
      } else {
        const websitesMap = new Map();
        websitesMap.set(domain, {
          domain,
          timeSpent,
          lastVisited: new Date(),
          visitCount: 1,
        });
        
        updatedDailyStats[currentDate] = {
          date: currentDate,
          totalTime: timeSpent,
          websites: websitesMap,
          sessionCount: 1,
        };
      }
      
      const updatedState = {
        ...state,
        usageData: {
          ...state.usageData,
          totalTime: state.usageData.totalTime + timeSpent,
          websites: updatedWebsites,
          dailyStats: updatedDailyStats,
        },
      };
      
      console.log('Updated state:', {
        totalTime: updatedState.usageData.totalTime,
        websiteCount: Object.keys(updatedState.usageData.websites).length,
        todayStats: updatedState.usageData.dailyStats[currentDate]
      });
      
      return updatedState;
      
    case 'RESET_DATA':
      return {
        ...state,
        usageData: createDefaultUsageData(),
        error: null,
      };
      
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider Component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { getStorageData, setStorageData } = useBrowserStorage();
  
  // Load initial data from storage
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Initialize and load encrypted data via DataManager
        await dataManager.initialize();

        const [loadedUsageData, loadedSettings] = await Promise.all([
          dataManager.loadUsageData(),
          dataManager.loadUserSettings()
        ]);

        if (loadedUsageData) {
          console.log('Loaded usage data in AppContext:', {
            totalTime: loadedUsageData.totalTime,
            websiteCount: Object.keys(loadedUsageData.websites).length,
            dailyStatsCount: Object.keys(loadedUsageData.dailyStats).length,
            sample: loadedUsageData
          });
          dispatch({ type: 'SET_USAGE_DATA', payload: loadedUsageData });
        }

        if (loadedSettings) {
          dispatch({ type: 'SET_USER_SETTINGS', payload: loadedSettings });
        }
        
        // Load sync status
        const storedSyncStatus = await getStorageData<SyncStatus>('syncStatus');
        if (storedSyncStatus) {
          dispatch({ type: 'SET_SYNC_STATUS', payload: storedSyncStatus });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data from storage' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    loadInitialData();
  }, [getStorageData]);
  
  // Persist encrypted usage data when it changes
  useEffect(() => {
    if (!state.isLoading) {
      // Best effort; ignore failures in UI layer
      dataManager.saveUsageData(state.usageData).catch(() => {});
    }
  }, [state.usageData, state.isLoading]);
  
  useEffect(() => {
    if (!state.isLoading) {
      dataManager.saveUserSettings(state.userSettings).catch(() => {});
    }
  }, [state.userSettings, state.isLoading]);
  
  useEffect(() => {
    if (!state.isLoading) {
      setStorageData('syncStatus', state.syncStatus);
    }
  }, [state.syncStatus, state.isLoading, setStorageData]);
  
  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      dispatch({
        type: 'SET_SYNC_STATUS',
        payload: { ...state.syncStatus, isOnline: true },
      });
    };
    
    const handleOffline = () => {
      dispatch({
        type: 'SET_SYNC_STATUS',
        payload: { ...state.syncStatus, isOnline: false },
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.syncStatus]);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the App Context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}