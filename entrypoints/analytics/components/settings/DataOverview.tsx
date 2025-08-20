import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  HardDrive,
  Calendar,
  FileText,
  Database
} from "lucide-react";

interface DataOverviewProps {
  dataUsage: {
    total: string;
    websites: number;
    sessions: number;
    lastBackup: string;
  };
}

export function DataOverview({ dataUsage }: DataOverviewProps) {
  return (
    <>
      {/* Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Overview
          </CardTitle>
          <CardDescription>
            Monitor your stored data and storage usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <HardDrive className="h-6 w-6 mx-auto mb-2 text-gray-500" />
              <div className="text-xl font-bold">{dataUsage.total}</div>
              <div className="text-xs text-gray-600">Total Data</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FileText className="h-6 w-6 mx-auto mb-2 text-gray-500" />
              <div className="text-xl font-bold">{dataUsage.websites}</div>
              <div className="text-xs text-gray-600">Websites</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-gray-500" />
              <div className="text-xl font-bold">{dataUsage.sessions}</div>
              <div className="text-xs text-gray-600">Sessions</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-gray-500" />
              <div className="text-xl font-bold">{dataUsage.lastBackup}</div>
              <div className="text-xs text-gray-600">Last Backup</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>
            Monitor your local storage consumption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Website Data</span>
              <span>1.8 MB (75%)</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Settings & Preferences</span>
              <span>0.4 MB (17%)</span>
            </div>
            <Progress value={17} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Cache & Temporary Files</span>
              <span>0.2 MB (8%)</span>
            </div>
            <Progress value={8} className="h-2" />
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between font-medium">
              <span>Total Used</span>
              <span>2.4 MB of 5 MB</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
