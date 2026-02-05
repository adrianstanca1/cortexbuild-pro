import { OrganizationsClient } from "./_components/organizations-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function OrganizationsPage() {
  return <OrganizationsClient />;
}
