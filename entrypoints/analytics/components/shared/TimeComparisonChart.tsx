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

export function TimeComparisonChart() {
  // Comparison data: current vs previous periods
  const comparisonData = {
    today: { current: 6.2, previous: 4.8, label: 'Today vs Yesterday' },
    thisWeek: { current: 28.0, previous: 32.0, label: 'This Week vs Last Week' },
    thisMonth: { current: 120.5, previous: 110.2, label: 'This Month vs Last Month' }
  };

  // Calculate percentage changes
  const todayChange = ((comparisonData.today.current - comparisonData.today.previous) / comparisonData.today.previous * 100);
  const weekChange = ((comparisonData.thisWeek.current - comparisonData.thisWeek.previous) / comparisonData.thisWeek.previous * 100);
  const monthChange = ((comparisonData.thisMonth.current - comparisonData.thisMonth.previous) / comparisonData.thisMonth.previous * 100);

  const chartData = {
    labels: ['Today vs Yesterday', 'This Week vs Last Week', 'This Month vs Last Month'],
    datasets: [
      {
        label: 'Current Period',
        data: [comparisonData.today.current, comparisonData.thisWeek.current, comparisonData.thisMonth.current],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Previous Period',
        data: [comparisonData.today.previous, comparisonData.thisWeek.previous, comparisonData.thisMonth.previous],
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
        <div className="h-64 mb-4">
          <Bar data={chartData} options={options} />
        </div>
        
        {/* Comparison Stats */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Today vs Yesterday</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {comparisonData.today.current}h vs {comparisonData.today.previous}h
              </span>
              <span className={`text-sm font-medium ${getChangeColor(todayChange)}`}>
                {getChangeIcon(todayChange)} {Math.abs(todayChange).toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">This Week vs Last Week</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {comparisonData.thisWeek.current}h vs {comparisonData.thisWeek.previous}h
              </span>
              <span className={`text-sm font-medium ${getChangeColor(weekChange)}`}>
                {getChangeIcon(weekChange)} {Math.abs(weekChange).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
