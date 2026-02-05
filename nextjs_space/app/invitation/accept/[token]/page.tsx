import AcceptInvitationClient from './accept-client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
  return <AcceptInvitationClient token={params.token} />;
}
