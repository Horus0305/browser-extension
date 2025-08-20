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
}

export function ReportsView({ websites, weeklyStats }: ReportsViewProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");
  const [showExportDialog, setShowExportDialog] = useState(false);

  const totalTime = websites.reduce((sum, site) => sum + site.timeSpent, 0);
  const totalVisits = websites.reduce((sum, site) => sum + site.visitCount, 0);

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
                <WeeklyChart 
                  data={[3.2, 4.5, 5.1, 4.8, 6.2, 7.8, 5.9]}
                  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                  color="#3b82f6"
                  height={240}
                />
                <div className="flex items-center justify-between text-sm text-gray-600 pt-2">
                  <span>Peak day: Saturday (7.8h)</span>
                  <span>Average: 5.4h/day</span>
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
                <HourlyChart 
                  data={[
                    0.1, 0.1, 0.05, 0.05, 0.05, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0, 0.8,
                    0.6, 0.7, 0.9, 1.0, 0.8, 0.6, 0.4, 0.3, 0.4, 0.5, 0.3, 0.2
                  ]}
                  color="#10b981"
                  height={200}
                />
                <div className="flex items-center justify-between text-sm text-gray-600 pt-2">
                  <span>Peak hours: 10-11 AM, 3-4 PM</span>
                  <span>Least active: 2-6 AM</span>
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
              <div className="space-y-6">
                {[
                  { name: 'Development', current: 45, previous: 38, trend: 'up', color: 'blue' },
                  { name: 'Social Media', current: 25, previous: 32, trend: 'down', color: 'pink' },
                  { name: 'Entertainment', current: 20, previous: 18, trend: 'up', color: 'purple' },
                  { name: 'News', current: 10, previous: 12, trend: 'down', color: 'orange' }
                ].map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{category.current}%</span>
                        <div className={`flex items-center gap-1 text-xs ${
                          category.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {category.trend === 'up' ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(category.current - category.previous)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${
                            category.color === 'blue' ? 'from-blue-400 to-blue-500' :
                            category.color === 'pink' ? 'from-pink-400 to-pink-500' :
                            category.color === 'purple' ? 'from-purple-400 to-purple-500' :
                            'from-orange-400 to-orange-500'
                          } transition-all duration-500`}
                          style={{ width: `${category.current}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 min-w-[60px]">
                        vs {category.previous}% last week
                      </span>
                    </div>
                  </div>
                ))}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-700">65%</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Productive Time</h4>
                  <p className="text-sm text-gray-600">Work, learning, development</p>
                  <div className="mt-2 text-xs text-green-600 flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +8% from last week
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-orange-700">25%</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Entertainment</h4>
                  <p className="text-sm text-gray-600">Videos, gaming, social</p>
                  <div className="mt-2 text-xs text-red-600 flex items-center justify-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    -3% from last week
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-700">10%</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Information</h4>
                  <p className="text-sm text-gray-600">News, research, reading</p>
                  <div className="mt-2 text-xs text-blue-600 flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +2% from last week
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900 mb-1">Productivity Insight</h5>
                    <p className="text-sm text-blue-800">
                      Your productive browsing time has increased by 8% this week! You're spending more time on 
                      development and learning resources. Keep up the great work!
                    </p>
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
