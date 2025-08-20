import { Skeleton } from "@/components/ui/skeleton";
import { Globe } from "lucide-react";

export function LoadingView() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto">
          <Globe className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Usage Tracker</h1>
          <p className="text-gray-500">Loading your analytics...</p>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </div>
  );
}
