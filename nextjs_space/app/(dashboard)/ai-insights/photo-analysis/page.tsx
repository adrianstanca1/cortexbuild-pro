import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Eye } from 'lucide-react';

export default async function PhotoAnalysisPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <ComingSoon
      title="AI Photo Analysis"
      icon={<Eye className="w-full h-full" />}
      badge="AI"
      description="Upload site photos and let AI do the analysis. Detect defects, measure progress, flag safety hazards, and generate punch list items automatically from your site images."
      features={[
        'Defect and snagging detection from photos',
        'Progress measurement via visual comparison',
        'PPE compliance checking',
        'Auto-generated punch list items',
        'Before/after progress photo timelines',
      ]}
      backHref="/ai-insights"
    />
  );
}
