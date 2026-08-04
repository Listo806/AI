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
import { useTranslation } from "react-i18next";

export default function TeamAICharts({ insights }) {
  const { t } = useTranslation();
  const performanceData = [
    {
      name: t("team.aiCharts.productivity", "Productivity"),
      value: insights.productivityScore,
    },
    {
      name: t("team.aiCharts.collaboration", "Collaboration"),
      value: insights.collaborationScore,
    },
    {
      name: t("team.aiCharts.efficiency", "Efficiency"),
      value: insights.efficiencyScore,
    },
    {
      name: t("team.aiCharts.aiScore", "AI Score"),
      value: insights.averageAIScore,
    },
  ];

  const dealData = [
    {
      name: t("team.aiCharts.won", "Won"),
      value: insights.wonDeals,
    },
    {
      name: t("team.aiCharts.lost", "Lost"),
      value: insights.lostDeals,
    },
    {
      name: t("team.aiCharts.open", "Open"),
      value: insights.openDeals,
    },
  ];

  return (
    <div className="team-ai-charts">
      <div className="team-ai-chart-card">
        <h3>{t("team.aiCharts.performanceAnalytics", "Performance Analytics")}</h3>

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
        <h3>{t("team.aiCharts.dealPipeline", "Deal Pipeline")}</h3>

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
