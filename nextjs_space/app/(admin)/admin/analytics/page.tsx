import { AnalyticsClient } from "./_components/analytics-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
