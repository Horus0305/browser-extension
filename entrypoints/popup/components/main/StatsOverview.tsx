import { Skeleton } from "@/components/ui/skeleton";
import { Clock, TrendingUp } from "lucide-react";
import { formatHoursMinutes } from "@/lib/time-utils";

interface StatsOverviewProps {
  todayTotalTime: number;
  weekTotalTime: number;
  isLoading: boolean;
}

export function StatsOverview({ todayTotalTime, weekTotalTime, isLoading }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Today</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-16" />
        ) : (
          <div className="text-lg font-semibold text-gray-900">
            {formatHoursMinutes(todayTotalTime)}
          </div>
        )}
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">This Week</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-6 w-16" />
        ) : (
          <div className="text-lg font-semibold text-gray-900">
            {formatHoursMinutes(weekTotalTime)}
          </div>
        )}
      </div>
    </div>
  );
}
