import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewStats } from "./OverviewStats";
import { TopWebsitesChart } from "./TopWebsitesChart";
import { ActivityChart } from "./ActivityChart";
import { QuickActions } from "./QuickActions";
import type { WebsiteUsage } from "@/lib/types";

import { StatsCard, ProductivityChart, WeeklyTrendChart, TimeComparisonChart } from '../shared';

interface Website {
  url: string;
  timeSpent: number;
  visits: number;
}

interface WeeklyStats {
  totalTime: number;
  totalVisits: number;
}

interface User {
  name?: string;
}

interface DashboardViewProps {
  websites: Website[];
  weeklyStats: WeeklyStats;
  user: User | null;
}

export function DashboardView({ websites, weeklyStats, user }: DashboardViewProps) {
  // HIGH-IMPACT CHARTS STRATEGY:
  // 1. TopWebsitesChart - Most actionable: shows exactly where time is spent
  // 2. TimeComparisonChart - Immediate feedback: today vs yesterday progress  
  // 3. ProductivityChart - Category overview: work vs social vs entertainment
  // 4. WeeklyTrendChart - Long-term progress: trend analysis for behavior change
  // 
  // REMOVED: AverageUsageChart (redundant), TopCategoriesChart (redundant), 
  //          SessionsChart (complex, low actionability)
  
  // Transform website data for Chart.js TopWebsitesChart
  const topWebsitesData: WebsiteUsage[] = [
    { 
      domain: 'github.com', 
      timeSpent: 25200000, // 7 hours in milliseconds (7 * 60 * 60 * 1000)
      lastVisited: new Date(), 
      visitCount: 45 
    },
    { 
      domain: 'stackoverflow.com', 
      timeSpent: 18600000, // 5h 10m in milliseconds
      lastVisited: new Date(), 
      visitCount: 32 
    },
    { 
      domain: 'youtube.com', 
      timeSpent: 14400000, // 4 hours in milliseconds
      lastVisited: new Date(), 
      visitCount: 28 
    },
    { 
      domain: 'twitter.com', 
      timeSpent: 10800000, // 3 hours in milliseconds
      lastVisited: new Date(), 
      visitCount: 52 
    },
    { 
      domain: 'reddit.com', 
      timeSpent: 7200000, // 2 hours in milliseconds
      lastVisited: new Date(), 
      visitCount: 18 
    },
    { 
      domain: 'medium.com', 
      timeSpent: 3600000, // 1 hour in milliseconds
      lastVisited: new Date(), 
      visitCount: 12 
    },
    { 
      domain: 'dev.to', 
      timeSpent: 2700000, // 45 minutes in milliseconds
      lastVisited: new Date(), 
      visitCount: 8 
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Welcome back, {user?.name || 'Aniket'}!
        </h1>
        <p className="text-muted-foreground text-sm">
          Here's an overview of your web browsing activity.
        </p>
      </div>

      {/* Overview Stats - 4 column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Today's Usage"
          value="4h 15m"
          subtitle="Active browsing time"
          progress={60}
          progressColor="blue"
        />
        <StatsCard
          title="This Week"
          value="28h"
          subtitle="Total time spent"
          progress={75}
          progressColor="green"
        />
        <StatsCard
          title="Active Websites"
          value="18"
          subtitle="Sites visited today"
          progress={45}
          progressColor="yellow"
        />
        <StatsCard
          title="Total Sessions"
          value="234"
          subtitle="Browsing sessions"
          progress={80}
          progressColor="red"
        />
      </div>

      {/* High-Impact Charts Section - 4 focused, actionable charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Top Websites - Most actionable, shows exactly where time is spent */}
        <TopWebsitesChart websites={topWebsitesData} />
        
        {/* Chart 2: Time Comparison - Immediate feedback on progress */}
        <TimeComparisonChart />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Productivity Breakdown - Category overview with clear value */}
        <ProductivityChart />
        
        {/* Chart 4: Weekly Trend - Progress tracking over time */}
        <WeeklyTrendChart />
      </div>
    </div>
  );
}
