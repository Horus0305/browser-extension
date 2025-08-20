import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Globe, 
  TrendingUp, 
  Activity,
  Calendar,
  Target
} from "lucide-react";
import { formatHoursMinutes } from "@/lib/time-utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

function StatsCard({ title, value, subtitle, icon: Icon, trend, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? formatHoursMinutes(value) : value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
      </div>
    </Card>
  );
}

interface OverviewStatsProps {
  todayTime: number;
  weekTime: number;
  activeWebsites: number;
  totalSessions: number;
  isLoading?: boolean;
}

export function OverviewStats({ 
  todayTime, 
  weekTime, 
  activeWebsites, 
  totalSessions, 
  isLoading = false 
}: OverviewStatsProps) {
  const stats = [
    {
      title: "Today's Usage",
      value: todayTime,
      subtitle: "Active browsing time",
      icon: Clock,
      trend: { value: 12, isPositive: false }
    },
    {
      title: "This Week",
      value: weekTime,
      subtitle: "Total time spent",
      icon: Calendar,
      trend: { value: 8, isPositive: true }
    },
    {
      title: "Active Websites",
      value: activeWebsites.toString(),
      subtitle: "Sites visited today",
      icon: Globe,
      trend: { value: 5, isPositive: true }
    },
    {
      title: "Total Sessions",
      value: totalSessions.toString(),
      subtitle: "Browsing sessions",
      icon: Activity,
      trend: { value: 3, isPositive: false }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          trend={stat.trend}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
