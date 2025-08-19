/**
 * React hook for data export functionality in JSON and CSV formats
 */

import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useUsageData } from './useUsageData';
import { WebsiteUsage, DailyUsage, UsageData } from '../types';
import { formatTime } from '../time-utils';

export interface ExportOptions {
  includePersonalData?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  format: 'json' | 'csv';
  filename?: string;
}

export function useDataExport() {
  const { state } = useAppContext();
  const { getTopWebsites, getUsageForDateRange } = useUsageData();

  /**
   * Exports usage data in JSON format
   */
  const exportAsJSON = useCallback((options: Partial<ExportOptions> = {}): string => {
    const { includePersonalData = true, dateRange } = options;
    
    let exportData: any = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      settings: {
        trackingEnabled: state.userSettings.trackingEnabled,
        workModeEnabled: state.userSettings.workModeEnabled,
        dataRetentionDays: state.userSettings.dataRetentionDays,
      },
    };

    if (includePersonalData) {
      if (dateRange) {
        // Export data for specific date range
        const startDate = dateRange.start.toISOString().split('T')[0];
        const endDate = dateRange.end.toISOString().split('T')[0];
        
        const filteredDailyStats: Record<string, any> = {};
        Object.entries(state.usageData.dailyStats).forEach(([date, usage]) => {
          if (date >= startDate && date <= endDate) {
            filteredDailyStats[date] = {
              ...usage,
              websites: Object.fromEntries(usage.websites),
            };
          }
        });
        
        exportData.usageData = {
          dateRange: { start: startDate, end: endDate },
          dailyStats: filteredDailyStats,
        };
      } else {
        // Export all data
        exportData.usageData = {
          totalTime: state.usageData.totalTime,
          websites: state.usageData.websites,
          dailyStats: Object.fromEntries(
            Object.entries(state.usageData.dailyStats).map(([date, usage]) => [
              date,
              {
                ...usage,
                websites: Object.fromEntries(usage.websites),
              },
            ])
          ),
        };
      }
    }

    return JSON.stringify(exportData, null, 2);
  }, [state.usageData, state.userSettings]);

  /**
   * Exports usage data in CSV format
   */
  const exportAsCSV = useCallback((options: Partial<ExportOptions> = {}): string => {
    const { includePersonalData = true, dateRange } = options;
    
    if (!includePersonalData) {
      return 'Export,Date,Note\n"Data Export","' + new Date().toISOString() + '","Personal data excluded per user preference"';
    }

    const websites = getTopWebsites();
    let csvData: string[][] = [];

    // Headers
    const headers = [
      'Domain',
      'Total Time (minutes)',
      'Total Time (formatted)',
      'Visit Count',
      'Last Visited',
      'Average Session (minutes)',
      'Percentage of Total Time'
    ];
    csvData.push(headers);

    // Calculate total time for percentage calculation
    const totalTime = state.usageData.totalTime;

    // Website data
    websites.forEach(website => {
      const timeInMinutes = Math.round(website.timeSpent / (1000 * 60));
      const averageSession = website.visitCount > 0 
        ? Math.round(website.timeSpent / (1000 * 60) / website.visitCount)
        : 0;
      const percentage = totalTime > 0 
        ? ((website.timeSpent / totalTime) * 100).toFixed(2)
        : '0.00';

      csvData.push([
        website.domain,
        timeInMinutes.toString(),
        formatTime(website.timeSpent),
        website.visitCount.toString(),
        website.lastVisited.toISOString(),
        averageSession.toString(),
        percentage + '%'
      ]);
    });

    // Add summary row
    csvData.push([]);
    csvData.push(['Summary', '', '', '', '', '', '']);
    csvData.push(['Total Time', Math.round(totalTime / (1000 * 60)).toString(), formatTime(totalTime), '', '', '', '100.00%']);
    csvData.push(['Total Websites', websites.length.toString(), '', '', '', '', '']);
    csvData.push(['Export Date', new Date().toISOString(), '', '', '', '', '']);

    // Convert to CSV string
    return csvData
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }, [getTopWebsites, state.usageData.totalTime]);

  /**
   * Exports daily usage data in CSV format
   */
  const exportDailyUsageAsCSV = useCallback((days: number = 30): string => {
    const dailyUsage = getUsageForDateRange(days);
    
    let csvData: string[][] = [];
    
    // Headers
    const headers = [
      'Date',
      'Total Time (minutes)',
      'Total Time (formatted)',
      'Session Count',
      'Unique Websites',
      'Top Website',
      'Top Website Time (minutes)'
    ];
    csvData.push(headers);

    // Daily data
    dailyUsage.forEach(day => {
      const timeInMinutes = Math.round(day.totalTime / (1000 * 60));
      const websites = Array.from(day.websites.values());
      const topWebsite = websites.reduce((prev, current) => 
        (prev.timeSpent > current.timeSpent) ? prev : current
      , websites[0] || null);

      csvData.push([
        day.date,
        timeInMinutes.toString(),
        formatTime(day.totalTime),
        day.sessionCount.toString(),
        websites.length.toString(),
        topWebsite?.domain || '',
        topWebsite ? Math.round(topWebsite.timeSpent / (1000 * 60)).toString() : '0'
      ]);
    });

    // Add summary
    csvData.push([]);
    csvData.push(['Summary', '', '', '', '', '', '']);
    const totalDailyTime = dailyUsage.reduce((sum, day) => sum + day.totalTime, 0);
    const averageDailyTime = dailyUsage.length > 0 ? totalDailyTime / dailyUsage.length : 0;
    
    csvData.push(['Period Total', Math.round(totalDailyTime / (1000 * 60)).toString(), formatTime(totalDailyTime), '', '', '', '']);
    csvData.push(['Daily Average', Math.round(averageDailyTime / (1000 * 60)).toString(), formatTime(averageDailyTime), '', '', '', '']);
    csvData.push(['Export Date', new Date().toISOString(), '', '', '', '', '']);

    return csvData
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }, [getUsageForDateRange]);

  /**
   * Downloads exported data as a file
   */
  const downloadExport = useCallback((data: string, filename: string, mimeType: string) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Exports and downloads data in the specified format
   */
  const exportAndDownload = useCallback((options: ExportOptions) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = options.filename || `browser-usage-${timestamp}`;
    
    let data: string;
    let filename: string;
    let mimeType: string;

    if (options.format === 'json') {
      data = exportAsJSON(options);
      filename = `${baseFilename}.json`;
      mimeType = 'application/json';
    } else {
      data = exportAsCSV(options);
      filename = `${baseFilename}.csv`;
      mimeType = 'text/csv';
    }

    downloadExport(data, filename, mimeType);
  }, [exportAsJSON, exportAsCSV, downloadExport]);

  /**
   * Exports daily usage data and downloads as CSV
   */
  const exportDailyUsageAndDownload = useCallback((days: number = 30, filename?: string) => {
    const data = exportDailyUsageAsCSV(days);
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = filename || `daily-usage-${days}days-${timestamp}.csv`;
    
    downloadExport(data, finalFilename, 'text/csv');
  }, [exportDailyUsageAsCSV, downloadExport]);

  /**
   * Gets export statistics
   */
  const getExportStats = useCallback(() => {
    const websites = getTopWebsites();
    const totalWebsites = websites.length;
    const totalTime = state.usageData.totalTime;
    const dailyStatsCount = Object.keys(state.usageData.dailyStats).length;
    
    // Calculate date range
    const dates = Object.keys(state.usageData.dailyStats).sort();
    const dateRange = dates.length > 0 ? {
      start: dates[0],
      end: dates[dates.length - 1]
    } : null;

    return {
      totalWebsites,
      totalTime,
      dailyStatsCount,
      dateRange,
      estimatedJsonSize: Math.round(JSON.stringify(state.usageData).length / 1024), // KB
      estimatedCsvSize: Math.round(exportAsCSV().length / 1024), // KB
    };
  }, [getTopWebsites, state.usageData, exportAsCSV]);

  return {
    exportAsJSON,
    exportAsCSV,
    exportDailyUsageAsCSV,
    exportAndDownload,
    exportDailyUsageAndDownload,
    downloadExport,
    getExportStats,
  };
}