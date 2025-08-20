import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Trash2, 
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export function DataActions() {
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
    }, 2000);
  };

  const handleClearData = async () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      setIsClearing(true);
      setTimeout(() => {
        setIsClearing(false);
      }, 1500);
    }
  };

  const handleSyncData = () => {
    console.log('Syncing data...');
  };

  return (
    <>
      {/* Data Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Actions</CardTitle>
          <CardDescription>
            Export, backup, or clear your usage data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleExportData}
              disabled={isExporting}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              {isExporting ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              <span className="text-sm">
                {isExporting ? 'Exporting...' : 'Export Data'}
              </span>
            </Button>

            <Button 
              variant="outline"
              onClick={handleSyncData}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="text-sm">Sync Data</span>
            </Button>

            <Button 
              variant="destructive"
              onClick={handleClearData}
              disabled={isClearing}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              {isClearing ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
              <span className="text-sm">
                {isClearing ? 'Clearing...' : 'Clear All Data'}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automatic Backup</CardTitle>
          <CardDescription>
            Configure automatic data backup to cloud storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Auto-Backup Enabled</h4>
                  <p className="text-sm text-blue-700">Your data is automatically backed up daily</p>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Configure Schedule</Button>
              <Button variant="outline" size="sm">View Backup History</Button>
              <Button variant="outline" size="sm">Restore from Backup</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>
            Configure how long your data is stored
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-900">Data Retention Policy</h4>
                  <p className="text-sm text-yellow-700">Data older than 1 year is automatically archived</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Current Setting:</span>
                <p className="text-gray-600">Keep data for 1 year</p>
              </div>
              <div>
                <span className="font-medium">Next Cleanup:</span>
                <p className="text-gray-600">March 15, 2025</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Change Retention Period</Button>
              <Button variant="outline" size="sm">Archive Old Data Now</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
