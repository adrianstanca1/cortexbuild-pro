import { SystemHealthClient } from "./_components/system-health-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function SystemHealthPage() {
  return <SystemHealthClient />;
}
