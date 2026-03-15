import AcceptInvitationClient from "./accept-client";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <AcceptInvitationClient token={token} />;
}
