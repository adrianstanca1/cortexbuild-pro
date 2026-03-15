import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Coins } from "lucide-react";

export default async function CostCodesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <ComingSoon
      title="Cost Codes"
      icon={<Coins className="w-full h-full" />}
      description="Define and manage your organisation's cost code structure. Standardise how costs are categorised across all projects for cleaner reporting and accurate budget allocation."
      features={[
        "Custom cost code hierarchy",
        "Assign codes to tasks, materials, and labour",
        "Export to accounting systems (Xero, QuickBooks)",
        "Budget allocation by cost code",
        "Real-time spend tracking per code",
      ]}
    />
  );
}
