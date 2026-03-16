import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Package } from 'lucide-react';

export default async function WorkPackagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <ComingSoon
      title="Work Packages"
      icon={<Package className="w-full h-full" />}
      description="Break projects down into structured work packages with scope, deliverables, and budgets. Assign teams, track progress, and manage dependencies across your entire portfolio."
      features={[
        'Hierarchical work breakdown structure (WBS)',
        'Budget and cost tracking per package',
        'Gantt-style dependency mapping',
        'Assignee and team management',
        'Progress tracking with completion gates',
      ]}
    />
  );
}
