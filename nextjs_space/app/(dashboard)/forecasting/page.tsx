import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { ComingSoon } from "@/components/ui/coming-soon";
import { TrendingUp } from "lucide-react";

export default async function ForecastingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <ComingSoon
      title="AI Forecasting"
      icon={<TrendingUp className="w-full h-full" />}
      badge="AI"
      description="Predictive cost and schedule forecasting powered by machine learning. Spot overruns before they happen, model scenarios, and make data-driven decisions with confidence."
      features={[
        "EAC / ETC budget forecasting",
        "Schedule completion predictions",
        "Cost trend analysis over time",
        "Weather impact modelling",
        "Multi-scenario what-if analysis",
      ]}
    />
  );
}
