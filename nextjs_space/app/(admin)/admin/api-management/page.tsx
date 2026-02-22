import { ApiManagementClient } from "./_components/api-management-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function ApiManagementPage() {
  return <ApiManagementClient />;
}
