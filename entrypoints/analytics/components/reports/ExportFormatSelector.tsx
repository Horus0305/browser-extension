import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  FileSpreadsheet
} from "lucide-react";

interface ExportFormat {
  id: string;
  label: string;
  icon: any;
  description: string;
}

interface ExportFormatSelectorProps {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
}

export function ExportFormatSelector({ selectedFormat, onFormatChange }: ExportFormatSelectorProps) {
  const exportFormats: ExportFormat[] = [
    { id: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Comma-separated values' },
    { id: 'json', label: 'JSON', icon: FileText, description: 'JavaScript Object Notation' },
    { id: 'pdf', label: 'PDF', icon: FileText, description: 'Formatted report' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Format</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {exportFormats.map((format) => {
            const Icon = format.icon;
            return (
              <Button
                key={format.id}
                variant={selectedFormat === format.id ? "default" : "outline"}
                className="flex items-center justify-start gap-3 h-auto p-4"
                onClick={() => onFormatChange(format.id)}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{format.label}</div>
                  <div className="text-xs text-gray-500">{format.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
