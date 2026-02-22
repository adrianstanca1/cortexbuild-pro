import { RateLimitsClient } from "./_components/rate-limits-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function RateLimitsPage() {
  return <RateLimitsClient />;
}
