"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HardHat,
  LayoutDashboard,
  FolderKanban,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Shield,
  Building2,
  Truck,
  Calendar,
  Sparkles,
  Package,
  Coins,
  TrendingUp,
  AlertTriangle,
  Gauge,
  Award,
  Clock,
  Wallet,
  ClipboardList,
  FileSignature,
  Receipt,
  DollarSign,
  Calculator,
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
  PieChart,
  BookOpen,
  BadgeCheck,
  UserCheck,
  Blocks,
  Cpu,
  Bot,
  Eye,
  FolderOpen,
  FolderTree,
  FolderInput,
  FolderSearch,
  FolderSync,
  FolderCog,
  FolderHeart,
  FolderLock,
  Home,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/hooks/use-sidebar";

// Folder-schema navigation configuration
const navigationFolders = [
  {
    id: 'command',
    label: 'Command Centre',
    icon: FolderCog,
    iconOpen: FolderOpen,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, fileType: 'dashboard' },
      { href: '/executive', label: 'Executive Hub', icon: Gauge, fileType: 'analytics', adminOnly: true, badge: 'AI' },
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
      { href: '/projects', label: 'All Projects', icon: Blocks, fileType: 'folder', highlight: true },
      { href: '/work-packages', label: 'Work Packages', icon: Package, fileType: 'package' },
      { href: '/milestones', label: 'Milestones', icon: Target, fileType: 'milestone' },
      { href: '/tasks', label: 'Tasks', icon: CheckSquare, fileType: 'task' },
    ]
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: FolderHeart,
    iconOpen: FolderOpen,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    futureExpansion: true,
    items: [
      { href: '/budget', label: 'Budget Tracker', icon: Wallet, fileType: 'finance' },
      { href: '/cost-codes', label: 'Cost Codes', icon: Coins, fileType: 'codes' },
      { href: '/forecasting', label: 'Forecasting', icon: TrendingUp, fileType: 'chart', badge: 'AI' },
      { href: '/forecasting/cost-trends', label: 'Cost Trends', icon: PieChart, fileType: 'chart', badge: 'AI' },
      { href: '/forecasting/weather-impact', label: 'Weather Impact', icon: Activity, fileType: 'weather', badge: 'AI' },
      { href: '/progress-claims', label: 'Progress Claims', icon: Receipt, fileType: 'invoice' },
      { href: '/change-orders', label: 'Change Orders', icon: FileCheck, fileType: 'document' },
      { href: '/variations', label: 'Variations', icon: FileText, fileType: 'variation' },
      { href: '/payroll', label: 'Payroll', icon: DollarSign, fileType: 'payroll', adminOnly: true },
      { href: '/cis-calculator', label: 'CIS Calculator', icon: Calculator, fileType: 'calculator' },
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
      { href: '/daily-reports', label: 'Daily Reports', icon: ClipboardList, fileType: 'report' },
      { href: '/dayworks', label: 'Daywork Manager', icon: FileText, fileType: 'daywork' },
      { href: '/site-diary', label: 'Site Diary', icon: BookOpen, fileType: 'journal' },
      { href: '/time-tracking', label: 'Time Tracking', icon: Clock, fileType: 'time' },
      { href: '/meetings', label: 'Meetings', icon: Calendar, fileType: 'calendar' },
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
      { href: '/team', label: 'Team', icon: UserCheck, fileType: 'user' },
      { href: '/team/resource-scheduler', label: 'Resource Scheduler', icon: Calendar, fileType: 'scheduler', badge: 'AI' },
      { href: '/certifications', label: 'Certifications', icon: Award, fileType: 'certificate' },
      { href: '/equipment', label: 'Equipment', icon: Truck, fileType: 'equipment' },
      { href: '/materials', label: 'Materials', icon: Layers, fileType: 'inventory' },
      { href: '/materials/waste-tracker', label: 'Waste Tracker', icon: Activity, fileType: 'waste', badge: 'AI' },
      { href: '/subcontractors', label: 'Subcontractors', icon: Building2, fileType: 'company' },
      { href: '/subcontractors/analytics', label: 'Sub Analytics', icon: BarChart3, fileType: 'analytics', badge: 'AI' },
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
      { href: '/risk-assessments', label: 'Risk Register', icon: AlertTriangle, fileType: 'warning' },
      { href: '/safety', label: 'Safety Hub', icon: Shield, fileType: 'shield' },
      { href: '/safety/predictive-dashboard', label: 'Predictive Safety', icon: Brain, fileType: 'predict', badge: 'AI' },
      { href: '/safety/rams', label: 'RAMS Generator', icon: FileText, fileType: 'document', badge: 'AI' },
      { href: '/inspections', label: 'Inspections', icon: Eye, fileType: 'inspect' },
      { href: '/permits', label: 'Permits', icon: BadgeCheck, fileType: 'permit' },
      { href: '/defects', label: 'Defects', icon: Wrench, fileType: 'defect' },
      { href: '/punch-lists', label: 'Punch Lists', icon: CheckSquare, fileType: 'checklist' },
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
      { href: '/documents', label: 'Document Drive', icon: HardDrive, fileType: 'drive' },
      { href: '/documents/templates', label: 'Templates', icon: FileSignature, fileType: 'template' },
      { href: '/drawings', label: 'Drawings', icon: PenTool, fileType: 'drawing' },
      { href: '/rfis', label: 'RFIs', icon: FileQuestion, fileType: 'rfi' },
      { href: '/submittals', label: 'Submittals', icon: Send, fileType: 'submittal' },
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics & AI',
    icon: FolderSearch,
    iconOpen: FolderOpen,
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3, fileType: 'chart' },
      { href: '/ai-insights', label: 'AI Insights', icon: Sparkles, fileType: 'ai', badge: 'AI' },
      { href: '/ai-insights/document-generator', label: 'Doc Generator', icon: FileText, fileType: 'generator', badge: 'AI' },
      { href: '/ai-insights/photo-analysis', label: 'Photo Analysis', icon: Eye, fileType: 'photo', badge: 'AI' },
    ]
  }
];

// Color mappings for folder colors - Professional palette
const colorMappings: Record<string, { bg: string; text: string; border: string; iconBg: string; activeBg: string; shadow: string }> = {
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200/50 dark:border-violet-800/50',
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    activeBg: 'bg-violet-100 dark:bg-violet-900/30',
    shadow: 'shadow-violet-500/20'
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200/50 dark:border-blue-800/50',
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    activeBg: 'bg-blue-100 dark:bg-blue-900/30',
    shadow: 'shadow-blue-500/20'
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200/50 dark:border-emerald-800/50',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    activeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    shadow: 'shadow-emerald-500/20'
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200/50 dark:border-amber-800/50',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    activeBg: 'bg-amber-100 dark:bg-amber-900/30',
    shadow: 'shadow-amber-500/20'
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200/50 dark:border-pink-800/50',
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-500',
    activeBg: 'bg-pink-100 dark:bg-pink-900/30',
    shadow: 'shadow-pink-500/20'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200/50 dark:border-red-800/50',
    iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
    activeBg: 'bg-red-100 dark:bg-red-900/30',
    shadow: 'shadow-red-500/20'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200/50 dark:border-indigo-800/50',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    activeBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    shadow: 'shadow-indigo-500/20'
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200/50 dark:border-cyan-800/50',
    iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-500',
    activeBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    shadow: 'shadow-cyan-500/20'
  }
};

interface DashboardSidebarProps {
  userRole?: string;
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { isCollapsed: collapsed, toggleSidebar } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [hoverFolder, setHoverFolder] = useState<string | null>(null);
  
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const isCompanyAdmin = userRole === "COMPANY_OWNER" || userRole === "ADMIN";
  const isAdmin = isSuperAdmin || isCompanyAdmin;

  // Initialize expanded folders based on current path
  useEffect(() => {
    setMounted(true);
    const initialExpanded: Record<string, boolean> = {};
    navigationFolders.forEach(folder => {
      const hasActiveItem = folder.items.some(item => 
        pathname === item.href || pathname?.startsWith(item.href + '/')
      );
      if (hasActiveItem) {
        initialExpanded[folder.id] = true;
      }
    });
    // Default expand command and projects
    initialExpanded['command'] = true;
    initialExpanded['projects'] = true;
    setExpandedFolders(initialExpanded);
  }, [pathname]);

  const toggleFolder = useCallback((folderId: string) => {
    if (collapsed) return;
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  }, [collapsed]);

  const isItemActive = useCallback((href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  }, [pathname]);

  const isFolderActive = useCallback((folder: typeof navigationFolders[0]) => {
    return folder.items.some(item => isItemActive(item.href));
  }, [isItemActive]);

  if (!mounted) {
    return null;
  }

  const renderNavItem = (item: any, folderColor: string, gradient: string, isLast: boolean) => {
    if ((item as any).adminOnly && !isAdmin) return null;
    
    const active = isItemActive(item.href);
    const colors = colorMappings[folderColor];
    const ItemIcon = item.icon;
    
    return (
      <div key={item.href} className="relative">
        {/* Tree line connector */}
        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
        {!isLast && <div className="absolute left-[11px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />}
        
        <Link
          href={item.href}
          className={cn(
            "group relative flex items-center gap-3 pl-7 pr-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ml-2",
            active
              ? `bg-gradient-to-r ${gradient} text-white shadow-lg shadow-${folderColor}-500/25`
              : `text-slate-600 dark:text-slate-400 hover:${colors.activeBg} hover:text-slate-900 dark:hover:text-white`
          )}
        >
          {/* Horizontal connector line */}
          <div className={cn(
            "absolute left-0 top-1/2 w-5 h-px",
            active ? "bg-white/50" : "bg-slate-200 dark:bg-slate-700"
          )} />
          
          {/* File icon with dot */}
          <div className={cn(
            "relative flex items-center justify-center w-5 h-5 rounded-md transition-all",
            active ? "bg-white/20" : colors.bg
          )}>
            <ItemIcon className={cn(
              "h-3.5 w-3.5 transition-all",
              active ? "text-white" : colors.text
            )} />
          </div>
          
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <Badge variant="outline" className={cn(
                  "text-[9px] px-1.5 py-0 h-4 border-0 font-semibold",
                  active 
                    ? "bg-white/20 text-white" 
                    : `${colors.bg} ${colors.text}`
                )}>
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  {item.badge}
                </Badge>
              )}
              {item.highlight && !active && (
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </>
          )}
        </Link>
      </div>
    );
  };

  const renderFolder = (folder: typeof navigationFolders[0]) => {
    const isExpanded = expandedFolders[folder.id];
    const isActive = isFolderActive(folder);
    const isHovered = hoverFolder === folder.id;
    const colors = colorMappings[folder.color];
    const FolderIcon = isExpanded || isHovered ? folder.iconOpen : folder.icon;
    
    // Filter items based on role
    const visibleItems = folder.items.filter(item => !(item as any).adminOnly || isAdmin);
    if (visibleItems.length === 0) return null;

    return (
      <div key={folder.id} className="mb-1">
        {/* Folder Header */}
        <button
          onClick={() => toggleFolder(folder.id)}
          onMouseEnter={() => setHoverFolder(folder.id)}
          onMouseLeave={() => setHoverFolder(null)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            collapsed ? "justify-center" : "",
            isActive || isHovered
              ? `${colors.bg} ${colors.text}`
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          )}
          title={collapsed ? folder.label : undefined}
        >
          {/* Folder Icon */}
          <div className={cn(
            "relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
            isActive || isHovered || isExpanded ? colors.bg : "bg-slate-100 dark:bg-slate-800",
            isExpanded && "scale-105"
          )}>
            <FolderIcon className={cn(
              "h-5 w-5 transition-all duration-200",
              isActive || isHovered || isExpanded ? colors.text : "text-slate-400 dark:text-slate-500"
            )} />
            {/* Folder badge indicator */}
            {isActive && (
              <div className={cn(
                "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
                colors.iconBg
              )} />
            )}
          </div>
          
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{folder.label}</span>
              {folder.futureExpansion && (
                <Badge variant="outline" className={cn(
                  "text-[8px] px-1 py-0 h-3.5 border-0 font-bold",
                  `${colors.bg} ${colors.text}`
                )}>
                  <Bot className="h-2 w-2 mr-0.5" />
                  AI
                </Badge>
              )}
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-300 text-slate-400",
                isExpanded ? "rotate-180" : ""
              )} />
            </>
          )}
        </button>

        {/* Folder Contents - Tree View */}
        {!collapsed && (
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
                  {/* Main vertical tree line */}
                  <div className="absolute left-[19px] top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-700" />
                  
                  {visibleItems.map((item, index) => 
                    renderNavItem(item, folder.color, folder.gradient, index === visibleItems.length - 1)
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen z-50 transition-all duration-300",
          "hidden lg:flex lg:flex-col",
          "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800",
          "shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Logo Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-xl blur-md opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="relative bg-gradient-to-br from-primary via-purple-500 to-pink-500 p-2.5 rounded-xl shadow-lg">
                <HardHat className="h-6 w-6 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl border-2 border-white/20 animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white tracking-tight">CortexBuild</span>
                  <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-lg shadow-orange-500/25">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wider uppercase">
                  Construction Platform
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => toggleSidebar()}
            className={cn(
              "p-2 rounded-xl transition-all duration-200",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
              "border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* System Status Bar */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="relative">
                <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">System Active</span>
              <div className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-500 font-mono">v2.0</div>
            </div>
          </div>
        )}

        {/* Navigation - Folder Tree */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {/* Root indicator */}
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <Home className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Navigation
              </span>
            </div>
          )}
          
          {navigationFolders.map(folder => renderFolder(folder))}

          {/* Admin Section */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
              {!collapsed && (
                <div className="flex items-center gap-2 px-3 py-2 mb-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Administration
                  </span>
                </div>
              )}
              
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    pathname?.startsWith("/admin")
                      ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400"
                  )}
                  title={collapsed ? "Super Admin" : undefined}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg transition-all",
                    pathname?.startsWith("/admin") ? "bg-white/20" : "bg-red-500/10"
                  )}>
                    <Cpu className={cn(
                      "h-4 w-4",
                      pathname?.startsWith("/admin") ? "text-white" : "text-red-500"
                    )} />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1">Super Admin</span>
                      <Badge variant="outline" className={cn(
                        "text-[9px] px-1.5 py-0 h-4 border-0 font-bold",
                        pathname?.startsWith("/admin")
                          ? "bg-white/20 text-white"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      )}>
                        ROOT
                      </Badge>
                    </>
                  )}
                </Link>
              )}

              {isCompanyAdmin && (
                <Link
                  href="/company"
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-1",
                    pathname?.startsWith("/company")
                      ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400"
                  )}
                  title={collapsed ? "Company Admin" : undefined}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg transition-all",
                    pathname?.startsWith("/company") ? "bg-white/20" : "bg-blue-500/10"
                  )}>
                    <Building2 className={cn(
                      "h-4 w-4",
                      pathname?.startsWith("/company") ? "text-white" : "text-blue-500"
                    )} />
                  </div>
                  {!collapsed && <span className="flex-1">Company Admin</span>}
                </Link>
              )}

              {/* Deployment - visible to all admins */}
              <Link
                href="/deployment"
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-1",
                  pathname?.startsWith("/deployment")
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                    : "text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:text-purple-600 dark:hover:text-purple-400"
                )}
                title={collapsed ? "Deployment" : undefined}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-all",
                  pathname?.startsWith("/deployment") ? "bg-white/20" : "bg-purple-500/10"
                )}>
                  <HardDrive className={cn(
                    "h-4 w-4",
                    pathname?.startsWith("/deployment") ? "text-white" : "text-purple-500"
                  )} />
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1">Deployment</span>
                    <Badge variant="outline" className={cn(
                      "text-[9px] px-1.5 py-0 h-4 border-0 font-bold",
                      pathname?.startsWith("/deployment")
                        ? "bg-white/20 text-white"
                        : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    )}>
                      OPS
                    </Badge>
                  </>
                )}
              </Link>

              {/* Settings */}
              <Link
                href="/settings"
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-1",
                  pathname?.startsWith("/settings")
                    ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                )}
                title={collapsed ? "Settings" : undefined}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-all",
                  pathname?.startsWith("/settings") ? "bg-white/20" : "bg-slate-500/10"
                )}>
                  <Settings className={cn(
                    "h-4 w-4",
                    pathname?.startsWith("/settings") ? "text-white" : "text-slate-400"
                  )} />
                </div>
                {!collapsed && <span className="flex-1">Settings</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* Future Features Card */}
        {!collapsed && (
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
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Accounting AI • Invoice Processing • Predictive Analytics
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  ?
                </kbd>
                <span>Shortcuts</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                <FolderTree className="h-3 w-3" />
                <span>Folder View</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
