import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { StatsOverview } from "./StatsOverview";
import { WebsiteRankings } from "./WebsiteRankings";
import { BottomActions } from "./BottomActions";

import type { WebsiteUsage } from "@/lib";

interface DashboardViewProps {
  user: any;
  isAuthenticated: boolean;
  authError: string | null;
  todayWebsites: WebsiteUsage[];
  todayTotalTime: number;
  weekTotalTime: number;
  isLoading: boolean;
  onSignOut: () => void;
  onDetailedReport: () => void;
}

export function DashboardView({
  user,
  isAuthenticated,
  authError,
  todayWebsites,
  todayTotalTime,
  weekTotalTime,
  isLoading,
  onSignOut,
  onDetailedReport
}: DashboardViewProps) {
  return (
    <div className="w-96 bg-white p-4 space-y-4 min-h-[500px] flex flex-col">
      {/* Header */}
      <DashboardHeader
        isAuthenticated={isAuthenticated}
        isOnline={navigator.onLine}
        onSignOut={onSignOut}
      />

      {/* Error Alert */}
      {authError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {authError}
          </AlertDescription>
        </Alert>
      )}

      {/* Content Area - Flexible to push bottom content down */}
      <div className="flex-1 space-y-4">

        {/* Stats Overview */}
        <StatsOverview
          todayTotalTime={todayTotalTime}
          weekTotalTime={weekTotalTime}
          isLoading={isLoading}
        />

        {/* Website Rankings */}
        <WebsiteRankings 
          websites={todayWebsites}
          totalTime={todayTotalTime}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom Actions - Fixed at bottom */}
      <BottomActions
        user={user}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        onDetailedReport={onDetailedReport}
      />
    </div>
  );
}
