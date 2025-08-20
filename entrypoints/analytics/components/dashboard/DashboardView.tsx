import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewStats } from "./OverviewStats";
import { TopWebsitesChart } from "./TopWebsitesChart";
import { ActivityChart } from "./ActivityChart";
import { QuickActions } from "./QuickActions";
import type { WebsiteUsage } from "@/lib/types";
import type { Category } from "@/lib/categories";
import { formatHoursMinutes } from "@/lib/time-utils";

import { StatsCard, ProductivityChart, WeeklyTrendChart, TimeComparisonChart } from '../shared';

interface User {
  name?: string;
}

interface DashboardViewProps {
  websites: WebsiteUsage[];
  weeklyStats: { totalTime: number; totalVisits: number };
  user: User | null;
  todayTotalMs: number;
  todayWebsitesCount: number;
  daily: Array<{ date: string; totalMs: number }>;
  comparisonData?: Array<{ label: string; currentMs: number; previousMs: number }>;
}

export function DashboardView({ websites, weeklyStats, user, todayTotalMs, todayWebsitesCount, daily, comparisonData }: DashboardViewProps) {
  // HIGH-IMPACT CHARTS STRATEGY:
  // 1. TopWebsitesChart - Most actionable: shows exactly where time is spent
  // 2. TimeComparisonChart - Immediate feedback: today vs yesterday progress  
  // 3. ProductivityChart - Category overview: work vs social vs entertainment
  // 4. WeeklyTrendChart - Long-term progress: trend analysis for behavior change
  // 
  // REMOVED: AverageUsageChart (redundant), TopCategoriesChart (redundant), 
  //          SessionsChart (complex, low actionability)
  
  // Category breakdown from provided websites (weekly/range data)
  const breakdownMap = websites.reduce<Record<Category | 'uncategorized', number>>((acc, w) => {
    const cat = (w.category || 'uncategorized') as Category | 'uncategorized';
    acc[cat] = (acc[cat] || 0) + (w.timeSpent || 0);
    return acc;
  }, {} as any);
  const breakdown = Object.entries(breakdownMap)
    .map(([category, ms]) => ({ category: category as Category | 'uncategorized', ms }))
    .sort((a, b) => b.ms - a.ms);

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
          value={formatHoursMinutes(todayTotalMs)}
          subtitle="Active browsing time"
          progress={60}
          progressColor="blue"
        />
        <StatsCard
          title="This Week"
          value={formatHoursMinutes(weeklyStats.totalTime)}
          subtitle="Total time spent"
          progress={75}
          progressColor="green"
        />
        <StatsCard
          title="Active Websites"
          value={String(todayWebsitesCount)}
          subtitle="Sites visited today"
          progress={45}
          progressColor="yellow"
        />
        <StatsCard
          title="Total Sessions"
          value={String(weeklyStats.totalVisits)}
          subtitle="Browsing sessions"
          progress={80}
          progressColor="red"
        />
      </div>

      {/* High-Impact Charts Section - 4 focused, actionable charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Top Websites - Most actionable, shows exactly where time is spent */}
        <TopWebsitesChart websites={websites} />
        
        {/* Chart 2: Time Comparison - Immediate feedback on progress */}
        <TimeComparisonChart data={comparisonData} />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Productivity Breakdown - Category overview with clear value */}
        <ProductivityChart breakdown={breakdown} totalMs={weeklyStats.totalTime} />
        
        {/* Chart 4: Weekly Trend - Progress tracking over time */}
        <WeeklyTrendChart daily={daily} />
      </div>
    </div>
  );
}

