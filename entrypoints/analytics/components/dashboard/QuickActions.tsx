import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Share2, 
  Calendar, 
  FileText,
  Settings,
  Trash2
} from "lucide-react";

export function QuickActions() {
  const handleExportData = () => {
    // TODO: Implement data export
    console.log('Exporting data...');
  };

  const handleShareReport = () => {
    // TODO: Implement report sharing
    console.log('Sharing report...');
  };

  const handleScheduleReport = () => {
    // TODO: Implement report scheduling
    console.log('Scheduling report...');
  };

  const handleClearData = () => {
    // TODO: Implement data clearing with confirmation
    console.log('Clearing data...');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Manage your data and generate reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={handleExportData}
          >
            <Download className="h-5 w-5" />
            <span className="text-sm">Export Data</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={handleShareReport}
          >
            <Share2 className="h-5 w-5" />
            <span className="text-sm">Share Report</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
            onClick={handleScheduleReport}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-sm">Schedule Report</span>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-200"
            onClick={handleClearData}
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-sm">Clear Data</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
