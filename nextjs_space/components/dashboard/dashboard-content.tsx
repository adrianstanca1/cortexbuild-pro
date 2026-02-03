"use client";

import { useSidebar } from "@/hooks/use-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardFooter } from "@/components/dashboard/footer";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DashboardContentProps {
  children: React.ReactNode;
  user: any;
  userRole: string;
}

export function DashboardContent({ children, user, userRole }: DashboardContentProps) {
  const { collapsed } = useSidebar();

  return (
    <motion.div
      className={cn(
        "transition-all duration-300 ease-in-out flex flex-col min-h-screen",
        collapsed ? "lg:pl-20" : "lg:pl-72"
      )}
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <DashboardHeader user={user} userRole={userRole} />
      <main className="p-6 flex-1">{children}</main>
      <DashboardFooter />
    </motion.div>
  );
}
