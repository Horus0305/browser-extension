/**
 * Privacy settings component for work/personal browsing mode separation
 * and domain exclusion functionality using shadcn/ui components
 */

import React, { useState, useEffect } from 'react';
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
import { 
  Settings, 
  Shield, 
  Briefcase, 
  Home, 
  Plus, 
  X, 
  Eye, 
  EyeOff,
  Download,
  Trash2
} from 'lucide-react';
import { useAppContext } from '../../lib/contexts/AppContext';
import { UserSettings } from '../../lib/types';

interface PrivacySettingsProps {
  trigger?: React.ReactNode;
}

export function PrivacySettings({ trigger }: PrivacySettingsProps) {
  const { state, dispatch } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<UserSettings>(state.userSettings);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState('');

  // Update local settings when global settings change
  useEffect(() => {
    setLocalSettings(state.userSettings);
  }, [state.userSettings]);

  const handleSaveSettings = () => {
    dispatch({
      type: 'SET_USER_SETTINGS',
      payload: localSettings,
    });
    setIsOpen(false);
  };

  const handleAddExcludedDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    
    // Validate domain
    if (!domain) {
      setDomainError('Please enter a domain');
      return;
    }
    
    // Remove protocol and www if present
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    if (!domainRegex.test(cleanDomain)) {
      setDomainError('Please enter a valid domain (e.g., example.com)');
      return;
    }
    
    // Check if domain already exists
    if (localSettings.excludedDomains.includes(cleanDomain)) {
      setDomainError('Domain is already excluded');
      return;
    }
    
    setLocalSettings(prev => ({
      ...prev,
      excludedDomains: [...prev.excludedDomains, cleanDomain],
    }));
    
    setNewDomain('');
    setDomainError('');
  };

  const handleRemoveExcludedDomain = (domain: string) => {
    setLocalSettings(prev => ({
      ...prev,
      excludedDomains: prev.excludedDomains.filter(d => d !== domain),
    }));
  };

  const handleToggleWorkMode = () => {
    setLocalSettings(prev => ({
      ...prev,
      workModeEnabled: !prev.workModeEnabled,
    }));
  };

  const handleToggleTracking = () => {
    setLocalSettings(prev => ({
      ...prev,
      trackingEnabled: !prev.trackingEnabled,
    }));
  };

  const handleDataRetentionChange = (days: number) => {
    setLocalSettings(prev => ({
      ...prev,
      dataRetentionDays: days,
    }));
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Settings className="h-4 w-4 mr-2" />
      Privacy Settings
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy & Tracking Settings</span>
          </DialogTitle>
          <DialogDescription>
            Control how your browsing data is collected, stored, and used.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tracking" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {localSettings.trackingEnabled ? (
                    <Eye className="h-5 w-5 text-green-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">Usage Tracking</p>
                    <p className="text-sm text-gray-600">
                      {localSettings.trackingEnabled 
                        ? 'Currently tracking your browsing activity'
                        : 'Tracking is paused'
                      }
                    </p>
                  </div>
                </div>
                <Button
                  variant={localSettings.trackingEnabled ? "destructive" : "default"}
                  onClick={handleToggleTracking}
                >
                  {localSettings.trackingEnabled ? 'Pause Tracking' : 'Resume Tracking'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Browsing Mode Separation</h3>
                  <Badge variant={localSettings.workModeEnabled ? "default" : "secondary"}>
                    {localSettings.workModeEnabled ? 'Work Mode' : 'Personal Mode'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    !localSettings.workModeEnabled ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`} onClick={() => setLocalSettings(prev => ({ ...prev, workModeEnabled: false }))}>
                    <div className="flex items-center space-x-3">
                      <Home className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Personal Mode</p>
                        <p className="text-sm text-gray-600">Track all browsing activity</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    localSettings.workModeEnabled ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
                  }`} onClick={() => setLocalSettings(prev => ({ ...prev, workModeEnabled: true }))}>
                    <div className="flex items-center space-x-3">
                      <Briefcase className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Work Mode</p>
                        <p className="text-sm text-gray-600">Separate work and personal browsing</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {localSettings.workModeEnabled && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Work Mode:</strong> Only work-related domains will be tracked. 
                      Personal browsing will be excluded from analytics.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="exclusions" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">Excluded Domains</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Domains listed here will never be tracked or included in your analytics.
                </p>
                
                <div className="flex space-x-2 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter domain (e.g., example.com)"
                      value={newDomain}
                      onChange={(e) => {
                        setNewDomain(e.target.value);
                        setDomainError('');
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddExcludedDomain();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {domainError && (
                      <p className="text-sm text-red-600 mt-1">{domainError}</p>
                    )}
                  </div>
                  <Button onClick={handleAddExcludedDomain}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {localSettings.excludedDomains.length === 0 ? (
                    <p className="text-sm text-gray-500 italic p-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                      No excluded domains. Add domains above to exclude them from tracking.
                    </p>
                  ) : (
                    localSettings.excludedDomains.map((domain) => (
                      <div
                        key={domain}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-mono text-sm">{domain}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExcludedDomain(domain)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Automatic Exclusions</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Incognito/Private browsing windows</li>
                  <li>• Browser internal pages (chrome://, about:, etc.)</li>
                  <li>• Local file URLs (file://)</li>
                  <li>• Extension pages</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3">Data Retention</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose how long to keep your browsing data before automatic cleanup.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { days: 90, label: '3 months' },
                    { days: 180, label: '6 months' },
                    { days: 365, label: '1 year' },
                    { days: 730, label: '2 years' },
                  ].map(({ days, label }) => (
                    <Button
                      key={days}
                      variant={localSettings.dataRetentionDays === days ? "default" : "outline"}
                      onClick={() => handleDataRetentionChange(days)}
                      className="h-auto p-3"
                    >
                      <div className="text-center">
                        <div className="font-medium">{label}</div>
                        <div className="text-xs opacity-75">{days} days</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Data Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Download className="h-5 w-5 text-blue-600" />
                      <p className="font-medium">Export Data</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Download your browsing data in JSON or CSV format
                    </p>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">Export JSON</Button>
                      <Button variant="outline" size="sm">Export CSV</Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Trash2 className="h-5 w-5 text-red-600" />
                      <p className="font-medium text-red-800">Clear All Data</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Permanently delete all stored browsing data
                    </p>
                    <Button variant="destructive" size="sm">
                      Clear Data
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}