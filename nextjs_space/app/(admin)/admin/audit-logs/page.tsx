import { AuditLogsClient } from "./_components/audit-logs-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function AuditLogsPage() {
  return <AuditLogsClient />;
}
