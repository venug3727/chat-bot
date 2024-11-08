import React, { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register necessary chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalysisChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Emotion Count",
        data: [],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  });

  const [emotionTrendData, setEmotionTrendData] = useState({
    labels: [],
    datasets: [
      {
        label: "Emotion Trend",
        data: [],
        borderColor: "rgba(255, 99, 132, 0.6)",
        fill: false,
      },
    ],
  });

  const [emotionDistributionData, setEmotionDistributionData] = useState({
    labels: [],
    datasets: [
      {
        label: "Emotion Distribution",
        data: [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token"); // Assuming the token is stored in localStorage
      try {
        const response = await axios.get(`http://127.0.0.1:5000/user/emotions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Assuming response.data contains user-specific chat history
        const chatHistory = response.data.history;
        const emotionCount = {};
        const emotionTrend = [];
        const emotionDistribution = {};

        chatHistory.forEach((chat, index) => {
          const emotion = chat.emotion || "Unknown";
          emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
          emotionTrend.push({ index, emotion });
          emotionDistribution[emotion] =
            (emotionDistribution[emotion] || 0) + 1;
        });

        // Set Bar chart data
        setChartData({
          labels: Object.keys(emotionCount),
          datasets: [
            {
              label: "Emotion Count",
              data: Object.values(emotionCount),
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        });

        // Set Line chart data
        setEmotionTrendData({
          labels: emotionTrend.map((_, idx) => `Chat ${idx + 1}`),
          datasets: [
            {
              label: "Emotion Trend",
              data: emotionTrend.map((item) => item.emotion),
              borderColor: "rgba(255, 99, 132, 0.6)",
              fill: false,
            },
          ],
        });

        // Set Pie chart data
        setEmotionDistributionData({
          labels: Object.keys(emotionDistribution),
          datasets: [
            {
              label: "Emotion Distribution",
              data: Object.values(emotionDistribution),
              backgroundColor: [
                "rgba(255, 99, 132, 0.6)",
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
              ],
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="chart-container">
      <h2>Emotion Analysis Chart</h2>
      <Bar data={chartData} />
      <h2>Emotion Trend Chart</h2>
      <Line data={emotionTrendData} />
      <h2>Emotion Distribution Chart</h2>
      <Pie data={emotionDistributionData} />
    </div>
  );
};

export default AnalysisChart;
