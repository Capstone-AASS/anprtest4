import React, { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Title } from 'chart.js';
import './TrafficStatsGraph.css'; // Create a CSS file for styling

// Register the required elements with Chart.js
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title);

const TrafficStatsGraph = () => {
  const chartRef = useRef(null);

  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Traffic Volume',
        data: [300, 500, 400, 600, 700, 800, 900],
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        fill: true,
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Traffic Volume Over Time'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Volume'
        }
      }
    }
  };

  useEffect(() => {
    const chartInstance = chartRef.current;

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, []);

  return (
    <div className="traffic-stats-graph-container">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
};

export default TrafficStatsGraph;