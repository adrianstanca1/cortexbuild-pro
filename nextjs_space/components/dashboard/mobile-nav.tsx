"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HardHat,
  LayoutDashboard,
  FolderKanban,
  Settings,
  X,
  BarChart3,
  Shield,
  Building2,
  Truck,
  Calendar,
  Menu,
  ChevronDown,
  Package,
  Coins,
  TrendingUp,
  AlertTriangle,
  Gauge,
  Award,
  Clock,
  Wallet,
  ClipboardList,
  Receipt,
  Brain,
  Activity,
  Layers,
  PenTool,
  FileCheck,
  Wrench,
  HardDrive,
  CheckSquare,
  FileQuestion,
  Send,
  Target,
  BookOpen,
  BadgeCheck,
  UserCheck,
  Blocks,
  Cpu,
  Sparkles,
  Eye,
  FileSignature,
  FolderOpen,
  FolderCog,
  FolderSync,
  FolderInput,
  FolderLock,
  FolderTree,
  FolderSearch,
  FolderHeart,
  Home
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

// Folder-based navigation (same as sidebar)
const navigationFolders = [
  {
    id: 'command',
    label: 'Command Centre',
    icon: FolderCog,
    iconOpen: FolderOpen,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/executive', label: 'Executive Hub', icon: Gauge, adminOnly: true, badge: 'AI' },
    ]
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    iconOpen: FolderOpen,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    items: [
      { href: '/projects', label: 'All Projects', icon: Blocks },
      { href: '/work-packages', label: 'Work Packages', icon: Package },
      { href: '/milestones', label: 'Milestones', icon: Target },
      { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    ]
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: FolderHeart,
    iconOpen: FolderOpen,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    items: [
      { href: '/budget', label: 'Budget Tracker', icon: Wallet },
      { href: '/cost-codes', label: 'Cost Codes', icon: Coins },
      { href: '/forecasting', label: 'Forecasting', icon: TrendingUp, badge: 'AI' },
      { href: '/progress-claims', label: 'Progress Claims', icon: Receipt },
      { href: '/change-orders', label: 'Change Orders', icon: FileCheck },
    ]
  },
  {
    id: 'field',
    label: 'Field Operations',
    icon: FolderSync,
    iconOpen: FolderOpen,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    items: [
      { href: '/daily-reports', label: 'Daily Reports', icon: ClipboardList },
      { href: '/site-diary', label: 'Site Diary', icon: BookOpen },
      { href: '/time-tracking', label: 'Time Tracking', icon: Clock },
      { href: '/meetings', label: 'Meetings', icon: Calendar },
    ]
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: FolderInput,
    iconOpen: FolderOpen,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    items: [
      { href: '/team', label: 'Team', icon: UserCheck },
      { href: '/certifications', label: 'Certifications', icon: Award },
      { href: '/equipment', label: 'Equipment', icon: Truck },
      { href: '/materials', label: 'Materials', icon: Layers },
      { href: '/subcontractors', label: 'Subcontractors', icon: Building2 },
    ]
  },
  {
    id: 'safety',
    label: 'Quality & Safety',
    icon: FolderLock,
    iconOpen: FolderOpen,
    color: 'red',
    gradient: 'from-red-500 to-rose-600',
    items: [
      { href: '/risk-assessments', label: 'Risk Register', icon: AlertTriangle },
      { href: '/safety', label: 'Safety Hub', icon: Shield },
      { href: '/inspections', label: 'Inspections', icon: Eye },
      { href: '/permits', label: 'Permits', icon: BadgeCheck },
      { href: '/defects', label: 'Defects', icon: Wrench },
      { href: '/punch-lists', label: 'Punch Lists', icon: CheckSquare },
    ]
  },
  {
    id: 'documents',
    label: 'Documentation',
    icon: FolderTree,
    iconOpen: FolderOpen,
    color: 'indigo',
    gradient: 'from-indigo-500 to-blue-600',
    items: [
      { href: '/documents', label: 'Document Drive', icon: HardDrive },
      { href: '/documents/templates', label: 'Templates', icon: FileSignature },
      { href: '/drawings', label: 'Drawings', icon: PenTool },
      { href: '/rfis', label: 'RFIs', icon: FileQuestion },
      { href: '/submittals', label: 'Submittals', icon: Send },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: FolderSearch,
    iconOpen: FolderOpen,
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ]
  }
];

const colorMappings: Record<string, { bg: string; text: string; activeBg: string }> = {
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', activeBg: 'bg-violet-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', activeBg: 'bg-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-amber-500/20' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', activeBg: 'bg-pink-500/20' },
  red: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', activeBg: 'bg-red-500/20' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', activeBg: 'bg-indigo-500/20' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', activeBg: 'bg-cyan-500/20' }
};

interface MobileNavProps {
  userRole?: string;
}

export function MobileNav({ userRole }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isCompanyAdmin = userRole === "COMPANY_OWNER" || userRole === "ADMIN";
  const isAdmin = isSuperAdmin || isCompanyAdmin;

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    navigationFolders.forEach(folder => {
      const hasActiveItem = folder.items.some(item => 
        pathname === item.href || pathname?.startsWith(item.href + '/')
      );
      if (hasActiveItem) {
        initialExpanded[folder.id] = true;
      }
    });
    initialExpanded['command'] = true;
    setExpandedFolders(initialExpanded);
  }, [pathname]);

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

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const isFolderActive = (folder: typeof navigationFolders[0]) => {
    return folder.items.some(item => isItemActive(item.href));
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[60] lg:hidden overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-xl blur-sm opacity-60" />
                    <div className="relative bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-2 rounded-xl">
                      <HardHat className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">CortexBuild</span>
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* System Status */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="relative">
                    <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">System Active</span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {/* Root indicator */}
                <div className="flex items-center gap-2 px-3 py-2 mb-2">
                  <Home className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Navigation
                  </span>
                </div>

                {navigationFolders.map((folder) => {
                  const visibleItems = folder.items.filter(item => !(item as any).adminOnly || isAdmin);
                  if (visibleItems.length === 0) return null;
                  
                  const FolderIcon = expandedFolders[folder.id] ? folder.iconOpen : folder.icon;
                  const isExpanded = expandedFolders[folder.id];
                  const isActive = isFolderActive(folder);
                  const colors = colorMappings[folder.color];

                  return (
                    <div key={folder.id} className="mb-1">
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                          isActive
                            ? `${colors.bg} ${colors.text}`
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg transition-all",
                          isActive || isExpanded ? colors.bg : "bg-slate-100 dark:bg-slate-800"
                        )}>
                          <FolderIcon className={cn(
                            "h-4 w-4",
                            isActive || isExpanded ? colors.text : "text-slate-400"
                          )} />
                        </div>
                        <span className="flex-1 text-left">{folder.label}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200 text-slate-400",
                          isExpanded ? "rotate-180" : ""
                        )} />
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 pr-2 py-1 space-y-0.5 relative">
                              <div className="absolute left-[27px] top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-700" />
                              
                              {visibleItems.map((item) => {
                                const ItemIcon = item.icon;
                                const active = isItemActive(item.href);
                                
                                return (
                                  <div key={item.href} className="relative">
                                    <div className={cn(
                                      "absolute left-[8px] top-1/2 w-4 h-px",
                                      active ? "bg-white/50" : "bg-slate-200 dark:bg-slate-700"
                                    )} />
                                    
                                    <Link
                                      href={item.href}
                                      className={cn(
                                        "flex items-center gap-3 pl-7 pr-3 py-2 rounded-lg text-sm font-medium transition-all ml-2",
                                        active
                                          ? `bg-gradient-to-r ${folder.gradient} text-white shadow-lg`
                                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                      )}
                                    >
                                      <div className={cn(
                                        "p-1 rounded-md",
                                        active ? "bg-white/20" : colors.bg
                                      )}>
                                        <ItemIcon className={cn(
                                          "h-3.5 w-3.5",
                                          active ? "text-white" : colors.text
                                        )} />
                                      </div>
                                      <span className="flex-1">{item.label}</span>
                                      {(item as any).badge && (
                                        <Badge variant="outline" className={cn(
                                          "text-[9px] px-1.5 py-0 h-4 border-0",
                                          active 
                                            ? "bg-white/20 text-white" 
                                            : `${colors.bg} ${colors.text}`
                                        )}>
                                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                                          {(item as any).badge}
                                        </Badge>
                                      )}
                                    </Link>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Admin Links */}
                {isAdmin && (
                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 px-3 py-2 mb-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Administration
                      </span>
                    </div>
                    
                    {isSuperAdmin && (
                      <Link
                        href="/admin"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          pathname?.startsWith("/admin")
                            ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg"
                            : "text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg",
                          pathname?.startsWith("/admin") ? "bg-white/20" : "bg-red-500/10"
                        )}>
                          <Cpu className={cn(
                            "h-4 w-4",
                            pathname?.startsWith("/admin") ? "text-white" : "text-red-500"
                          )} />
                        </div>
                        <span className="flex-1">Super Admin</span>
                        <Badge variant="outline" className={cn(
                          "text-[9px] px-1.5 py-0 h-4 border-0 font-bold",
                          pathname?.startsWith("/admin") 
                            ? "bg-white/20 text-white" 
                            : "bg-red-500/10 text-red-600"
                        )}>
                          ROOT
                        </Badge>
                      </Link>
                    )}
                    
                    {isCompanyAdmin && (
                      <Link
                        href="/company"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1",
                          pathname?.startsWith("/company")
                            ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg"
                            : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-lg",
                          pathname?.startsWith("/company") ? "bg-white/20" : "bg-blue-500/10"
                        )}>
                          <Building2 className={cn(
                            "h-4 w-4",
                            pathname?.startsWith("/company") ? "text-white" : "text-blue-500"
                          )} />
                        </div>
                        <span>Company Admin</span>
                      </Link>
                    )}

                    <Link
                      href="/settings"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1",
                        pathname?.startsWith("/settings")
                          ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        pathname?.startsWith("/settings") ? "bg-white/20" : "bg-slate-500/10"
                      )}>
                        <Settings className={cn(
                          "h-4 w-4",
                          pathname?.startsWith("/settings") ? "text-white" : "text-slate-400"
                        )} />
                      </div>
                      <span>Settings</span>
                    </Link>
                  </div>
                )}
              </nav>

              {/* AI Features Card */}
              <div className="px-4 pb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-pink-500/5 border border-violet-500/10">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Suite</p>
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-3.5 border-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 font-bold">
                          SOON
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Accounting AI • Invoice Processing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
