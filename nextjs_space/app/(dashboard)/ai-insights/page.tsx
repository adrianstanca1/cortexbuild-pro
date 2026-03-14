import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Sparkles } from 'lucide-react';

export default async function AIInsightsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <ComingSoon
      title="AI Insights"
      icon={<Sparkles className="w-full h-full" />}
      badge="AI"
      description="Your AI-powered construction analyst. Ask questions in plain English, get automated portfolio summaries, generate documents, and analyse site photos — all in one place."
      features={[
        'Natural language project Q&A',
        'Automated weekly portfolio digest',
        'AI document generator (letters, notices, reports)',
        'Site photo analysis and defect detection',
        'Smart recommendations from your data',
      ]}
    />
  );
}
