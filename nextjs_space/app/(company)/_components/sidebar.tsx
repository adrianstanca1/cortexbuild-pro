"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  LayoutDashboard,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Mail,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";

interface CompanySidebarProps {
  userRole: string;
}

export function CompanySidebar({ userRole }: CompanySidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: "/company", label: "Dashboard", icon: LayoutDashboard },
    { href: "/company/team", label: "Team Management", icon: Users },
    { href: "/company/invitations", label: "Team Invitations", icon: Mail },
    { href: "/company/usage", label: "Usage & Limits", icon: BarChart3 },
    {
      href: "/company/settings",
      label: "Organization Settings",
      icon: Settings,
    },
  ];

  // Show admin link for SUPER_ADMIN
  const showAdminLink = userRole === "SUPER_ADMIN";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-emerald-900 to-emerald-800 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-emerald-700/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-300" />
            <span className="text-lg font-bold">Company Admin</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-emerald-700/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/company" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-emerald-100 hover:bg-emerald-700/50 hover:text-white",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0",
                      isActive && "text-white",
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-emerald-700/50 space-y-1">
        {showAdminLink && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-300 hover:bg-emerald-700/50 hover:text-amber-200 transition-all",
              collapsed && "justify-center px-2",
            )}
          >
            <Settings className="h-5 w-5" />
            {!collapsed && <span>Super Admin</span>}
          </Link>
        )}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-100 hover:bg-emerald-700/50 hover:text-white transition-all",
            collapsed && "justify-center px-2",
          )}
        >
          <ArrowLeft className="h-5 w-5" />
          {!collapsed && <span>Back to Dashboard</span>}
        </Link>
      </div>
    </aside>
  );
}
