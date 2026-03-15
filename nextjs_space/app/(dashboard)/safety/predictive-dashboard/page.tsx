import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Brain } from "lucide-react";

export default async function PredictiveSafetyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <ComingSoon
      title="Predictive Safety"
      icon={<Brain className="w-full h-full" />}
      badge="AI"
      description="AI-powered safety risk prediction that analyses site conditions, weather, workload, and historical incident data to flag risk windows before accidents happen."
      features={[
        "Daily safety risk score per site",
        "Leading indicator analysis",
        "Near-miss pattern detection",
        "High-risk activity pre-warnings",
        "Automated toolbox talk recommendations",
      ]}
      backHref="/safety"
    />
  );
}
