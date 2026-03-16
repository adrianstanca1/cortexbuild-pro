import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import RamsGenerator from "@/components/dashboard/RamsGenerator";

export default async function RamsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
          RAMS Generator
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Risk Assessment Method Statement generator powered by AI
        </p>
      </div>
      <RamsGenerator />
    </div>
  );
}
