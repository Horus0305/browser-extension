import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock
} from "lucide-react";
import { formatHoursMinutes } from "@/lib/time-utils";
import { DetailedReportTable } from "./DetailedReportTable";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { ExportOptions } from "./ExportOptions";
import { WeeklyChart } from "../shared/WeeklyChart";
import { HourlyChart } from "../shared/HourlyChart";
import type { WebsiteUsage } from "@/lib/types";

interface ReportsViewProps {
  websites: WebsiteUsage[];
  weeklyStats: {
    totalTime: number;
    totalVisits: number;
    averageSessionTime: number;
    mostActiveDay: string;
  };
  daily?: Array<{ date: string; totalMs: number }>;
}

export function ReportsView({ websites, weeklyStats, daily }: ReportsViewProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");
  const [showExportDialog, setShowExportDialog] = useState(false);

  const totalTime = websites.reduce((sum, site) => sum + site.timeSpent, 0);
  const totalVisits = websites.reduce((sum, site) => sum + site.visitCount, 0);

  // Weekly trends data derived from daily range usage
  const minDaysRequired = 3;
  const weeklyLabels: string[] = Array.isArray(daily)
    ? daily.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }))
    : [];
  const weeklyHours: number[] = Array.isArray(daily)
    ? daily.map(d => d.totalMs / (1000 * 60 * 60))
    : [];
  const nonZeroCount = weeklyHours.filter(h => h > 0).length;
  const hasWeeklyData = nonZeroCount >= minDaysRequired;
  const peakInfo = hasWeeklyData && weeklyHours.length
    ? (() => {
        let idx = 0; let max = -1;
        weeklyHours.forEach((h, i) => { if (h > max) { max = h; idx = i; } });
        return { label: weeklyLabels[idx], hours: weeklyHours[idx] };
      })()
    : null;
  const avgHours = hasWeeklyData && weeklyHours.length
    ? weeklyHours.reduce((a, b) => a + b, 0) / weeklyHours.length
    : 0;
  const daysNeeded = Math.max(0, minDaysRequired - nonZeroCount);

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detailed Reports</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis of your browsing patterns
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <TimeRangeSelector 
            value={selectedTimeRange}
            onChange={setSelectedTimeRange}
          />
          <Button
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHoursMinutes(totalTime)}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">+12% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{websites.length}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-600">Unique domains visited</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHoursMinutes(totalTime / totalVisits)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-gray-600">Per website visit</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="detailed" className="space-y-4">
        <div className="border-b border-gray-200">
          <TabsList className="bg-transparent h-auto p-0 space-x-8">
            <TabsTrigger 
              value="detailed" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-3 pt-0 font-medium text-gray-600 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Detailed View
            </TabsTrigger>
            <TabsTrigger 
              value="summary"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-3 pt-0 font-medium text-gray-600 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger 
              value="trends"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-3 pt-0 font-medium text-gray-600 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Trends
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Website Usage Details</CardTitle>
                  <CardDescription>
                    Complete breakdown of time spent on each website
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {selectedTimeRange === "week" ? "This Week" : 
                   selectedTimeRange === "month" ? "This Month" : "Today"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DetailedReportTable websites={websites} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Summary</CardTitle>
              <CardDescription>
                High-level overview of your browsing patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Most Active Day</h4>
                    <p className="text-2xl font-bold">{weeklyStats.mostActiveDay}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Total Sessions</h4>
                    <p className="text-2xl font-bold">{totalVisits}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Top Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Development (45%)</Badge>
                    <Badge>Social Media (25%)</Badge>
                    <Badge>Entertainment (20%)</Badge>
                    <Badge>News (10%)</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Weekly Usage Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Weekly Usage Pattern
              </CardTitle>
              <CardDescription>
                Your browsing activity throughout the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  {hasWeeklyData ? (
                    <WeeklyChart 
                      data={weeklyHours}
                      labels={weeklyLabels}
                      color="#3b82f6"
                      height={240}
                    />
                  ) : (
                    <div className="h-[240px] w-full rounded-md bg-muted/30" />
                  )}
                  {!hasWeeklyData && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-md">
                      <div className="text-center">
                        <div className="text-sm font-medium text-foreground">Not enough data yet</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Collect at least {minDaysRequired} non-zero days ({nonZeroCount}/{minDaysRequired}). {daysNeeded > 0 ? `${daysNeeded} more day${daysNeeded > 1 ? 's' : ''} needed.` : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 pt-2">
                  {hasWeeklyData ? (
                    <>
                      <span>Peak day: {peakInfo?.label} ({(peakInfo?.hours || 0).toFixed(1)}h)</span>
                      <span>Average: {avgHours.toFixed(1)}h/day</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">We’ll show peak day and averages once enough data is collected.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hourly Activity Pattern */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Daily Activity Pattern
              </CardTitle>
              <CardDescription>
                When you're most active online during the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <div className="h-[200px] w-full rounded-md bg-muted/30" />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-md">
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">Not enough data yet</div>
                      <div className="text-xs text-muted-foreground mt-1">Hourly pattern requires per-hour data.</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 pt-2">
                  <span className="text-xs text-muted-foreground">We’ll show peak/low hours once hourly data is available.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                Category Trends
              </CardTitle>
              <CardDescription>
                How your browsing categories have changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="h-40 w-full rounded-md bg-muted/30" />
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-md">
                  <div className="text-center">
                    <div className="text-sm font-medium text-foreground">Not enough data yet</div>
                    <div className="text-xs text-muted-foreground mt-1">Trends require multiple periods of category data.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productivity Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Productivity Insights
              </CardTitle>
              <CardDescription>
                Analysis of your productive vs leisure browsing time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="h-32 w-full rounded-md bg-muted/30" />
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-md">
                  <div className="text-center">
                    <div className="text-sm font-medium text-foreground">Not enough data yet</div>
                    <div className="text-xs text-muted-foreground mt-1">We’ll surface insights once more history is available.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportOptions 
          onClose={() => setShowExportDialog(false)}
          websites={websites}
        />
      )}
    </div>
  );
}
