import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, Title } from 'chart.js';
import './TrafficStatsGraph.css'; // Create a CSS file for styling

ChartJS.register(LineElement, CategoryScale, LinearScale, Title);

const TrafficStatsGraph = () => {
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
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
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

  return (
    <div className="traffic-stats-graph">
      <h2>Traffic Volume Over Time</h2>
      <Line data={data} options={options} />
    </div>
  );
};

export default TrafficStatsGraph;
