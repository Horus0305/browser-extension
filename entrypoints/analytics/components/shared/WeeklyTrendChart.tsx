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

export function WeeklyTrendChart() {
  // Generate last 7 days data with actual dates
  const generateLast7Days = () => {
    const days = [];
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Format as "Mon 14" or "Tue 15" etc.
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = date.getDate();
      days.push(`${dayName} ${dayNumber}`);
      
      // Generate realistic daily usage data (3-8 hours)
      const baseUsage = 5.5;
      const variation = (Math.random() - 0.5) * 3; // ±1.5 hours
      const weekendBoost = (date.getDay() === 0 || date.getDay() === 6) ? 1.2 : 1; // Weekend boost
      data.push(Math.max(2, Math.min(9, (baseUsage + variation) * weekendBoost)));
    }
    
    return { days, data };
  };

  const { days, data: trendData } = generateLast7Days();

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
            const today = new Date();
            const dayIndex = context[0].dataIndex;
            const date = new Date(today);
            date.setDate(today.getDate() - (6 - dayIndex));
            
            if (dayIndex === 6) return 'Today';
            if (dayIndex === 5) return 'Yesterday';
            return date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            });
          },
          label: function(context: any) {
            const hours = Math.floor(context.parsed.y);
            const minutes = Math.round((context.parsed.y - hours) * 60);
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

  // Calculate today vs yesterday comparison
  const todayUsage = trendData[6];
  const yesterdayUsage = trendData[5];
  const dailyChange = ((todayUsage - yesterdayUsage) / yesterdayUsage * 100);
  const weekAverage = trendData.reduce((sum, value) => sum + value, 0) / 7;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Last 7 Days Usage</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Daily browsing time with immediate feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="h-72">
          <Line data={data} options={options} />
        </div>
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
      </CardContent>
    </Card>
  );
}
