import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

export default function TeamAICharts({ insights }) {
  const performanceData = [
    {
      name: "Productivity",
      value: insights.productivityScore,
    },
    {
      name: "Collaboration",
      value: insights.collaborationScore,
    },
    {
      name: "Efficiency",
      value: insights.efficiencyScore,
    },
    {
      name: "AI Score",
      value: insights.averageAIScore,
    },
  ];

  const dealData = [
    {
      name: "Won",
      value: insights.wonDeals,
    },
    {
      name: "Lost",
      value: insights.lostDeals,
    },
    {
      name: "Open",
      value: insights.openDeals,
    },
  ];

  return (
    <div className="team-ai-charts">
      <div className="team-ai-chart-card">
        <h3>Performance Analytics</h3>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="team-ai-chart-card">
        <h3>Deal Pipeline</h3>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={dealData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Line type="monotone" dataKey="value" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
