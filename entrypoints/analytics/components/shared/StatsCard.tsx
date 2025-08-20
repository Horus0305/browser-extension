import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  progress: number;
  progressColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo' | 'pink';
}

const progressColorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500', 
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
  pink: 'bg-pink-500',
} as const;

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  progress, 
  progressColor = 'blue' 
}: StatsCardProps) {
  return (
    <Card className="shadow-sm border border-border">
      <CardContent className="p-6">
        <div className="text-sm text-muted-foreground mb-2">{title}</div>
        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
        <div className="text-xs text-muted-foreground mb-4">{subtitle}</div>
        <div className="mt-auto">
          <div className="w-full bg-muted rounded-full h-1">
            <div 
              className={`h-1 rounded-full ${progressColorMap[progressColor]}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
