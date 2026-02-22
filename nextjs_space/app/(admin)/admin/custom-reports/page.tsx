import { CustomReportsClient } from "./_components/custom-reports-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function CustomReportsPage() {
  return <CustomReportsClient />;
}
