import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  User, 
  LogOut,
  Wifi,
  WifiOff
} from "lucide-react";
import { useAppwriteAuth } from "@/lib/hooks/useAppwriteAuth";

export function Header() {
  const { user, signOut } = useAppwriteAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to popup or refresh
      window.close();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Usage Tracker</h1>
              <p className="text-sm text-gray-500">Analytics Dashboard</p>
            </div>
          </div>

          {/* Status and User Info */}
          <div className="flex items-center gap-4">
            {/* Sync Status */}
            <div className="flex items-center gap-2">
              {navigator.onLine ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <Badge variant="secondary" className="text-xs">
                    Synced
                  </Badge>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <Badge variant="destructive" className="text-xs">
                    Offline
                  </Badge>
                </>
              )}
            </div>

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {user.name || user.email}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-8 px-3"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
