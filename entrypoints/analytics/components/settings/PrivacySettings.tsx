import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Globe, 
  Lock,
  UserX,
  Database,
  AlertTriangle
} from "lucide-react";

export function PrivacySettings() {
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [shareAnonymousData, setShareAnonymousData] = useState(false);
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [incognitoTracking, setIncognitoTracking] = useState(false);

  return (
    <div className="space-y-6">
      {/* Privacy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Control how your data is collected, stored, and used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <Shield className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Your Privacy is Protected</h4>
              <p className="text-sm text-green-700">
                All data is stored locally and encrypted. We never share personal information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Collection Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Data Collection</CardTitle>
          <CardDescription>
            Configure what data the extension collects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="tracking">Website Tracking</Label>
                <p className="text-xs text-gray-500">Track time spent on websites</p>
              </div>
            </div>
            <Switch
              id="tracking"
              checked={trackingEnabled}
              onCheckedChange={setTrackingEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserX className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="incognito">Incognito Mode Tracking</Label>
                <p className="text-xs text-gray-500">Track browsing in private/incognito mode</p>
              </div>
            </div>
            <Switch
              id="incognito"
              checked={incognitoTracking}
              onCheckedChange={setIncognitoTracking}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="analytics">Usage Analytics</Label>
                <p className="text-xs text-gray-500">Help improve the extension with anonymous usage data</p>
              </div>
            </div>
            <Switch
              id="analytics"
              checked={allowAnalytics}
              onCheckedChange={setAllowAnalytics}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="share-data">Anonymous Data Sharing</Label>
                <p className="text-xs text-gray-500">Share aggregated, anonymous data for research</p>
              </div>
            </div>
            <Switch
              id="share-data"
              checked={shareAnonymousData}
              onCheckedChange={setShareAnonymousData}
            />
          </div>
        </CardContent>
      </Card>

      {/* Blocked Websites */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Exclusions</CardTitle>
          <CardDescription>
            Websites excluded from tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">banking-site.com</span>
                <Badge variant="secondary" className="text-xs">Sensitive</Badge>
              </div>
              <Button variant="ghost" size="sm">Remove</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">private-workspace.com</span>
                <Badge variant="secondary" className="text-xs">Work</Badge>
              </div>
              <Button variant="ghost" size="sm">Remove</Button>
            </div>
          </div>
          
          <Button variant="outline" className="w-full mt-4">
            Add Website to Exclusions
          </Button>
        </CardContent>
      </Card>

      {/* Data Rights */}
      <Card>
        <CardHeader>
          <CardTitle>Your Data Rights</CardTitle>
          <CardDescription>
            Manage your data and privacy rights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Database className="h-5 w-5" />
              <span className="text-sm">Export My Data</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <EyeOff className="h-5 w-5" />
              <span className="text-sm">Request Deletion</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">Report Issue</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
