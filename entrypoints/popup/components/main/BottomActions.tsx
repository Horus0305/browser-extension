import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface BottomActionsProps {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  onDetailedReport: () => void;
}

export function BottomActions({ user, isAuthenticated, isLoading, onDetailedReport }: BottomActionsProps) {
  return (
    <div className="space-y-2 mt-auto">
      <Button 
        onClick={onDetailedReport}
        variant="outline"
        className="w-full border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        <ExternalLink className="h-4 w-4" />
        Settings and Report
      </Button>
      
      {isAuthenticated && user && (
        <div className="text-center text-xs text-gray-500">
          Signed in as {user.name || user.email}
        </div>
      )}
    </div>
  );
}
