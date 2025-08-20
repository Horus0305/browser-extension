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
import { formatHoursMinutes } from "@/lib/time-utils";
import type { WebsiteUsage } from "@/lib/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TopWebsitesChartProps {
  websites: WebsiteUsage[];
}

export function TopWebsitesChart({ websites }: TopWebsitesChartProps) {
  const topWebsites = websites.slice(0, 7); // Show up to 7 websites
  
  const data = {
    labels: topWebsites.map(site => site.domain.replace('www.', '').replace('.com', '')),
    datasets: [
      {
        label: 'Time Spent (hours)',
        data: topWebsites.map(site => site.timeSpent / (1000 * 60 * 60)), // Convert to hours
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // blue
          'rgba(16, 185, 129, 0.8)',   // green
          'rgba(239, 68, 68, 0.8)',    // red
          'rgba(245, 158, 11, 0.8)',   // yellow/orange
          'rgba(139, 92, 246, 0.8)',   // purple
          'rgba(99, 102, 241, 0.8)',   // indigo
          'rgba(236, 72, 153, 0.8)',   // pink
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(99, 102, 241, 1)',
          'rgba(236, 72, 153, 1)',
        ],
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
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const hours = context.parsed.y;
            const milliseconds = hours * 60 * 60 * 1000;
            return `Time: ${formatHoursMinutes(milliseconds)}`;
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
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 11,
          }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Websites</CardTitle>
        <CardDescription>
          Most visited websites this week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
