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

export function SessionsChart() {
  // A "session" is defined as a continuous period of web browsing activity
  // A new session starts when:
  // 1. User opens the browser after being inactive for 30+ minutes
  // 2. User returns to browsing after 30+ minutes of inactivity
  // 3. User starts browsing on a new day
  // Sessions end when:
  // 1. 30+ minutes of inactivity (no tab switches, clicks, or navigation)
  // 2. Browser is closed
  // 3. Computer goes to sleep/shutdown
  
  const hours = ['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
  // Realistic session patterns: morning (work prep), work hours peak, evening leisure
  const sessionsData = [2, 8, 15, 22, 28, 35, 31, 18, 12]; // Sessions started per 2-hour window

  const data = {
    labels: hours,
    datasets: [
      {
        label: 'Active Sessions',
        data: sessionsData,
        fill: true,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          
          if (!chartArea) {
            return null;
          }
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
          gradient.addColorStop(0.4, 'rgba(139, 92, 246, 0.15)');
          gradient.addColorStop(0.8, 'rgba(139, 92, 246, 0.05)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.01)');
          return gradient;
        },
        tension: 0.6, // Very smooth curve
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 10,
        pointHoverBackgroundColor: 'rgb(139, 92, 246)',
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
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        cornerRadius: 10,
        displayColors: false,
        padding: 10,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} sessions started`;
          },
          afterLabel: function(context: any) {
            return 'Session = continuous browsing (30min+ gap starts new session)';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 40,
        ticks: {
          callback: function(value: any) {
            return value + '';
          },
          stepSize: 10,
          color: 'rgba(156, 163, 175, 0.7)',
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.15)',
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

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Daily Sessions Pattern</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Browsing sessions started per 2-hour window (30min+ gap = new session)
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="h-64">
          <Line data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
