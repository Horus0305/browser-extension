import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppwriteAuth } from "@/lib/hooks/useAppwriteAuth";
import { AuthRequired, LoadingView } from "./components/shared";
import { DashboardView } from "./components/dashboard";
import { ReportsView } from "./components/reports";
import { SettingsView } from "./components/settings";
import { Pricing } from "./components/settings/Pricing";
import { Crown } from "lucide-react";
import type { WebsiteUsage } from "@/lib/types";
import type { Category } from "@/lib/categories";

type TodayUsageRes = {
  date: string;
  totalMs: number;
  websites: Array<{
    domain: string;
    timeSpent: number;
    lastVisited: number;
    visitCount: number;
    category?: Category;
  }>;
};

type RangeUsageRes = {
  totalMs: number;
  daily: Array<{ date: string; totalMs: number }>;
  domains: Array<{
    domain: string;
    timeSpent: number;
    lastVisited: number;
    visitCount: number;
    category?: Category;
  }>;
};

function App() {
  // Main analytics app component
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, isAuthenticated, isLoading, signOut } = useAppwriteAuth();
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [todayTotalMs, setTodayTotalMs] = useState(0);
  const [todayWebsitesCount, setTodayWebsitesCount] = useState(0);
  const [rangeWebsites, setRangeWebsites] = useState<WebsiteUsage[]>([]);
  const [rangeDaily, setRangeDaily] = useState<Array<{ date: string; totalMs: number }>>([]);
  const [weeklyStatsFull, setWeeklyStatsFull] = useState({
    totalTime: 0,
    totalVisits: 0,
    averageSessionTime: 0,
    mostActiveDay: "",
  });
  const [comparisonData, setComparisonData] = useState<Array<{ label: string; currentMs: number; previousMs: number }>>([]);
  // TODO: Wire isPro from Appwrite subscription status
  const [isPro, setIsPro] = useState<boolean>(false);

  function getRuntime(): any {
    return (globalThis as any).browser?.runtime || (globalThis as any).chrome?.runtime;
  }

  async function sendMessage<TRes = any>(msg: any): Promise<TRes> {
    const runtime = getRuntime();
    if (!runtime?.sendMessage) throw new Error("runtime messaging not available");
    const isPromiseApi = !!(globalThis as any).browser;
    return new Promise<TRes>((resolve, reject) => {
      try {
        if (isPromiseApi) {
          runtime.sendMessage(msg).then(resolve).catch(reject);
        } else {
          runtime.sendMessage(msg, (res: any) => {
            const err = (globalThis as any).chrome?.runtime?.lastError;
            if (err) reject(err);
            else resolve(res);
          });
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  useEffect(() => {
    // Initialize tab from URL if provided
    try {
      const params = new URLSearchParams(globalThis.location?.search || "");
      const tab = params.get("tab");
      if (tab && ["dashboard", "reports", "settings", "pricing"].includes(tab)) {
        setActiveTab(tab);
      }
    } catch {}

    let cancelled = false;
    async function fetchAnalytics() {
      try {
        setAnalyticsLoading(true);
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        const rangePromise = sendMessage<RangeUsageRes>({
          type: 'GET_RANGE_USAGE',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });
        const todayPromise = sendMessage<TodayUsageRes>({ type: 'GET_TODAY_USAGE' });

        // Helper date functions
        const startOfWeek = (d: Date) => {
          const dt = new Date(d);
          const day = dt.getDay(); // 0 Sun .. 6 Sat
          const diff = day === 0 ? -6 : 1 - day; // Monday as start of week
          dt.setDate(dt.getDate() + diff);
          dt.setHours(0, 0, 0, 0);
          return dt;
        };
        const endOfPreviousWeek = (d: Date) => {
          const sow = startOfWeek(d);
          const e = new Date(sow);
          e.setDate(sow.getDate() - 1); // Sunday of previous week
          e.setHours(0, 0, 0, 0);
          return e;
        };
        const startOfPreviousWeek = (d: Date) => {
          const ePrev = endOfPreviousWeek(d);
          const s = new Date(ePrev);
          s.setDate(ePrev.getDate() - 6);
          s.setHours(0, 0, 0, 0);
          return s;
        };
        const startOfMonth = (d: Date) => {
          const s = new Date(d.getFullYear(), d.getMonth(), 1);
          s.setHours(0, 0, 0, 0);
          return s;
        };
        const startOfPreviousMonth = (d: Date) => {
          const s = new Date(d.getFullYear(), d.getMonth() - 1, 1);
          s.setHours(0, 0, 0, 0);
          return s;
        };
        const endOfPreviousMonth = (d: Date) => {
          const e = new Date(d.getFullYear(), d.getMonth(), 0); // day 0 of current month = last day of prev month
          e.setHours(0, 0, 0, 0);
          return e;
        };

        // Build comparison range promises
        const now = new Date();
        const yesterdayStart = new Date(now);
        yesterdayStart.setDate(now.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterdayStart);

        const thisWeekStart = startOfWeek(now);
        const lastWeekStart = startOfPreviousWeek(now);
        const lastWeekEnd = endOfPreviousWeek(now);

        const thisMonthStart = startOfMonth(now);
        const lastMonthStart = startOfPreviousMonth(now);
        const lastMonthEnd = endOfPreviousMonth(now);

        const yesterdayPromise = sendMessage<RangeUsageRes>({
          type: 'GET_RANGE_USAGE',
          startDate: yesterdayStart.toISOString(),
          endDate: yesterdayEnd.toISOString(),
        });
        const thisWeekPromise = sendMessage<RangeUsageRes>({
          type: 'GET_RANGE_USAGE',
          startDate: thisWeekStart.toISOString(),
          endDate: now.toISOString(),
        });
        const lastWeekPromise = sendMessage<RangeUsageRes>({
          type: 'GET_RANGE_USAGE',
          startDate: lastWeekStart.toISOString(),
          endDate: lastWeekEnd.toISOString(),
        });
        const thisMonthPromise = sendMessage<RangeUsageRes>({
          type: 'GET_RANGE_USAGE',
          startDate: thisMonthStart.toISOString(),
          endDate: now.toISOString(),
        });
        const lastMonthPromise = sendMessage<RangeUsageRes>({
          type: 'GET_RANGE_USAGE',
          startDate: lastMonthStart.toISOString(),
          endDate: lastMonthEnd.toISOString(),
        });

        const [range, today, yesterday, thisWeek, lastWeek, thisMonth, lastMonth] = await Promise.all([
          rangePromise,
          todayPromise,
          yesterdayPromise,
          thisWeekPromise,
          lastWeekPromise,
          thisMonthPromise,
          lastMonthPromise,
        ]);
        if (cancelled) return;

        // Convert domains to WebsiteUsage with Date objects and sort by time desc
        const domains: WebsiteUsage[] = (range.domains || [])
          .map((d) => ({
            domain: d.domain,
            timeSpent: d.timeSpent,
            lastVisited: new Date(d.lastVisited),
            visitCount: d.visitCount,
            category: d.category,
          }))
          .sort((a, b) => b.timeSpent - a.timeSpent);

        const totalVisits = domains.reduce((sum, d) => sum + (d.visitCount || 0), 0);
        const totalTime = range.totalMs || domains.reduce((sum, d) => sum + d.timeSpent, 0);
        const averageSessionTime = totalVisits ? Math.floor(totalTime / totalVisits) : 0;
        const mostActiveDay = (() => {
          const daily = range.daily || [];
          if (!daily.length) return '';
          const maxDay = daily.reduce((acc, cur) => (cur.totalMs > acc.totalMs ? cur : acc), daily[0]);
          const d = new Date(maxDay.date);
          return d.toLocaleDateString('en-US', { weekday: 'long' });
        })();

        setRangeWebsites(domains);
        setRangeDaily(range.daily || []);
        setWeeklyStatsFull({ totalTime, totalVisits, averageSessionTime, mostActiveDay });
        setTodayTotalMs(today.totalMs || 0);
        setTodayWebsitesCount((today.websites || []).length);

        // Build comparison data
        const comp: Array<{ label: string; currentMs: number; previousMs: number }> = [
          { label: 'Today', currentMs: today.totalMs || 0, previousMs: yesterday.totalMs || 0 },
          { label: 'This Week', currentMs: thisWeek.totalMs || 0, previousMs: lastWeek.totalMs || 0 },
          { label: 'This Month', currentMs: thisMonth.totalMs || 0, previousMs: lastMonth.totalMs || 0 },
        ];
        setComparisonData(comp);
      } catch (e) {
        // minimal fallback on error
        setRangeWebsites([]);
        setRangeDaily([]);
        setWeeklyStatsFull({ totalTime: 0, totalVisits: 0, averageSessionTime: 0, mostActiveDay: '' });
        setTodayTotalMs(0);
        setTodayWebsitesCount(0);
        setComparisonData([]);
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    }

    fetchAnalytics();
    return () => { cancelled = true; };
  }, []);

  // Pro users should not stay on the Pricing view; redirect to Settings
  useEffect(() => {
    if (isPro && activeTab === 'pricing') {
      setActiveTab('settings');
    }
  }, [isPro, activeTab]);

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

            {!isPro && (
              <Button
                variant={activeTab === "pricing" ? "default" : "ghost"}
                className="w-full flex items-center justify-start gap-3 h-11 px-3"
                onClick={() => setActiveTab("pricing")}
              >
                <Crown className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Pricing</span>
              </Button>
            )}
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
                <p className="text-xs text-muted-foreground">{isPro ? 'Pro Account' : 'Free Account'}</p>
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
        <main className="p-6 relative">
          <div className={`${!isPro && activeTab !== 'pricing' ? 'pointer-events-none filter blur-sm' : ''}`}>
          {activeTab === "dashboard" && (
            analyticsLoading ? (
              <LoadingView />
            ) : (
              <DashboardView 
                websites={rangeWebsites}
                weeklyStats={{ totalTime: weeklyStatsFull.totalTime, totalVisits: weeklyStatsFull.totalVisits }}
                user={user}
                todayTotalMs={todayTotalMs}
                todayWebsitesCount={todayWebsitesCount}
                daily={rangeDaily}
                comparisonData={comparisonData}
              />
            )
          )}

          {activeTab === "reports" && (
            analyticsLoading ? (
              <LoadingView />
            ) : (
              <ReportsView 
                websites={rangeWebsites}
                weeklyStats={weeklyStatsFull}
                daily={rangeDaily}
              />
            )
          )}

          {activeTab === "settings" && (
            <SettingsView user={user} websites={rangeWebsites} daily={rangeDaily} isPro={isPro} />
          )}

          {activeTab === "pricing" && (
            <Pricing onUpgrade={() => {
              // TODO: Implement Stripe checkout; post-purchase set isPro true and sync to Appwrite
            }} />
          )}
          </div>

          {/* Overlay for Free users on non-pricing tabs */}
          {!isPro && activeTab !== 'pricing' && (
            <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-sm text-center">
                <div className="flex items-center justify-center mb-3">
                  <Crown className="h-6 w-6 text-yellow-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Unlock Pro Features</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Get cross-device sync, advanced reports, and more. Upgrade to Pro to access this section.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setActiveTab('pricing')}>Buy Premium</Button>
                  <Button variant="outline" onClick={() => setActiveTab('pricing')}>See Pricing</Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
