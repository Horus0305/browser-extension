import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function TimeComparisonChart({
  data,
}: {
  data?: Array<{ label: string; currentMs: number; previousMs: number }>;
}) {
  const hasData = !!(data && data.length > 0);
  const items = hasData ? (data as Array<{ label: string; currentMs: number; previousMs: number }>) : [];

  const chartData = {
    labels: items.map((i) => i.label),
    datasets: [
      {
        label: 'Current Period',
        data: items.map((i) => i.currentMs / 3600000),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Previous Period',
        data: items.map((i) => i.previousMs / 3600000),
        backgroundColor: 'rgba(156, 163, 175, 0.6)',
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          }
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}h`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + 'h';
          },
          color: 'rgba(156, 163, 175, 0.7)',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: false,
        },
        border: {
          display: false,
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.7)',
          font: {
            size: 11,
          }
        },
        border: {
          display: false,
        }
      }
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
      }
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-red-500'; // Increased usage (bad)
    if (change < 0) return 'text-green-500'; // Decreased usage (good)
    return 'text-gray-500'; // No change
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗'; // Increase
    if (change < 0) return '↘'; // Decrease
    return '→'; // No change
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Usage Comparison</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Current vs previous periods - track your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="relative h-64 mb-4">
          {hasData ? (
            <Bar data={chartData} options={options} />
          ) : (
            <div className="h-full w-full rounded-md bg-muted/30" />
          )}
          {!hasData && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-md">
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">Not enough data yet</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Keep using the browser to unlock comparison insights.
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Comparison Stats */}
        {hasData && (
          <div className="grid grid-cols-1 gap-3">
            {items.map((it, idx) => {
              const currentH = it.currentMs / 3600000;
              const previousH = it.previousMs / 3600000;
              const change = it.previousMs > 0 ? ((it.currentMs - it.previousMs) / it.previousMs) * 100 : 0;
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{it.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {currentH.toFixed(1)}h vs {previousH.toFixed(1)}h
                    </span>
                    <span className={`text-sm font-medium ${getChangeColor(change)}`}>
                      {getChangeIcon(change)} {Math.abs(change).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
