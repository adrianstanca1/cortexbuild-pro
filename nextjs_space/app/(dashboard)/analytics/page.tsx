import { AnalyticsDashboardClient } from "./_components/analytics-dashboard-client";

export const metadata = {
  title: "Analytics | CortexBuild",
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Project health metrics and insights
        </p>
      </div>
      <AnalyticsDashboardClient />
    </div>
  );
}
