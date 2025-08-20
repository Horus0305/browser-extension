import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { WebsiteUsage } from "@/lib/types";
import { formatHoursMinutes, formatPercentage, calculatePercentage } from "@/lib/time-utils";

interface WebsiteRankingsProps {
  websites: WebsiteUsage[];
  totalTime: number;
  isLoading: boolean;
}

export function WebsiteRankings({ websites, totalTime, isLoading }: WebsiteRankingsProps) {
  const topWebsites = websites.slice(0, 5); // Show top 5 websites

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Top Websites
          </h2>
          <Badge variant="secondary">Today</Badge>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (topWebsites.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Top Websites
          </h2>
          <Badge variant="secondary">Today</Badge>
        </div>
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">No browsing data for today</div>
          <div className="text-xs mt-1">Start browsing to see your usage statistics</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Top Websites
        </h2>
        <Badge variant="secondary">Today</Badge>
      </div>

      <Table>
        <TableBody>
          {topWebsites.map((website, index) => {
            const percentage = calculatePercentage(website.timeSpent, totalTime);
            
            return (
              <TableRow key={website.domain} className="border-0">
                <TableCell className="px-0 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        {website.domain}
                      </div>
                      <div className="text-xs text-gray-500">
                        {website.visitCount} visit{website.visitCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-0 py-2 text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatHoursMinutes(website.timeSpent)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatPercentage(percentage)}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {websites.length > 5 && (
        <div className="text-center mt-3">
          <div className="text-xs text-gray-500">
            +{websites.length - 5} more websites in detailed report
          </div>
        </div>
      )}
    </div>
  );
}
