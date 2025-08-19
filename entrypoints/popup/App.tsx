import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Globe, 
  TrendingUp, 
  LogOut, 
  ExternalLink,
  AlertCircle,
  Wifi,
  WifiOff
} from "lucide-react";
import { useAppwriteAuth } from "@/lib/hooks/useAppwriteAuth";
import { formatHoursMinutes } from "@/lib/time-utils";
import { LoginForm } from "./components/LoginForm";
import { WebsiteRankings } from "./components/WebsiteRankings";
import type { WebsiteUsage } from "@/lib/types";

// Dummy data for UI demonstration
const dummyWebsites: WebsiteUsage[] = [
  {
    domain: "github.com",
    timeSpent: 7200000, // 2 hours
    lastVisited: new Date(),
    visitCount: 15
  },
  {
    domain: "stackoverflow.com",
    timeSpent: 5400000, // 1.5 hours
    lastVisited: new Date(),
    visitCount: 8
  },
  {
    domain: "youtube.com",
    timeSpent: 3600000, // 1 hour
    lastVisited: new Date(),
    visitCount: 5
  },
  {
    domain: "twitter.com",
    timeSpent: 2700000, // 45 minutes
    lastVisited: new Date(),
    visitCount: 12
  },
  {
    domain: "reddit.com",
    timeSpent: 1800000, // 30 minutes
    lastVisited: new Date(),
    visitCount: 3
  }
];

const dummyTodayTotalTime = 20700000; // 5 hours 45 minutes
const dummyWeekTotalTime = 144900000; // About 40 hours

function App() {
  // Handle OAuth messages from callback page
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'OAUTH_SUCCESS') {
        // Refresh auth state - no need to manage showLoginForm anymore
        window.location.reload();
      } else if (message.type === 'OAUTH_ERROR') {
        console.error('OAuth failed:', message.error);
      }
    };

    // Listen for messages from OAuth callback
    const browserAPI = (globalThis as any).browser || (globalThis as any).chrome;
    if (browserAPI?.runtime?.onMessage) {
      browserAPI.runtime.onMessage.addListener(handleMessage);
      
      return () => {
        browserAPI.runtime.onMessage.removeListener(handleMessage);
      };
    }
  }, []);
  
  const { 
    user, 
    isAuthenticated, 
    isLoading: authLoading, 
    error: authError,
    signOut,
    clearError,
    forceRefresh
  } = useAppwriteAuth();

  // Use dummy data instead of real tracking data
  const todayWebsites = dummyWebsites;
  const todayTotalTime = dummyTodayTotalTime;
  
  const isLoading = authLoading;
  const hasError = authError;

  const handleDetailedReport = () => {
    // Open analytics page in new tab
    const browserAPI = (globalThis as any).browser || (globalThis as any).chrome;
    if (browserAPI?.tabs?.create && browserAPI?.runtime?.getURL) {
      browserAPI.tabs.create({ 
        url: browserAPI.runtime.getURL('analytics.html') 
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleLoginSuccess = async () => {
    clearError();
    // Force a refresh of authentication state to ensure UI updates
    setTimeout(() => {
      forceRefresh();
    }, 100);
  };

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="w-96 bg-white p-4 min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center mx-auto">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <div className="text-lg font-semibold text-gray-900">Usage Tracker</div>
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // If not authenticated, show only the login form
  if (!isAuthenticated) {
    return (
      <div className="w-96 bg-white p-4 min-h-[500px] flex flex-col">
        {/* Minimal Header for Login */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              Usage Tracker
            </h1>
          </div>
        </div>

        {/* Error Alert */}
        {hasError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {authError}
            </AlertDescription>
          </Alert>
        )}

        {/* Login Form - Takes full space */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm 
              onSuccess={handleLoginSuccess}
              onCancel={() => {}} // No cancel action needed since this is the default view
              showCancel={false}
            />
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="w-96 bg-white p-4 space-y-4 min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Usage Tracker
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Sync Status */}
          <div className="flex items-center gap-1">
            {navigator.onLine ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <Badge variant="secondary" className="text-xs">
                  {isAuthenticated ? 'Synced' : 'Local'}
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <Badge variant="destructive" className="text-xs">
                  Offline
                </Badge>
              </>
            )}
          </div>
          
          {/* Auth Button - Only show sign out since login is handled by default view */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 px-2"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
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
                {formatHoursMinutes(dummyWeekTotalTime)}
              </div>
            )}
          </div>
        </div>

        {/* Website Rankings */}
        <WebsiteRankings 
          websites={todayWebsites}
          totalTime={todayTotalTime}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom Actions - Fixed at bottom */}
      <div className="space-y-2 mt-auto">
        <Button 
          onClick={handleDetailedReport}
          variant="outline"
          className="w-full border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          <ExternalLink className="h-4 w-4" />
          View Detailed Report
        </Button>
        
        {isAuthenticated && user && (
          <div className="text-center text-xs text-gray-500">
            Signed in as {user.name || user.email}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
