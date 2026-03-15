"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PoundSterling,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface ReportsClientProps {
  stats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    teamSize: number;
    totalBudget: number;
  };
  tasksByStatus: Record<string, number>;
  projectsByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  activityByDay: { date: string; count: number }[];
  projectPerformance: {
    id: string;
    name: string;
    totalTasks: number;
    completedTasks: number;
    progress: number;
    budget: number;
    status: string;
  }[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef"];
const STATUS_COLORS = {
  TODO: "#9ca3af",
  IN_PROGRESS: "#3b82f6",
  REVIEW: "#f59e0b",
  COMPLETE: "#22c55e",
};

const PRIORITY_COLORS = {
  LOW: "#9ca3af",
  MEDIUM: "#3b82f6",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

export function ReportsClient({
  stats,
  tasksByStatus,
  projectsByStatus,
  tasksByPriority,
  activityByDay,
  projectPerformance,
}: ReportsClientProps) {
  const taskStatusData = Object.entries(tasksByStatus).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
    fill: STATUS_COLORS[name as keyof typeof STATUS_COLORS],
  }));

  const priorityData = Object.entries(tasksByPriority).map(([name, value]) => ({
    name,
    value,
    fill: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS],
  }));

  const projectStatusData = Object.entries(projectsByStatus).map(
    ([name, value]) => ({
      name: name.replace("_", " "),
      value,
    }),
  );

  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <p className="text-gray-600">
          Comprehensive overview of your construction projects.
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Projects</p>
                <p className="text-3xl font-bold">{stats.totalProjects}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.activeProjects} active
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FolderKanban className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tasks</p>
                <p className="text-3xl font-bold">{stats.totalTasks}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.completedTasks} completed
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue Tasks</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.overdueTasks}
                </p>
                <p className="text-xs text-gray-500 mt-1">Needs attention</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-3xl font-bold">
                  £{(stats.totalBudget / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Across all projects
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <PoundSterling className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Task Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={completionRate} className="flex-1 h-4" />
            <span className="text-2xl font-bold text-purple-600">
              {completionRate}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats.completedTasks} of {stats.totalTasks} tasks completed
          </p>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Task Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Over Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("en-US", {
                      weekday: "short",
                    })
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: "#6366f1", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Project Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Project</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Tasks</th>
                  <th className="text-left py-3 px-4 font-medium">Progress</th>
                  <th className="text-right py-3 px-4 font-medium">Budget</th>
                </tr>
              </thead>
              <tbody>
                {projectPerformance.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 font-medium">{project.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="text-xs">
                        {project.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {project.completedTasks}/{project.totalTasks}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={project.progress}
                          className="w-20 h-2"
                        />
                        <span className="text-sm">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      £{project.budget.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
