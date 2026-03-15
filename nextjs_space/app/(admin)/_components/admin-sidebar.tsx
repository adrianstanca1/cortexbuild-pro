"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Activity,
  Database,
  Shield,
  ChevronLeft,
  Mail,
  Server,
  Eye,
  Settings,
  Terminal,
  Key,
} from "lucide-react";

const adminNavItems = [
  {
    href: "/admin",
    label: "Command Center",
    icon: Terminal,
    description: "Dashboard overview",
  },
  {
    href: "/admin/system-health",
    label: "System Health",
    icon: Server,
    description: "Monitor services",
  },
  {
    href: "/admin/api-management",
    label: "API Management",
    icon: Key,
    description: "API connections",
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: Users,
    description: "Manage users",
  },
  {
    href: "/admin/organizations",
    label: "Organizations",
    icon: Building2,
    description: "Manage tenants",
  },
  {
    href: "/admin/invitations",
    label: "Invitations",
    icon: Mail,
    description: "Pending invites",
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: Eye,
    description: "Activity tracking",
  },
  {
    href: "/admin/activity",
    label: "Activity Monitor",
    icon: Activity,
    description: "Real-time events",
  },
  {
    href: "/admin/storage",
    label: "Storage & Data",
    icon: Database,
    description: "File management",
  },
  {
    href: "/admin/platform-settings",
    label: "Platform Settings",
    icon: Settings,
    description: "Configuration",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gray-900 border-r border-gray-800 z-40 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6 px-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">Super Admin</span>
            <p className="text-xs text-gray-500">Control Panel</p>
          </div>
        </div>

        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Version Info */}
        <div className="mt-4 px-3 py-3 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500">CortexBuild Pro</p>
          <p className="text-xs text-gray-400 font-mono">v2.0.0</p>
        </div>
      </div>
    </aside>
  );
}
