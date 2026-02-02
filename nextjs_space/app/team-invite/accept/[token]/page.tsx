import { TeamInviteAcceptClient } from "./_components/accept-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function TeamInviteAcceptPage({
  params,
}: {
  params: { token: string };
}) {
  return <TeamInviteAcceptClient token={params.token} />;
}
