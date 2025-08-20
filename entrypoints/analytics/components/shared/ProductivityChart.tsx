import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(ArcElement, Tooltip, Legend);

export function ProductivityChart() {
  const productivityData = [
    { category: 'Work', hours: 15.2, percentage: 54, color: '#10b981' },
    { category: 'Social', hours: 8.1, percentage: 29, color: '#3b82f6' },
    { category: 'Entertainment', hours: 3.5, percentage: 12, color: '#f59e0b' },
    { category: 'Shopping', hours: 1.2, percentage: 5, color: '#ef4444' },
  ];

  const chartData = {
    labels: productivityData.map(item => item.category),
    datasets: [
      {
        data: productivityData.map(item => item.hours),
        backgroundColor: productivityData.map(item => item.color),
        borderColor: productivityData.map(item => item.color),
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
            const percentage = productivityData[context.dataIndex].percentage;
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
              <Doughnut data={chartData} options={options} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">28h</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {productivityData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-foreground font-medium">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{item.hours}h</span>
                  <span className="text-sm text-foreground font-medium">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
