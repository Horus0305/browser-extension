import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function WeeklyTrendChart({ daily }: { daily?: { date: string; totalMs: number }[] }) {
  // Use real daily data when available; otherwise show overlay instead of fake data
  const minDaysRequired = 3; // Require at least 3 non-zero days for a meaningful trend
  const availableDays = Array.isArray(daily)
    ? (daily as { date: string; totalMs: number }[]).reduce((acc, d) => acc + (d.totalMs > 0 ? 1 : 0), 0)
    : 0;
  const hasEnoughData = availableDays >= minDaysRequired;

  const days = hasEnoughData
    ? (daily as { date: string; totalMs: number }[]).map((d) => {
        const dt = new Date(d.date);
        const dn = dt.toLocaleDateString('en-US', { weekday: 'short' });
        const num = dt.getDate();
        return `${dn} ${num}`;
      })
    : [];

  const trendData = hasEnoughData
    ? (daily as { date: string; totalMs: number }[]).map((d) => d.totalMs / 3600000)
    : [];

  const data = {
    labels: days,
    datasets: [
      {
        label: 'Daily Usage',
        data: trendData,
        fill: true,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          
          if (!chartArea) {
            return null;
          }
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
          gradient.addColorStop(0.3, 'rgba(16, 185, 129, 0.2)');
          gradient.addColorStop(0.7, 'rgba(16, 185, 129, 0.1)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
          return gradient;
        },
        tension: 0.4, // Smooth but not overly curved
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 10,
        pointHoverBackgroundColor: 'rgb(16, 185, 129)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        borderWidth: 3,
        cubicInterpolationMode: 'monotone' as const,
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
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: false,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: function(context: any) {
            // Use label from dataset when real data exists
            return context?.[0]?.label ?? 'Daily usage';
          },
          label: function(context: any) {
            const y = context?.parsed?.y ?? 0;
            const hours = Math.floor(y);
            const minutes = Math.round((y - hours) * 60);
            return `${hours}h ${minutes}m browsing time`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          callback: function(value: any) {
            return value + 'h';
          },
          stepSize: 2,
          color: 'rgba(156, 163, 175, 0.7)',
          font: {
            size: 12,
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.15)',
          drawBorder: false,
          lineWidth: 1,
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
            weight: 500,
          }
        },
        border: {
          display: false,
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    elements: {
      point: {
        hoverRadius: 10,
      }
    },
    layout: {
      padding: {
        top: 20,
        left: 5,
        right: 5,
        bottom: 10,
      }
    }
  };

  // Calculate today vs yesterday comparison (only when enough data exists)
  const lastIdx = trendData.length - 1;
  const todayUsage = lastIdx >= 0 ? trendData[lastIdx] : 0;
  const yesterdayUsage = lastIdx >= 1 ? trendData[lastIdx - 1] : 0;
  const dailyChange = yesterdayUsage > 0 ? ((todayUsage - yesterdayUsage) / yesterdayUsage * 100) : 0;
  const weekAverage = trendData.length > 0 ? trendData.reduce((sum, value) => sum + value, 0) / trendData.length : 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Last 7 Days Usage</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Daily browsing time with immediate feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="relative h-72">
          {hasEnoughData ? (
            <Line data={data} options={options} />
          ) : (
            <div className="h-full w-full rounded-md bg-muted/30" />
          )}
          {!hasEnoughData && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-md">
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">Not enough data yet</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {availableDays === 0
                    ? 'Start browsing to build your 7-day trend.'
                    : `Keep using for ${Math.max(0, minDaysRequired - availableDays)} more day(s) to unlock this chart.`}
                </div>
              </div>
            </div>
          )}
        </div>
        {hasEnoughData ? (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Daily average: </span>
              <span className="font-semibold text-gray-800">
                {Math.floor(weekAverage)}h {Math.round((weekAverage - Math.floor(weekAverage)) * 60)}m
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">vs yesterday: </span>
              <span className={`font-semibold ${dailyChange >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(1)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-muted-foreground text-center">
            Collect a few days of activity to see detailed insights here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

