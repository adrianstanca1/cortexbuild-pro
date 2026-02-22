import { UsersManagementClient } from "./_components/users-management-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function UsersManagementPage() {
  return <UsersManagementClient />;
}
