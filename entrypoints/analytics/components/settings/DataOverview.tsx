import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DataOverviewProps {
  storage: {
    totalBytes: number;
    websiteBytes: number;
    settingsBytes: number;
    cacheBytes: number;
    quotaBytes?: number; // optional browser quota to show denominator if available
  };
}

export function DataOverview({ storage }: DataOverviewProps) {
  const total = storage.totalBytes || 0;
  const pct = (n: number) => (total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0);
  const fmtMB = (n: number) => `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return (
    <>
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
              <span>{fmtMB(storage.websiteBytes)} ({pct(storage.websiteBytes)}%)</span>
            </div>
            <Progress value={pct(storage.websiteBytes)} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Settings & Preferences</span>
              <span>{fmtMB(storage.settingsBytes)} ({pct(storage.settingsBytes)}%)</span>
            </div>
            <Progress value={pct(storage.settingsBytes)} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Cache & Temporary Files</span>
              <span>{fmtMB(storage.cacheBytes)} ({pct(storage.cacheBytes)}%)</span>
            </div>
            <Progress value={pct(storage.cacheBytes)} className="h-2" />
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex justify-between font-medium">
              <span>Total Used</span>
              <span>{fmtMB(total)}{storage.quotaBytes ? ` of ${fmtMB(storage.quotaBytes)}` : ''}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
