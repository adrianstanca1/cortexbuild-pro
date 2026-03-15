import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Calendar } from "lucide-react";

export default async function ResourceSchedulerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <ComingSoon
      title="Resource Scheduler"
      icon={<Calendar className="w-full h-full" />}
      badge="AI"
      description="AI-assisted resource planning that matches the right people to the right projects at the right time. Eliminate overloading and underutilisation across your entire workforce."
      features={[
        "Visual drag-and-drop schedule board",
        "Capacity utilisation heatmaps",
        "Skill-based resource matching",
        "Conflict detection and resolution",
        "Leave and availability management",
      ]}
      backHref="/team"
    />
  );
}
