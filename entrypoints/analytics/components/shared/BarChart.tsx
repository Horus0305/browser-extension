import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BarChartData {
  day: string;
  value: number;
  color: string;
}

interface BarChartProps {
  title: string;
  description: string;
  data: BarChartData[];
}

export function BarChart({ title, description, data }: BarChartProps) {
  const maxValue = Math.max(...data.map(item => item.value));

  const getBarColorClass = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-400',
      green: 'bg-green-400', 
      yellow: 'bg-yellow-400',
      red: 'bg-red-400',
      purple: 'bg-purple-400',
      indigo: 'bg-indigo-400',
      pink: 'bg-pink-400',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-400';
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex items-end justify-between h-40 gap-3 px-2">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 max-w-[60px]">
              <div className="relative flex-1 w-full flex items-end mb-2">
                <div
                  className={`w-full rounded-t-lg ${getBarColorClass(item.color)} transition-all duration-300 hover:opacity-80`}
                  style={{
                    height: `${(item.value / maxValue) * 100}%`,
                    minHeight: '16px'
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {item.day}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
