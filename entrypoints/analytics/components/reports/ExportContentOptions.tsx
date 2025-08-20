import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  BarChart3,
  Table as TableIcon,
  FileText
} from "lucide-react";

interface ExportContentOptionsProps {
  includeCharts: boolean;
  includeRawData: boolean;
  includeSummary: boolean;
  onChartsChange: (value: boolean) => void;
  onRawDataChange: (value: boolean) => void;
  onSummaryChange: (value: boolean) => void;
}

export function ExportContentOptions({
  includeCharts,
  includeRawData,
  includeSummary,
  onChartsChange,
  onRawDataChange,
  onSummaryChange
}: ExportContentOptionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <div>
              <Label htmlFor="charts">Include Charts</Label>
              <p className="text-xs text-gray-500">Visual representation of data</p>
            </div>
          </div>
          <Switch
            id="charts"
            checked={includeCharts}
            onCheckedChange={onChartsChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TableIcon className="h-4 w-4 text-gray-500" />
            <div>
              <Label htmlFor="raw-data">Raw Data</Label>
              <p className="text-xs text-gray-500">Detailed usage statistics</p>
            </div>
          </div>
          <Switch
            id="raw-data"
            checked={includeRawData}
            onCheckedChange={onRawDataChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-gray-500" />
            <div>
              <Label htmlFor="summary">Summary Report</Label>
              <p className="text-xs text-gray-500">Key insights and trends</p>
            </div>
          </div>
          <Switch
            id="summary"
            checked={includeSummary}
            onCheckedChange={onSummaryChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
