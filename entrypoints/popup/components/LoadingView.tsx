import { Skeleton } from "@/components/ui/skeleton";
import { Globe } from "lucide-react";

export function LoadingView() {
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
