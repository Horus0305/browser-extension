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

interface HourlyChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export function HourlyChart({ data, color = '#10b981', height = 180 }: HourlyChartProps) {
  const labels = Array.from({ length: 24 }, (_, i) => {
    return i.toString().padStart(2, '0') + ':00';
  });

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
          title: function(context: any) {
            const hour = parseInt(context[0].label.split(':')[0]);
            const nextHour = (hour + 1) % 24;
            return `${hour.toString().padStart(2, '0')}:00 - ${nextHour.toString().padStart(2, '0')}:00`;
          },
          label: function(context: any) {
            const value = context.parsed.y;
            if (value < 0.1) return 'Minimal activity';
            if (value < 0.3) return 'Low activity';
            if (value < 0.7) return 'Moderate activity';
            if (value < 0.9) return 'High activity';
            return 'Peak activity';
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
        fill: true,
      },
      point: {
        radius: 0,
        hoverRadius: 6,
        borderWidth: 2,
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
            size: 10,
          },
          maxTicksLimit: 8,
          callback: function(value: any, index: number) {
            // Show every 3rd hour label
            return index % 3 === 0 ? labels[index] : '';
          },
        },
      },
      y: {
        display: false,
        beginAtZero: true,
        max: 1,
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
          gradient.addColorStop(1, color + '05');

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
