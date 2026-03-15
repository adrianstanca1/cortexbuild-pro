"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface ProjectStatusChartProps {
  data: {
    PLANNING: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    COMPLETED: number;
  };
}

const COLORS = ["#60B5FF", "#5f46e5", "#FF9149", "#80D8C3"];

export function ProjectStatusChart({ data }: ProjectStatusChartProps) {
  const chartData = [
    { name: "Planning", value: data?.PLANNING ?? 0 },
    { name: "In Progress", value: data?.IN_PROGRESS ?? 0 },
    { name: "On Hold", value: data?.ON_HOLD ?? 0 },
    { name: "Completed", value: data?.COMPLETED ?? 0 },
  ].filter((item) => (item?.value ?? 0) > 0);

  const total =
    chartData?.reduce((sum, item) => sum + (item?.value ?? 0), 0) ?? 0;

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No project data available
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData?.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS?.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
          <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
