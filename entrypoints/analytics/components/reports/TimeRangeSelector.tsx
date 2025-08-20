import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp } from "lucide-react";

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const timeRanges = [
    { id: 'today', label: 'Today', icon: Clock },
    { id: 'week', label: 'This Week', icon: Calendar },
    { id: 'month', label: 'This Month', icon: TrendingUp },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      {timeRanges.map((range) => {
        const Icon = range.icon;
        const isActive = value === range.id;
        
        return (
          <Button
            key={range.id}
            variant="ghost"
            size="sm"
            onClick={() => onChange(range.id)}
            className={`flex items-center gap-2 transition-all ${
              isActive 
                ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' 
                : 'hover:bg-white/50 text-gray-700'
            }`}
          >
            <Icon className="h-3 w-3" />
            {range.label}
          </Button>
        );
      })}
    </div>
  );
}
