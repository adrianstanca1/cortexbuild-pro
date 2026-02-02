import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import InvitationsClient from './invitations-client';

export default async function InvitationsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }
  
  return <InvitationsClient />;
}
