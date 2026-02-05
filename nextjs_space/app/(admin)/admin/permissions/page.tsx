import { PermissionsClient } from "./_components/permissions-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function PermissionsPage() {
  return <PermissionsClient />;
}
