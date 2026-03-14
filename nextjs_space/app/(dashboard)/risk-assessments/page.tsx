import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { ComingSoon } from '@/components/ui/coming-soon';
import { AlertTriangle } from 'lucide-react';

export default async function RiskRegisterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <ComingSoon
      title="Risk Register"
      icon={<AlertTriangle className="w-full h-full" />}
      description="Centralised risk register for all projects. Log, assess, and manage risks with probability/impact scoring, mitigation actions, and escalation workflows."
      features={[
        'Risk log with probability × impact matrix',
        'Mitigation actions and owners',
        'Residual risk scoring',
        'Risk escalation and approval workflows',
        'CDM 2015 pre-construction hazard register',
      ]}
    />
  );
}
