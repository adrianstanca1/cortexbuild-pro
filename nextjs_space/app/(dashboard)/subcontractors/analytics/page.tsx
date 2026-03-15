import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { ComingSoon } from "@/components/ui/coming-soon";
import { BarChart3 } from "lucide-react";

export default async function SubcontractorAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <ComingSoon
      title="Subcontractor Analytics"
      icon={<BarChart3 className="w-full h-full" />}
      badge="AI"
      description="Deep analytics on subcontractor performance, cost efficiency, and compliance. Score, compare, and make informed decisions about your supply chain."
      features={[
        "Performance scorecards per subcontractor",
        "On-time and on-budget delivery rates",
        "Defect and snagging rates",
        "Insurance and accreditation expiry alerts",
        "Cost benchmarking across trades",
      ]}
      backHref="/subcontractors"
    />
  );
}
