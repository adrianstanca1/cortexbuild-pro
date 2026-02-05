"use client";

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
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Shield,
  Building2,
  Truck,
  Calendar,
  Sparkles,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview & KPIs" },
  { href: "/projects", label: "Projects", icon: FolderKanban, description: "All construction features", highlight: true },
  { href: "/team", label: "Team", icon: Users, description: "Team members" },
  { href: "/equipment", label: "Equipment", icon: Truck, description: "Equipment tracking" },
  { href: "/meetings", label: "Meetings", icon: Calendar, description: "Meeting minutes" },
  { href: "/documents", label: "Documents", icon: FileText, description: "Organization documents" },
  { href: "/reports", label: "Reports", icon: BarChart3, description: "Analytics & reports" },
  { href: "/compliance", label: "Site Registry", icon: Shield, description: "Access, Certs & Permits" },
  { href: "/settings", label: "Settings", icon: Settings, description: "User settings" }
];

interface DashboardSidebarProps {
  userRole?: string;
}

/**
 * Render the dashboard sidebar with navigation links, administration links (when allowed), and a collapse toggle.
 *
 * Renders null until client hydration completes to avoid SSR/content mismatches. Navigation items reflect
 * the current pathname for active styling; admin links are shown when `userRole` indicates super- or company-level access.
 *
 * @param userRole - Optional role string used to determine whether administration links are displayed (`"SUPER_ADMIN"`, `"COMPANY_OWNER"`, or `"ADMIN"`)
 * @returns The sidebar JSX element for use in the dashboard layout, or `null` before the component is mounted
 */
export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isCompanyAdmin = userRole === "COMPANY_OWNER" || userRole === "ADMIN";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      <div className="lg:hidden fixed inset-0 bg-black/50 z-40 hidden" />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen z-50 transition-all duration-300",
          "hidden lg:flex lg:flex-col",
          "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-xl blur-sm opacity-50" />
              <div className="relative bg-gradient-to-br from-primary to-purple-600 p-2 rounded-xl">
                <HardHat className="h-6 w-6 text-white" />
              </div>
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white">CortexBuild</span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full text-white">
                  PRO
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {!collapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Navigation
            </p>
          )}

          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-primary"
                )} />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{item.label}</span>
                    {item.highlight && (
                      <span className={cn(
                        "text-xs transition-colors",
                        isActive ? "text-white/80" : "text-slate-400 dark:text-slate-500"
                      )}>
                        Tasks, RFIs, Budget & more
                      </span>
                    )}
                  </div>
                )}
                {!collapsed && item.highlight && !isActive && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin Links */}
          {(isSuperAdmin || isCompanyAdmin) && (
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
              {!collapsed && (
                <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Administration
                </p>
              )}
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    pathname?.startsWith("/admin")
                      ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                  title={collapsed ? "Admin Console" : undefined}
                >
                  <Shield className={cn(
                    "h-5 w-5 flex-shrink-0",
                    pathname?.startsWith("/admin") ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-red-500"
                  )} />
                  {!collapsed && <span>Admin Console</span>}
                </Link>
              )}
              {isCompanyAdmin && (
                <Link
                  href="/company"
                  className={cn(
                    "group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    pathname?.startsWith("/company")
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                  title={collapsed ? "Company Admin" : undefined}
                >
                  <Building2 className={cn(
                    "h-5 w-5 flex-shrink-0",
                    pathname?.startsWith("/company") ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500"
                  )} />
                  {!collapsed && <span>Company Admin</span>}
                </Link>
              )}
            </div>
          )}

          {/* Pro Tip Card */}
          {!collapsed && (
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Pro Tip</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    All construction features live inside each Project for better organization.
                  </p>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span>Press</span>
              <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400">
                ?
              </kbd>
              <span>for shortcuts</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}