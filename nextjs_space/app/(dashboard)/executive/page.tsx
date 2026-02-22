import { getServerSession } from 'next-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { ExecutiveDashboardClient } from './_components/executive-dashboard-client';

export default async function ExecutiveDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  // Only allow certain roles
  const allowedRoles = ['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN', 'PROJECT_MANAGER'];
  if (!allowedRoles.includes(session.user.role || '')) {
    redirect('/dashboard');
  }

  return <ExecutiveDashboardClient />;
}
