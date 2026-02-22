import { QuotasClient } from "./_components/quotas-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function QuotasPage() {
  return <QuotasClient />;
}
