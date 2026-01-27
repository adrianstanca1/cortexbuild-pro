"use client";

import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface CompanyHeaderProps {
  user: {
    name?: string;
    email?: string;
    role?: string;
  };
  organization: {
    name?: string;
  };
}

export function CompanyHeader({ user, organization }: CompanyHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    COMPANY_OWNER: "Company Owner",
    ADMIN: "Admin",
    PROJECT_MANAGER: "Project Manager",
    FIELD_WORKER: "Field Worker",
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 px-6">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <span className="text-lg font-semibold text-gray-900">
              {organization?.name || "Organization"}
            </span>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Company Management
          </Badge>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500">{roleLabels[user?.role] || user?.role}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                <User className="h-4 w-4" />
                Profile Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
