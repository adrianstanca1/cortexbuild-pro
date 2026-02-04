import { TeamInviteAcceptClient } from "./_components/accept-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default async function TeamInviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <TeamInviteAcceptClient token={token} />;
}
