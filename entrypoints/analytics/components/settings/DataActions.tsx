import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Trash2, 
  RefreshCw
} from "lucide-react";

interface DataActionsProps {
  onDataChanged?: () => void;
}

function getRuntime(): any {
  return (globalThis as any).browser?.runtime || (globalThis as any).chrome?.runtime;
}

async function sendMessage<TRes = any>(msg: any): Promise<TRes> {
  const runtime = getRuntime();
  if (!runtime?.sendMessage) throw new Error("runtime messaging not available");
  const isPromiseApi = !!(globalThis as any).browser;
  return new Promise<TRes>((resolve, reject) => {
    try {
      if (isPromiseApi) {
        runtime.sendMessage(msg).then(resolve).catch(reject);
      } else {
        runtime.sendMessage(msg, (res: any) => {
          const err = (globalThis as any).chrome?.runtime?.lastError;
          if (err) reject(err);
          else resolve(res);
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

export function DataActions({ onDataChanged }: DataActionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const res = await sendMessage<{ success: boolean; data?: any; error?: string }>({ type: 'EXPORT_DATA' });
      if (res?.success) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usage-export-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        console.warn('Export failed', res?.error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to clear all usage data? This action cannot be undone.")) return;
    setIsClearing(true);
    try {
      const res = await sendMessage<{ success: boolean; error?: string }>({ type: 'RESET_DATA' });
      if (!res?.success) {
        console.warn('Reset failed', res?.error);
      }
      onDataChanged?.();
    } finally {
      setIsClearing(false);
    }
  };

  // No sync action — keep Data tab minimal

  return (
    <>
      {/* Data Actions (minimal) */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or clear your usage data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </>
  );
}
