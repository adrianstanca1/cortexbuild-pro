import { WebhooksClient } from "./_components/webhooks-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function WebhooksPage() {
  return <WebhooksClient />;
}
