import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Download } from "lucide-react";
import { ExportFormatSelector } from "./ExportFormatSelector";
import { ExportContentOptions } from "./ExportContentOptions";
import type { WebsiteUsage } from "@/lib/types";

interface ExportOptionsProps {
  onClose: () => void;
  websites: WebsiteUsage[];
}

export function ExportOptions({ onClose, websites }: ExportOptionsProps) {
  const [exportFormat, setExportFormat] = useState("csv");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // TODO: Implement actual export functionality
      console.log('Exporting with options:', {
        format: exportFormat,
        includeCharts,
        includeRawData,
        includeSummary,
        websites
      });
      
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create download
      const blob = new Blob([JSON.stringify(websites, null, 2)], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Export Usage Report</h2>
            <p className="text-gray-600 text-sm">
              Export your browsing data in your preferred format
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              {websites.length} websites
            </Badge>
            <Badge variant="outline">
              Last 30 days
            </Badge>
          </div>

          <ExportFormatSelector
            selectedFormat={exportFormat}
            onFormatChange={setExportFormat}
          />

          <ExportContentOptions
            includeCharts={includeCharts}
            includeRawData={includeRawData}
            includeSummary={includeSummary}
            onChartsChange={setIncludeCharts}
            onRawDataChange={setIncludeRawData}
            onSummaryChange={setIncludeSummary}
          />
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>
    </div>
  );
}
