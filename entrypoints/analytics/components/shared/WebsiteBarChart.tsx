import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WebsiteData {
  website: string;
  timeSpent: number; // in minutes
  visits: number;
  color: string;
}

interface WebsiteBarChartProps {
  title: string;
  description: string;
  websites: WebsiteData[];
}

export function WebsiteBarChart({ title, description, websites }: WebsiteBarChartProps) {
  const maxTime = Math.max(...websites.map(site => site.timeSpent));

  const getBarColorClass = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500', 
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500',
      pink: 'bg-pink-500',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex items-end justify-between h-48 gap-3 px-2">
          {websites.map((site, index) => {
            const heightPercentage = Math.max((site.timeSpent / maxTime) * 100, 8); // Minimum 8% height
            return (
              <div key={index} className="flex flex-col items-center flex-1 group">
                <div className="relative flex-1 w-full flex items-end mb-3">
                  <div
                    className={`w-full rounded-t-md ${getBarColorClass(site.color)} transition-all duration-300 hover:opacity-80 cursor-pointer shadow-sm`}
                    style={{
                      height: `${heightPercentage}%`,
                    }}
                    title={`${site.website}: ${formatTime(site.timeSpent)} (${site.visits} visits)`}
                  />
                </div>
                <div className="text-xs text-muted-foreground font-medium text-center leading-tight">
                  <div className="truncate max-w-[60px]" title={site.website}>
                    {site.website.replace('www.', '').replace('.com', '')}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatTime(site.timeSpent)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
