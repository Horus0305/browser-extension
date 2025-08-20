import { useEffect } from "react";
import { useAppwriteAuth } from "@/lib/hooks/useAppwriteAuth";
import { LoginView, DashboardView, LoadingView } from "./components";

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

  // Mock data for demo purposes
  const mockWebsites = [
    {
      domain: "github.com",
      timeSpent: 3600000, // 1 hour in milliseconds
      lastVisited: new Date(),
      visitCount: 15
    },
    {
      domain: "stackoverflow5.com",
      timeSpent: 2700000, // 45 minutes
      lastVisited: new Date(),
      visitCount: 8
    },
    {
      domain: "stackoverflow4.com",
      timeSpent: 2700000, // 45 minutes
      lastVisited: new Date(),
      visitCount: 8
    },
    {
      domain: "stackoverflow3.com",
      timeSpent: 2700000, // 45 minutes
      lastVisited: new Date(),
      visitCount: 8
    },
    {
      domain: "stackoverflow2.com",
      timeSpent: 2700000, // 45 minutes
      lastVisited: new Date(),
      visitCount: 8
    },
    {
      domain: "stackoverflow1.com",
      timeSpent: 2700000, // 45 minutes
      lastVisited: new Date(),
      visitCount: 8
    },
  ];

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
      todayWebsites={mockWebsites}
      todayTotalTime={6300000} // Mock: 1h 45m
      weekTotalTime={25200000} // Mock: 7 hours
      isLoading={authLoading}
      onSignOut={handleSignOut}
      onDetailedReport={handleDetailedReport}
    />
  );
}

export default App;
