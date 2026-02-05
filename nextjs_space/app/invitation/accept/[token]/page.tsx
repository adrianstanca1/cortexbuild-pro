import AcceptInvitationClient from './accept-client';

export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
  return <AcceptInvitationClient token={params.token} />;
}
