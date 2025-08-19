/**
 * Privacy consent dialog using shadcn/ui Dialog and Form components
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Shield, Lock, Eye, Database, Download } from 'lucide-react';

interface PrivacyConsentDialogProps {
  isOpen: boolean;
  onAccept: (preferences: PrivacyPreferences) => void;
  onDecline: () => void;
}

export interface PrivacyPreferences {
  allowTracking: boolean;
  allowCloudSync: boolean;
  allowAnalytics: boolean;
  dataRetentionDays: number;
}

const defaultPreferences: PrivacyPreferences = {
  allowTracking: true,
  allowCloudSync: false,
  allowAnalytics: true,
  dataRetentionDays: 730, // 2 years
};

export function PrivacyConsentDialog({ 
  isOpen, 
  onAccept, 
  onDecline 
}: PrivacyConsentDialogProps) {
  const [preferences, setPreferences] = useState<PrivacyPreferences>(defaultPreferences);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Browser Usage Tracker',
      description: 'Your privacy is our priority. Let us explain how we protect your data.',
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <Shield className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Privacy First</p>
              <p className="text-sm text-green-600">All data is encrypted locally before storage</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Lock className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Zero-Knowledge Architecture</p>
              <p className="text-sm text-blue-600">We cannot access your browsing data</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <Eye className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium text-purple-800">Full Transparency</p>
              <p className="text-sm text-purple-600">You control what data is collected and stored</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Data Collection',
      description: 'Choose what data you want to track for your browsing analytics.',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.allowTracking}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  allowTracking: e.target.checked 
                }))}
                className="rounded border-gray-300"
              />
              <div>
                <p className="font-medium">Enable Usage Tracking</p>
                <p className="text-sm text-gray-600">Track time spent on websites (domain names only)</p>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.allowAnalytics}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  allowAnalytics: e.target.checked 
                }))}
                className="rounded border-gray-300"
              />
              <div>
                <p className="font-medium">Enable Analytics</p>
                <p className="text-sm text-gray-600">Generate usage trends and statistics</p>
              </div>
            </label>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <p className="font-medium">What we collect:</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Domain names (e.g., "google.com")</li>
              <li>• Time spent on each domain</li>
              <li>• Visit counts and timestamps</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p className="font-medium">What we DON'T collect:</p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Full URLs or page content</li>
              <li>• Personal information</li>
              <li>• Incognito/private browsing data</li>
              <li>• Passwords or form data</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Cloud Sync & Storage',
      description: 'Optionally sync your data across devices with end-to-end encryption.',
      content: (
        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.allowCloudSync}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                allowCloudSync: e.target.checked 
              }))}
              className="rounded border-gray-300"
            />
            <div>
              <p className="font-medium">Enable Cloud Sync</p>
              <p className="text-sm text-gray-600">Sync encrypted data across your devices</p>
            </div>
          </label>
          
          {preferences.allowCloudSync && (
            <div className="ml-6 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">Cloud Sync Features:</p>
              </div>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Data encrypted before leaving your device</li>
                <li>• Zero-knowledge architecture</li>
                <li>• Automatic sync across browsers</li>
                <li>• Secure authentication required</li>
              </ul>
            </div>
          )}
          
          <Separator />
          
          <div className="space-y-3">
            <label className="block">
              <p className="font-medium mb-2">Data Retention Period</p>
              <select
                value={preferences.dataRetentionDays}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  dataRetentionDays: parseInt(e.target.value) 
                }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value={90}>3 months</option>
                <option value={180}>6 months</option>
                <option value={365}>1 year</option>
                <option value={730}>2 years</option>
                <option value={-1}>Keep forever</option>
              </select>
              <p className="text-sm text-gray-600 mt-1">
                Older data will be automatically deleted
              </p>
            </label>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onAccept(preferences);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
            <Badge variant="outline">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          <DialogDescription className="text-base">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {currentStepData.content}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onDecline}>
              Decline
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Accept & Continue' : 'Next'}
            </Button>
          </div>
        </DialogFooter>

        {/* Progress indicator */}
        <div className="flex space-x-1 mt-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded ${
                index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}