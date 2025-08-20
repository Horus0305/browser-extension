import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Wifi, 
  WifiOff, 
  LogOut 
} from "lucide-react";

interface DashboardHeaderProps {
  isAuthenticated: boolean;
  isOnline: boolean;
  onSignOut: () => void;
}

export function DashboardHeader({ isAuthenticated, isOnline, onSignOut }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
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
          {isOnline ? (
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
        
        {/* Sign Out Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="h-8 px-2"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
