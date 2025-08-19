/**
 * Data export dialog component with privacy controls
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Download, 
  FileText, 
  Database, 
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useDataExport } from '../../lib/hooks/useDataExport';
import { usePrivacy } from '../../lib/contexts/PrivacyContext';
import { formatTime } from '../../lib/time-utils';

interface DataExportDialogProps {
  trigger?: React.ReactNode;
}

export function DataExportDialog({ trigger }: DataExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');
  const [includePersonalData, setIncludePersonalData] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | '30' | '90' | '365'>('all');
  
  const { 
    exportAndDownload, 
    exportDailyUsageAndDownload, 
    getExportStats 
  } = useDataExport();
  
  const { 
    privacyState, 
    exportEncryptedData 
  } = usePrivacy();

  const exportStats = getExportStats();

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Preparing export...');

    try {
      // Simulate progress for better UX
      const progressSteps = [
        { progress: 20, status: 'Collecting data...' },
        { progress: 40, status: 'Processing websites...' },
        { progress: 60, status: 'Formatting data...' },
        { progress: 80, status: 'Generating file...' },
        { progress: 100, status: 'Download ready!' },
      ];

      for (const step of progressSteps) {
        setExportProgress(step.progress);
        setExportStatus(step.status);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Determine date range
      let dateRangeOptions: any = {};
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        dateRangeOptions = {
          dateRange: { start: startDate, end: endDate }
        };
      }

      // Export data
      await exportAndDownload({
        format: selectedFormat,
        includePersonalData,
        ...dateRangeOptions,
      });

      setExportStatus('Export completed successfully!');
      
      // Close dialog after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus('');
      }, 1500);

    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed. Please try again.');
      setIsExporting(false);
    }
  };

  const handleExportEncrypted = async () => {
    setIsExporting(true);
    setExportStatus('Exporting encrypted backup...');

    try {
      const encryptedData = await exportEncryptedData();
      if (encryptedData) {
        const blob = new Blob([encryptedData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `browser-usage-encrypted-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        setExportStatus('Encrypted backup exported successfully!');
      } else {
        setExportStatus('No encrypted data available');
      }
    } catch (error) {
      console.error('Encrypted export failed:', error);
      setExportStatus('Encrypted export failed');
    }

    setTimeout(() => {
      setIsExporting(false);
      setExportStatus('');
    }, 2000);
  };

  const handleExportDailyUsage = async () => {
    setIsExporting(true);
    setExportStatus('Exporting daily usage data...');

    try {
      const days = dateRange === 'all' ? 365 : parseInt(dateRange);
      await exportDailyUsageAndDownload(days);
      setExportStatus('Daily usage exported successfully!');
    } catch (error) {
      console.error('Daily usage export failed:', error);
      setExportStatus('Daily usage export failed');
    }

    setTimeout(() => {
      setIsExporting(false);
      setExportStatus('');
    }, 2000);
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '30': return 'Last 30 days';
      case '90': return 'Last 90 days';
      case '365': return 'Last year';
      default: return 'All time';
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Export Data
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Your Data</span>
          </DialogTitle>
          <DialogDescription>
            Download your browsing data in various formats with privacy controls.
          </DialogDescription>
        </DialogHeader>

        {isExporting ? (
          <div className="space-y-4 py-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="font-medium">{exportStatus}</p>
            </div>
            <Progress value={exportProgress} className="w-full" />
          </div>
        ) : (
          <Tabs defaultValue="standard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="standard">Standard Export</TabsTrigger>
              <TabsTrigger value="daily">Daily Usage</TabsTrigger>
              <TabsTrigger value="encrypted">Encrypted Backup</TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="space-y-4">
              <div className="space-y-4">
                {/* Export Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <Database className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">{exportStats.totalWebsites}</p>
                    <p className="text-xs text-gray-600">Websites</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <Clock className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">{formatTime(exportStats.totalTime)}</p>
                    <p className="text-xs text-gray-600">Total Time</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">{exportStats.dailyStatsCount}</p>
                    <p className="text-xs text-gray-600">Days Tracked</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-center">
                    <FileText className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-sm font-medium">~{exportStats.estimatedJsonSize}KB</p>
                    <p className="text-xs text-gray-600">Est. Size</p>
                  </div>
                </div>

                <Separator />

                {/* Format Selection */}
                <div className="space-y-3">
                  <h3 className="font-medium">Export Format</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={selectedFormat === 'json' ? "default" : "outline"}
                      onClick={() => setSelectedFormat('json')}
                      className="h-auto p-4"
                    >
                      <div className="text-center">
                        <FileText className="h-5 w-5 mx-auto mb-2" />
                        <div className="font-medium">JSON</div>
                        <div className="text-xs opacity-75">Complete data structure</div>
                      </div>
                    </Button>
                    <Button
                      variant={selectedFormat === 'csv' ? "default" : "outline"}
                      onClick={() => setSelectedFormat('csv')}
                      className="h-auto p-4"
                    >
                      <div className="text-center">
                        <Database className="h-5 w-5 mx-auto mb-2" />
                        <div className="font-medium">CSV</div>
                        <div className="text-xs opacity-75">Spreadsheet compatible</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Date Range Selection */}
                <div className="space-y-3">
                  <h3 className="font-medium">Date Range</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: 'all', label: 'All Time' },
                      { value: '30', label: 'Last 30 Days' },
                      { value: '90', label: 'Last 90 Days' },
                      { value: '365', label: 'Last Year' },
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={dateRange === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDateRange(value as any)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Privacy Options */}
                <div className="space-y-3">
                  <h3 className="font-medium">Privacy Options</h3>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePersonalData}
                      onChange={(e) => setIncludePersonalData(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <p className="font-medium">Include Personal Data</p>
                      <p className="text-sm text-gray-600">Include website domains and usage statistics</p>
                    </div>
                  </label>

                  {!includePersonalData && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Export will only contain metadata and settings without personal browsing data.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {exportStats.dateRange && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Data Range:</strong> {exportStats.dateRange.start} to {exportStats.dateRange.end}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="daily" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Daily Usage Export</h3>
                  <p className="text-sm text-blue-700">
                    Export daily aggregated usage statistics in CSV format, perfect for spreadsheet analysis.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Time Period</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: '30', label: 'Last 30 Days' },
                      { value: '90', label: 'Last 90 Days' },
                      { value: '365', label: 'Last Year' },
                      { value: 'all', label: 'All Time' },
                    ].map(({ value, label }) => (
                      <Button
                        key={value}
                        variant={dateRange === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDateRange(value as any)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">
                    <strong>Selected Range:</strong> {getDateRangeLabel()}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="encrypted" className="space-y-4">
              <div className="space-y-4">
                {privacyState.isEncryptionEnabled ? (
                  <>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        <h3 className="font-medium text-green-800">Encrypted Backup Available</h3>
                      </div>
                      <p className="text-sm text-green-700">
                        Export your data as an encrypted backup that can be imported later. 
                        This backup includes all your data in encrypted form.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Backup Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• Complete data backup with encryption</li>
                        <li>• Can be imported on any device</li>
                        <li>• Requires your encryption password</li>
                        <li>• Includes metadata for verification</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-medium text-yellow-800">Encryption Not Enabled</h3>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Enable encryption in Privacy Settings to create encrypted backups of your data.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          
          {!isExporting && (
            <>
              {/* Standard Export Button */}
              <Button 
                onClick={handleExport}
                className="hidden"
                style={{ display: 'none' }}
              >
                Export {selectedFormat.toUpperCase()}
              </Button>
              
              {/* Dynamic buttons based on active tab */}
              <div className="flex space-x-2">
                <Button onClick={handleExport}>
                  Export {selectedFormat.toUpperCase()}
                </Button>
                
                <Button variant="outline" onClick={handleExportDailyUsage}>
                  Export Daily CSV
                </Button>
                
                {privacyState.isEncryptionEnabled && (
                  <Button variant="outline" onClick={handleExportEncrypted}>
                    <Shield className="h-4 w-4 mr-2" />
                    Export Encrypted
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}