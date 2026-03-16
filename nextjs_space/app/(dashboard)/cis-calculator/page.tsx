import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { isTestMode, getSessionBypass } from "@/lib/test-auth-bypass";
import CisCalculator from "@/components/dashboard/CisCalculator";

export default async function CisCalculatorPage() {
  let session;
  if (isTestMode()) {
    session = getSessionBypass();
  } else {
    session = await getServerSession(authOptions);
  }
  if (!session?.user) redirect("/login");

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <CisCalculator />
    </div>
  );
}
