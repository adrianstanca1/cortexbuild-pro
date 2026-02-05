"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HardHat,
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Settings,
  X,
  BarChart3,
  Shield,
  Building2,
  Truck,
  Calendar,
  Menu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/team", label: "Team", icon: Users },
  { href: "/equipment", label: "Equipment", icon: Truck },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings }
];

interface MobileNavProps {
  userRole?: string;
}

export function MobileNav({ userRole }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isCompanyAdmin = userRole === "COMPANY_OWNER" || userRole === "ADMIN";

  // Close nav when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when nav is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 lg:hidden overflow-y-auto"
            >
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-border">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <HardHat className="h-8 w-8 text-primary" />
                  <span className="font-bold text-primary">CortexBuild</span>
                  <span className="bg-accent text-accent-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    Pro
                  </span>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="p-4 space-y-1">
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Main
                </p>
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-[#5f46e5] text-white shadow-sm"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Admin Links */}
                {(isSuperAdmin || isCompanyAdmin) && (
                  <>
                    <div className="pt-4 mt-4 border-t border-border">
                      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Admin
                      </p>
                      {isSuperAdmin && (
                        <Link
                          href="/admin"
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                            pathname?.startsWith("/admin")
                              ? "bg-[#5f46e5] text-white shadow-sm"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <Shield className={cn("h-5 w-5", pathname?.startsWith("/admin") ? "text-white" : "text-muted-foreground")} />
                          <span>Admin Console</span>
                        </Link>
                      )}
                      {isCompanyAdmin && (
                        <Link
                          href="/company"
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                            pathname?.startsWith("/company")
                              ? "bg-[#5f46e5] text-white shadow-sm"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <Building2 className={cn("h-5 w-5", pathname?.startsWith("/company") ? "text-white" : "text-muted-foreground")} />
                          <span>Company Admin</span>
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
