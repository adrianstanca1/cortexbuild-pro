import { TeamInviteAcceptClient } from "./_components/accept-client";

export default function TeamInviteAcceptPage({
  params,
}: {
  params: { token: string };
}) {
  return <TeamInviteAcceptClient token={params.token} />;
}
