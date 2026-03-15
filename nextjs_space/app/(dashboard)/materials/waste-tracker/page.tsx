import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Activity } from "lucide-react";

export default async function WasteTrackerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <ComingSoon
      title="Waste Tracker"
      icon={<Activity className="w-full h-full" />}
      badge="AI"
      description="Monitor, log, and reduce material waste across all your sites. Meet sustainability targets, stay compliant with waste legislation, and cut costs through smarter material usage."
      features={[
        "Waste log by material type and site",
        "Skip and skip exchange tracking",
        "Waste transfer notes (WTN) generation",
        "Sustainability reporting and targets",
        "AI recommendations to reduce waste",
      ]}
      backHref="/materials"
    />
  );
}
