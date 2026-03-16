import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Gauge } from 'lucide-react';

export default async function ExecutivePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <ComingSoon
      title="Executive Hub"
      icon={<Gauge className="w-full h-full" />}
      badge="AI"
      description="A high-level AI-powered command centre for executives and directors. Get board-ready insights, portfolio health summaries, and predictive forecasts across all projects in one view."
      features={[
        'Portfolio-level KPI dashboard',
        'AI-generated executive summaries',
        'Risk & issue escalation feed',
        'Budget vs. forecast variance at a glance',
        'One-click PDF board reports',
      ]}
    />
  );
}
