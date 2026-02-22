import { ScheduledTasksClient } from "./_components/scheduled-tasks-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function ScheduledTasksPage() {
  return <ScheduledTasksClient />;
}
