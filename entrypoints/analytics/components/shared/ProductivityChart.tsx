import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Category } from "@/lib/categories";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProductivityChartProps {
  breakdown: Array<{ category: Category | 'uncategorized'; ms: number }>;
  totalMs: number;
}

export function ProductivityChart({ breakdown, totalMs }: ProductivityChartProps) {
  // Category color mapping
  const categoryColors: Record<Category | 'uncategorized', string> = {
    social: '#3b82f6',
    video: '#ef4444',
    music: '#f59e0b',
    productivity: '#10b981',
    developer: '#6366f1',
    communication: '#06b6d4',
    news: '#8b5cf6',
    shopping: '#ec4899',
    education: '#22c55e',
    finance: '#14b8a6',
    search: '#a3a3a3',
    uncategorized: '#9ca3af',
  };

  const items = (breakdown || []).filter(i => i.ms > 0);
  const total = totalMs > 0 ? totalMs : items.reduce((a, b) => a + b.ms, 0);
  const hasData = items.length > 0 && total > 0;
  const labels = items.map(i => i.category.charAt(0).toUpperCase() + i.category.slice(1));
  const hours = items.map(i => i.ms / (1000 * 60 * 60));
  const colors = items.map(i => categoryColors[i.category as Category] || categoryColors.uncategorized);
  const percentages = items.map(i => (total ? Math.round((i.ms / total) * 100) : 0));

  const chartData = {
    labels,
    datasets: [
      {
        data: hours,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2,
        cutout: '60%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = percentages[context.dataIndex] || 0;
            return `${label}: ${value}h (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Productivity Breakdown</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Time spent by category this week
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="space-y-6">
          {/* Chart.js Doughnut Chart */}
          <div className="flex justify-center">
            <div className="relative w-40 h-40">
              {hasData ? (
                <Doughnut data={chartData} options={options} />
              ) : (
                <div className="h-full w-full rounded-full bg-muted/30" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">{Math.round((total / (1000*60*60)))}h</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
              {!hasData && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-full">
                  <div className="text-center">
                    <div className="text-sm font-medium text-foreground">No category data yet</div>
                    <div className="text-xs text-muted-foreground mt-1">Keep browsing to see your breakdown.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          {hasData ? (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: colors[index] }}
                    ></div>
                    <span className="text-sm text-foreground font-medium">{labels[index]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{hours[index].toFixed(1)}h</span>
                    <span className="text-sm text-foreground font-medium">({percentages[index]}%)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center">Come back later for your category breakdown</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

