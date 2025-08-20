import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react";
import { formatHoursMinutes, calculatePercentage } from "@/lib/time-utils";
import type { WebsiteUsage } from "@/lib/types";

interface DetailedReportTableProps {
  websites: WebsiteUsage[];
}

export function DetailedReportTable({ websites }: DetailedReportTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Show 10 entries per page
  
  const totalTime = websites.reduce((sum, site) => sum + site.timeSpent, 0);
  
  // Sort websites by time spent (descending)
  const sortedWebsites = [...websites].sort((a, b) => b.timeSpent - a.timeSpent);
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedWebsites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWebsites = sortedWebsites.slice(startIndex, endIndex);

  const getWebsiteIcon = (domain: string) => {
    const firstLetter = domain.charAt(0).toUpperCase();
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600', 
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
      'from-teal-500 to-teal-600'
    ];
    const colorIndex = domain.charCodeAt(0) % colors.length;
    return { letter: firstLetter, gradient: colors[colorIndex] };
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(i)}
            className="h-8 w-8 p-0"
          >
            {i}
          </Button>
        );
      }
    } else {
      // Show limited pages with ellipsis
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, currentPage + 2);
      
      if (startPage > 1) {
        buttons.push(
          <Button
            key={1}
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            className="h-8 w-8 p-0"
          >
            1
          </Button>
        );
        if (startPage > 2) {
          buttons.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
        }
      }
      
      for (let i = startPage; i <= endPage; i++) {
        buttons.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(i)}
            className="h-8 w-8 p-0"
          >
            {i}
          </Button>
        );
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          buttons.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
        }
        buttons.push(
          <Button
            key={totalPages}
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            className="h-8 w-8 p-0"
          >
            {totalPages}
          </Button>
        );
      }
    }
    
    return buttons;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow className="border-b border-gray-200 hover:bg-gray-50/50">
            <TableHead className="w-[60px] text-center font-semibold text-gray-700 py-4">Rank</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">Website</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4 text-right">Time Spent</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4 text-center">Visits</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4 text-center">Avg Session</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4 text-center">% of Total</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4 text-center">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentWebsites.map((website, index) => {
            const percentage = calculatePercentage(website.timeSpent, totalTime);
            const avgSession = website.timeSpent / website.visitCount;
            const trend = Math.random() > 0.5 ? 'up' : 'down'; // Mock trend data
            const trendPercentage = Math.floor(Math.random() * 30) + 1;
            const { letter, gradient } = getWebsiteIcon(website.domain);
            const actualRank = startIndex + index + 1; // Calculate actual rank across all pages

            return (
              <TableRow 
                key={website.domain} 
                className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors duration-200"
              >
                <TableCell className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                      actualRank <= 3 ? 'from-yellow-400 to-yellow-500' : 'from-gray-100 to-gray-200'
                    } flex items-center justify-center text-sm font-bold ${
                      actualRank <= 3 ? 'text-white' : 'text-gray-600'
                    } shadow-sm`}>
                      {actualRank}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                      <span className="text-sm font-bold text-white">
                        {letter}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 truncate">{website.domain}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Last visited: {website.lastVisited.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="py-4 text-right">
                  <div className="font-bold text-gray-900 text-lg">
                    {formatHoursMinutes(website.timeSpent)}
                  </div>
                </TableCell>
                
                <TableCell className="py-4 text-center">
                  <Badge 
                    variant="secondary" 
                    className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-medium px-2.5 py-1"
                  >
                    {website.visitCount}
                  </Badge>
                </TableCell>
                
                <TableCell className="py-4 text-center">
                  <div className="font-medium text-gray-700">
                    {formatHoursMinutes(avgSession)}
                  </div>
                </TableCell>
                
                <TableCell className="py-4">
                  <div className="flex items-center justify-center gap-3 px-2">
                    <div className="flex-1 max-w-[120px] bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${gradient}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 min-w-[45px] text-center">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="py-4 text-center">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    trend === 'up' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {trend === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {trendPercentage}%
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Pagination Controls */}
      {sortedWebsites.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/30">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Showing {startIndex + 1} to {Math.min(endIndex, sortedWebsites.length)} of {sortedWebsites.length} entries
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 px-3 flex items-center gap-1"
            >
              <ChevronLeft className="h-3 w-3" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {renderPaginationButtons()}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 px-3 flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      {sortedWebsites.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <TrendingUp className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No website data available</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Start browsing the web and your usage data will appear here. We'll track your time spent on different websites to help you understand your browsing patterns.
          </p>
        </div>
      )}
    </div>
  );
}
