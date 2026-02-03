"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ImpersonationData {
  originalAdmin: {
    id: string;
    email: string;
    name: string;
  };
  targetUser: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string | null;
    avatarUrl: string | null;
  };
  impersonationStarted: string;
}

/**
 * Impersonation Banner
 * Shows when a super admin is impersonating another user
 * Displayed at the top of the page to make it clear the admin is in impersonation mode
 */
export function ImpersonationBanner() {
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const updateImpersonationData = () => {
      const data = sessionStorage.getItem("impersonation");
      if (!data) {
        setImpersonationData(null);
        return;
      }
      try {
        setImpersonationData(JSON.parse(data));
      } catch (e) {
        console.error(
          "Failed to parse impersonation data from sessionStorage key 'impersonation'. Raw value:",
          data,
          e
        );
        // Clear corrupted impersonation data to avoid repeated failures
        sessionStorage.removeItem("impersonation");
        // Notify the admin that the impersonation session was corrupted
        if (typeof window !== "undefined") {
          window.alert(
            "Your impersonation session data was corrupted and has been cleared. Please start a new impersonation session."
          );
        }
        setImpersonationData(null);
      }
    };

    // Initial check when the component mounts
    updateImpersonationData();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea === sessionStorage && event.key === "impersonation") {
        updateImpersonationData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleEndImpersonation = async () => {
    if (!impersonationData) return;

    try {
      // Call API to end impersonation
      await fetch("/api/admin/users/impersonate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalAdminId: impersonationData.originalAdmin.id,
          impersonatedUserId: impersonationData.targetUser.id
        })
      });

      // Clear session storage
      sessionStorage.removeItem("impersonation");
      
      // Redirect back to admin panel using Next.js router
      router.push("/admin/users");
    } catch (error) {
      console.error("Failed to end impersonation:", error);
    }
  };

  if (!impersonationData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-yellow-900 shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  ⚠️ Impersonation Mode Active
                </p>
                <p className="text-xs">
                  You are impersonating{" "}
                  <span className="font-medium">{impersonationData.targetUser.name}</span>{" "}
                  ({impersonationData.targetUser.email}) as{" "}
                  <span className="font-medium">{impersonationData.originalAdmin.name}</span>
                </p>
              </div>
            </div>
            <Button
              onClick={handleEndImpersonation}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-100 text-yellow-900 border-yellow-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              End Impersonation
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
