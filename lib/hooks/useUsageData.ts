/**
 * React hook for managing usage data operations
 */

import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { WebsiteUsage, DailyUsage } from '../types';
import { getCurrentDateString, getDateRange } from '../time-utils';
import { validateWebsiteUsage, validateDailyUsage } from '../validation';

export function useUsageData() {
  const { state, dispatch } = useAppContext();
  
  // Get website usage data sorted by time spent
  const getTopWebsites = useCallback((limit?: number): WebsiteUsage[] => {
    const websites = Object.values(state.usageData.websites)
      .filter(validateWebsiteUsage)
      .sort((a, b) => b.timeSpent - a.timeSpent);
    
    return limit ? websites.slice(0, limit) : websites;
  }, [state.usageData.websites]);
  
  // Get usage data for a specific date
  const getDailyUsage = useCallback((date: string): DailyUsage | null => {
    const dailyData = state.usageData.dailyStats[date];
    return dailyData && validateDailyUsage(dailyData) ? dailyData : null;
  }, [state.usageData.dailyStats]);
  
  // Get usage data for a date range
  const getUsageForDateRange = useCallback((days: number): DailyUsage[] => {
    const dateRange = getDateRange(days);
    return dateRange
      .map(date => getDailyUsage(date))
      .filter((usage): usage is DailyUsage => usage !== null);
  }, [getDailyUsage]);
  
  // Get total time for today
  const getTodayTotalTime = useCallback((): number => {
    const today = getCurrentDateString();
    const todayUsage = getDailyUsage(today);
    console.log('getTodayTotalTime:', { today, todayUsage, totalTime: todayUsage?.totalTime || 0 });
    return todayUsage?.totalTime || 0;
  }, [getDailyUsage]);
  
  // Get website usage for today
  const getTodayWebsites = useCallback((): WebsiteUsage[] => {
    const today = getCurrentDateString();
    const todayUsage = getDailyUsage(today);
    
    console.log('getTodayWebsites:', { today, todayUsage, hasWebsites: todayUsage?.websites?.size });
    
    if (!todayUsage) return [];
    
    return Array.from(todayUsage.websites.values())
      .filter(validateWebsiteUsage)
      .sort((a, b) => b.timeSpent - a.timeSpent);
  }, [getDailyUsage]);
  
  // Add time to a website
  const addWebsiteTime = useCallback((domain: string, timeSpent: number) => {
    if (timeSpent <= 0) return;
    
    dispatch({
      type: 'UPDATE_WEBSITE_USAGE',
      payload: { domain, timeSpent },
    });
  }, [dispatch]);
  
  // Clear all usage data
  const clearAllData = useCallback(() => {
    dispatch({ type: 'RESET_DATA' });
  }, [dispatch]);
  
  // Get usage statistics
  const getUsageStats = useCallback(() => {
    const websites = getTopWebsites();
    const totalTime = state.usageData.totalTime;
    const totalWebsites = websites.length;
    const todayTime = getTodayTotalTime();
    
    // Calculate average daily usage for the past 7 days
    const weeklyUsage = getUsageForDateRange(7);
    const averageDailyTime = weeklyUsage.length > 0
      ? weeklyUsage.reduce((sum, day) => sum + day.totalTime, 0) / weeklyUsage.length
      : 0;
    
    // Find most visited website
    const mostVisitedWebsite = websites.reduce((prev, current) => 
      (prev.visitCount > current.visitCount) ? prev : current
    , websites[0] || null);
    
    // Find longest session website
    const longestSessionWebsite = websites.reduce((prev, current) => 
      (prev.timeSpent > current.timeSpent) ? prev : current
    , websites[0] || null);
    
    return {
      totalTime,
      totalWebsites,
      todayTime,
      averageDailyTime,
      mostVisitedWebsite,
      longestSessionWebsite,
      weeklyUsage,
    };
  }, [state.usageData.totalTime, getTopWebsites, getTodayTotalTime, getUsageForDateRange]);
  
  // Export data in JSON format
  const exportDataAsJSON = useCallback((): string => {
    return JSON.stringify(state.usageData, null, 2);
  }, [state.usageData]);
  
  // Export data in CSV format
  const exportDataAsCSV = useCallback((): string => {
    const websites = getTopWebsites();
    const headers = ['Domain', 'Time Spent (minutes)', 'Visit Count', 'Last Visited'];
    const rows = websites.map(website => [
      website.domain,
      Math.round(website.timeSpent / (1000 * 60)).toString(),
      website.visitCount.toString(),
      website.lastVisited.toISOString(),
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }, [getTopWebsites]);
  
  return {
    // Data getters
    usageData: state.usageData,
    getTopWebsites,
    getDailyUsage,
    getUsageForDateRange,
    getTodayTotalTime,
    getTodayWebsites,
    getUsageStats,
    
    // Data modifiers
    addWebsiteTime,
    clearAllData,
    
    // Export functions
    exportDataAsJSON,
    exportDataAsCSV,
    
    // State
    isLoading: state.isLoading,
    error: state.error,
  };
}