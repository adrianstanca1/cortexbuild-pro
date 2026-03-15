import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { ComingSoon } from "@/components/ui/coming-soon";
import { FileText } from "lucide-react";

export default async function DocumentGeneratorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <ComingSoon
      title="AI Document Generator"
      icon={<FileText className="w-full h-full" />}
      badge="AI"
      description="Generate professional construction documents in seconds. Letters, variation notices, delay claims, meeting minutes, and more — drafted by AI, ready for your review."
      features={[
        "Variation and change order letters",
        "Extension of time (EOT) notices",
        "Delay and disruption claim drafts",
        "Meeting minute templates",
        "Custom branded document output (PDF/DOCX)",
      ]}
      backHref="/ai-insights"
    />
  );
}
