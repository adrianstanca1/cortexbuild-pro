import { MFAClient } from "./_components/mfa-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function MFAPage() {
  return <MFAClient />;
}
