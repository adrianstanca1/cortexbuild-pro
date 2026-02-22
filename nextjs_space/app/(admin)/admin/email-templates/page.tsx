import { EmailTemplatesClient } from "./_components/email-templates-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function EmailTemplatesPage() {
  return <EmailTemplatesClient />;
}
