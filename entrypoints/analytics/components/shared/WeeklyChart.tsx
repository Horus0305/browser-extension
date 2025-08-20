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

interface WeeklyChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}

export function WeeklyChart({ data, labels, color = '#3b82f6', height = 200 }: WeeklyChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: color,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y.toFixed(1)}h`;
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
        fill: true,
      },
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 3,
        backgroundColor: '#fff',
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return value + 'h';
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  } as const;

  const chartData = {
    labels,
    datasets: [
      {
        data,
        borderColor: color,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            return color + '20';
          }

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, color + '40');
          gradient.addColorStop(1, color + '10');

          return gradient;
        },
        pointBorderColor: color,
        pointBackgroundColor: '#fff',
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        fill: true,
      },
    ],
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line options={options} data={chartData} />
    </div>
  );
}
