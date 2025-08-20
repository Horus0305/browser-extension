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

export function TopCategoriesChart() {
  const categoriesData = [
    { 
      name: 'Development', 
      sites: ['github.com', 'stackoverflow.com', 'dev.to'], 
      totalHours: 12.5, 
      color: '#3b82f6' 
    },
    { 
      name: 'Social Media', 
      sites: ['twitter.com', 'linkedin.com', 'reddit.com'], 
      totalHours: 8.25, 
      color: '#10b981' 
    },
    { 
      name: 'Entertainment', 
      sites: ['youtube.com', 'netflix.com', 'twitch.tv'], 
      totalHours: 5.75, 
      color: '#f59e0b' 
    },
    { 
      name: 'News & Reading', 
      sites: ['medium.com', 'news.ycombinator.com'], 
      totalHours: 2.5, 
      color: '#8b5cf6' 
    },
  ];

  const chartData = {
    labels: categoriesData.map(item => item.name),
    datasets: [
      {
        label: 'Hours',
        data: categoriesData.map(item => item.totalHours),
        backgroundColor: categoriesData.map(item => item.color),
        borderColor: categoriesData.map(item => item.color),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.x}h`;
          },
          afterLabel: function(context: any) {
            const category = categoriesData[context.dataIndex];
            return category.sites.join(', ');
          }
        }
      }
    },
    scales: {
      x: {
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
      y: {
        grid: {
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

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Top Categories</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Most visited website categories
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="h-64">
          <Bar data={chartData} options={options} />
        </div>
        
        {/* Website details */}
        <div className="mt-4 space-y-2">
          {categoriesData.map((category, index) => (
            <div key={index} className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-foreground">{category.name}:</span>
              {category.sites.map((site, siteIndex) => (
                <span 
                  key={siteIndex}
                  className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md"
                >
                  {site}
                </span>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
