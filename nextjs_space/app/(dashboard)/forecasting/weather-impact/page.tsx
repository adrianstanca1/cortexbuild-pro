import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { ComingSoon } from '@/components/ui/coming-soon';
import { Activity } from 'lucide-react';

export default async function WeatherImpactPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return (
    <ComingSoon
      title="Weather Impact Analysis"
      icon={<Activity className="w-full h-full" />}
      badge="AI"
      description="Understand how weather conditions affect your project schedules and costs. AI correlates historical weather data with site productivity to forecast weather-related delays."
      features={[
        'Live weather feed per site location',
        'Delay risk scoring by weather window',
        'Historical weather-productivity correlation',
        'Automatic schedule impact warnings',
        'Insurance and claims documentation support',
      ]}
      backHref="/forecasting"
    />
  );
}
