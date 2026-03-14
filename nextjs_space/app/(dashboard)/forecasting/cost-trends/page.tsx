import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { ComingSoon } from '@/components/ui/coming-soon';
import { PieChart } from 'lucide-react';

export default async function CostTrendsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <ComingSoon
      title="Cost Trends"
      icon={<PieChart className="w-full h-full" />}
      badge="AI"
      description="Visualise spending patterns across projects, time periods, and cost categories. Identify trends early and get AI recommendations to keep budgets on track."
      features={[
        'Interactive cost trend charts',
        'Spend velocity by project and category',
        'Anomaly detection and alerts',
        'Historical vs. planned comparison',
        'Exportable trend reports',
      ]}
      backHref="/forecasting"
    />
  );
}
