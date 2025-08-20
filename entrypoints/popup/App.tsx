import { useEffect, useState } from "react";
import { useAppwriteAuth } from "@/lib/hooks/useAppwriteAuth";
import { LoginView, DashboardView, LoadingView } from "./components";
import type { WebsiteUsage } from "@/lib";

function App() {
  // Handle OAuth messages from callback page
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'OAUTH_SUCCESS') {
        window.location.reload();
      } else if (message.type === 'OAUTH_ERROR') {
        console.error('OAuth failed:', message.error);
      }
    };

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

  const [todayWebsites, setTodayWebsites] = useState<WebsiteUsage[]>([]);
  const [todayTotalTime, setTodayTotalTime] = useState<number>(0);
  const [weekTotalTime, setWeekTotalTime] = useState<number>(0);
  const [loadingUsage, setLoadingUsage] = useState<boolean>(true);

  function getBrowserAPI() {
    return (globalThis as any).browser || (globalThis as any).chrome;
  }

  function startOfDay(d: Date) {
    const dd = new Date(d);
    dd.setHours(0, 0, 0, 0);
    return dd;
  }

  function addDays(d: Date, days: number) {
    const dd = new Date(d);
    dd.setDate(dd.getDate() + days);
    return dd;
  }

  async function fetchToday() {
    const api = getBrowserAPI();
    if (!api?.runtime?.sendMessage) return;
    try {
      const res = await api.runtime.sendMessage({ type: 'GET_TODAY_USAGE' });
      if (res) {
        const listRaw: any[] = Array.isArray(res.websites) ? res.websites : [];
        const list: WebsiteUsage[] = listRaw.map((w) => ({
          domain: w.domain,
          timeSpent: Number(w.timeSpent || 0),
          lastVisited: w.lastVisited ? new Date(w.lastVisited) : new Date(0),
          visitCount: Number(w.visitCount || 0),
          category: w.category,
        }));
        // Sort desc by timeSpent, cap to top N if needed
        list.sort((a, b) => b.timeSpent - a.timeSpent);
        setTodayWebsites(list);
        setTodayTotalTime(res.totalMs || 0);
      }
    } catch (e) {
      console.warn('GET_TODAY_USAGE failed', e);
    }
  }

  async function fetchWeek() {
    const api = getBrowserAPI();
    if (!api?.runtime?.sendMessage) return;
    try {
      const now = new Date();
      const end = startOfDay(now);
      const start = addDays(end, -6); // last 7 days including today
      const res = await api.runtime.sendMessage({ type: 'GET_RANGE_USAGE', startDate: start.toISOString(), endDate: end.toISOString() });
      if (res) setWeekTotalTime(res.totalMs || 0);
    } catch (e) {
      console.warn('GET_RANGE_USAGE failed', e);
    }
  }

  useEffect(() => {
    let timer: number | undefined;
    const load = async () => {
      setLoadingUsage(true);
      await Promise.all([fetchToday(), fetchWeek()]);
      setLoadingUsage(false);
    };
    load();
    // refresh while popup is open
    const api = getBrowserAPI();
    if (api?.runtime?.id) {
      timer = setInterval(() => {
        fetchToday();
        fetchWeek();
      }, 15000) as unknown as number;
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const handleDetailedReport = () => {
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
    setTimeout(() => {
      forceRefresh();
    }, 100);
  };

  // Show loading state while authentication is being checked
  if (authLoading) {
    return <LoadingView />;
  }

  // If not authenticated, show only the login form
  if (!isAuthenticated) {
    return (
      <LoginView 
        authError={authError}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Main dashboard view
  return (
    <DashboardView
      user={user}
      isAuthenticated={isAuthenticated}
      authError={authError}
      todayWebsites={todayWebsites}
      todayTotalTime={todayTotalTime}
      weekTotalTime={weekTotalTime}
      isLoading={authLoading || loadingUsage}
      onSignOut={handleSignOut}
      onDetailedReport={handleDetailedReport}
    />
  );
}

export default App;
