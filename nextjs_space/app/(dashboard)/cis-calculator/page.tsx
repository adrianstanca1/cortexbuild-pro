import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import CisCalculator from "@/components/dashboard/CisCalculator";

export default async function CisCalculatorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <CisCalculator />
    </div>
  );
}
