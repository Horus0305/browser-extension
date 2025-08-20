import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppwriteAuth } from "@/lib/hooks/useAppwriteAuth";
import { Header, AuthRequired, LoadingView } from "./components/shared";
import { DashboardView } from "./components/dashboard";
import { ReportsView } from "./components/reports";
import { SettingsView } from "./components/settings";
import type { WebsiteUsage } from "@/lib/types";

// Dummy data for detailed analytics
const dummyDetailedData: WebsiteUsage[] = [
  {
    domain: "github.com",
    timeSpent: 25200000, // 7 hours
    lastVisited: new Date(),
    visitCount: 45
  },
  {
    domain: "stackoverflow.com",
    timeSpent: 18000000, // 5 hours
    lastVisited: new Date(),
    visitCount: 32
  },
  {
    domain: "youtube.com",
    timeSpent: 14400000, // 4 hours
    lastVisited: new Date(),
    visitCount: 28
  },
  {
    domain: "twitter.com",
    timeSpent: 10800000, // 3 hours
    lastVisited: new Date(),
    visitCount: 52
  },
  {
    domain: "reddit.com",
    timeSpent: 7200000, // 2 hours
    lastVisited: new Date(),
    visitCount: 18
  },
  {
    domain: "linkedin.com",
    timeSpent: 5400000, // 1.5 hours
    lastVisited: new Date(),
    visitCount: 12
  },
  {
    domain: "medium.com",
    timeSpent: 3600000, // 1 hour
    lastVisited: new Date(),
    visitCount: 8
  },
  {
    domain: "dev.to",
    timeSpent: 2700000, // 45 minutes
    lastVisited: new Date(),
    visitCount: 6
  }
];

const dummyWeeklyStats = {
  totalTime: 518400000, // About 144 hours
  totalVisits: 234,
  averageSessionTime: 2214285, // ~37 minutes
  mostActiveDay: "Tuesday"
};

function App() {
  // Main analytics app component
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, isAuthenticated, isLoading, signOut, error: authError } = useAppwriteAuth();

  // Transform data to match expected interface
  const websiteData = dummyDetailedData.map(site => ({
    url: site.domain,
    timeSpent: site.timeSpent,
    visits: site.visitCount
  }));

  if (isLoading) {
    return <LoadingView />;
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Fixed Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col fixed h-full">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Usage Tracker</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="w-full flex items-center justify-start gap-3 h-11 px-3"
              onClick={() => setActiveTab("dashboard")}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="text-sm font-medium">Dashboard</span>
            </Button>
            
            <Button
              variant={activeTab === "reports" ? "default" : "ghost"}
              className="w-full flex items-center justify-start gap-3 h-11 px-3"
              onClick={() => setActiveTab("reports")}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span className="text-sm font-medium">Reports</span>
            </Button>
            
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full flex items-center justify-start gap-3 h-11 px-3"
              onClick={() => setActiveTab("settings")}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Settings</span>
            </Button>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-border mt-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name || 'Aniket'}
                </p>
                <p className="text-xs text-muted-foreground">Free Account</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full flex items-center justify-start gap-2 h-9 px-3"
              onClick={signOut}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - with left margin to account for fixed sidebar */}
      <div className="flex-1 ml-64 overflow-auto bg-background">
        <main className="p-6">
          {activeTab === "dashboard" && (
            <DashboardView 
              websites={websiteData}
              weeklyStats={dummyWeeklyStats}
              user={user}
            />
          )}

          {activeTab === "reports" && (
            <ReportsView 
              websites={dummyDetailedData}
              weeklyStats={dummyWeeklyStats}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView user={user} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
