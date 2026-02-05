import { ActivityMonitorClient } from "./_components/activity-monitor-client";

// Force dynamic rendering to avoid build-time data collection
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ActivityMonitorPage() {
  return <ActivityMonitorClient />;
}
