import React from 'react';
import {
  Briefcase, Bot, LayoutDashboard, FolderOpen, CheckSquare, Users, Clock, FileText,
  Shield, Wrench, PoundSterling, MessageSquare, Map, Cpu, LineChart,
  ClipboardCheck, ShoppingCart, UserCheck, Package, Calendar, PieChart, FileBarChart,
  HardHat, Zap, Lock, Code, Store, Wand2, Monitor, HardHat as LogoIcon, Navigation, LogOut,
  BrainCircuit, Building2, X, Settings as SettingsIcon, Eye, Workflow, Scan, Brain, Download,
  Truck, FileEdit, Camera, CloudRain, Layers, UserCog, AlertTriangle, ChevronRight
} from 'lucide-react';
import { Page, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useModules, CompanyModule } from '@/contexts/ModuleContext';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, isOpen = false, onClose }) => {
  const { user, logout, stopImpersonating, isImpersonating } = useAuth();
  const { systemSettings } = useTenant();
  const { isConnected, onlineUsers } = useWebSocket();
  const { hasModule } = useModules();

  const betaPages = [Page.IMAGINE, Page.ML_INSIGHTS, Page.RESOURCE_OPTIMIZATION, Page.AI_TOOLS];

  // Module requirements for each page
  const pageModules: Partial<Record<Page, CompanyModule>> = {
    [Page.AI_TOOLS]: CompanyModule.AI_TOOLS,
    [Page.IMAGINE]: CompanyModule.AI_TOOLS,
    [Page.PREDICTIVE_ANALYSIS]: CompanyModule.AI_TOOLS,
    [Page.FINANCIALS]: CompanyModule.FINANCIALS,
    [Page.ACCOUNTING_HUB]: CompanyModule.FINANCIALS,
    [Page.TENANT_ANALYTICS]: CompanyModule.ANALYTICS,
    [Page.CLIENT_PORTAL]: CompanyModule.CLIENT_PORTAL,
    [Page.COMPLIANCE]: CompanyModule.COMPLIANCE_TRACKING,
    [Page.SCHEDULE]: CompanyModule.GANTT_CHARTS,
  };

  const menuGroups = [
    {
      title: 'Strategic Control',
      items: [
        { id: Page.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE], permissions: ['dashboard.view'] },
        { id: Page.PROJECTS, label: 'Portfolio', icon: FolderOpen, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE], permissions: ['projects.view'] },
        { id: Page.TASKS, label: 'Vector Ledger', icon: CheckSquare, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE], permissions: ['tasks.view'] },
        { id: Page.SCHEDULE, label: 'Timeline', icon: Calendar, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR], permissions: ['schedule.view'] },
        { id: Page.AUTOMATIONS, label: 'Automations', icon: Workflow, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN], permissions: ['automations.manage'] },
        { id: Page.TEAM, label: 'Human Capital', icon: Users, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR], permissions: ['team.view'] },
        { id: Page.CHAT, label: 'Neural Assistant', icon: Bot, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE], permissions: ['chat.use'] },
      ]
    },
    {
      title: 'Construction',
      items: [
        { id: Page.LIVE_PROJECT_MAP, label: 'Live Project Map', icon: Navigation, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE], permissions: ['projects.view'] },
        { id: Page.INSPECTIONS, label: 'Site Inspections', icon: ClipboardCheck, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR, UserRole.OPERATIVE], permissions: ['construction.inspections'] },
        { id: Page.MATERIALS, label: 'Materials', icon: Truck, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR], permissions: ['construction.materials'] },
        { id: Page.CHANGE_ORDERS, label: 'Change Orders', icon: FileEdit, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR], permissions: ['construction.changeorders'] },
      ]
    },
    {
      title: 'Finance',
      items: [
        { id: Page.ACCOUNTING_HUB, label: 'Accounting Hub', icon: Briefcase, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN], permissions: ['financials.read'] },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { id: Page.PREDICTIVE_ANALYSIS, label: 'Predictive Risk', icon: Brain, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN], permissions: ['analytics.predictive'] },
        { id: Page.IMAGINE, label: 'Imagine Studio', icon: Wand2, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN, UserRole.SUPERVISOR], permissions: ['ai.imagine'] },
        { id: Page.AI_TOOLS, label: 'AI Synthesis', icon: Cpu, roles: [UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN], permissions: ['ai.tools'] },
      ]
    }
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-white/5 flex flex-col flex-shrink-0 overflow-hidden transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
      md:relative md:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

      {/* Brand Header */}
      <div className="p-8 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-2xl z-20 border-b border-white/5">
        <div
          className="flex items-center gap-4 cursor-pointer group"
          onClick={() => setPage(Page.DASHBOARD)}
        >
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-gray-950 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform group-hover:scale-110">
            <Cpu size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-white tracking-widest leading-none">CORTEX</span>
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-1 ml-0.5">Systems</span>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden p-2 text-zinc-500 hover:text-white transition-colors" title="Close Sidebar">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-8 space-y-10 relative z-10">
        {/* User Identity Integrated */}
        {user && (
          <div className="px-2">
            <div className="p-5 bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] border border-white/5 group hover:bg-white/[0.05] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                  {user.avatarInitials}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-black text-white truncate tracking-tight uppercase">{user.name}</div>
                  <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5 opacity-70">
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Navigation */}
        <nav className="space-y-10 pb-10">
          {menuGroups.map((group, groupIndex) => {
            const visibleItems = group.items.filter(item => {
              const hasRole = user && item.roles.includes(user.role);
              const isBeta = betaPages.includes(item.id);
              if (!systemSettings.betaFeatures && isBeta) return false;
              const requiredModule = pageModules[item.id as Page];
              if (requiredModule && !hasModule(requiredModule)) return false;
              return hasRole;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIndex} className="space-y-3">
                <div className="px-4 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-2">
                  {group.title}
                </div>
                <div className="space-y-1.5">
                  {visibleItems.map((item) => {
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.label}
                        onClick={() => { setPage(item.id as Page); if (onClose) onClose(); }}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all relative rounded-2xl group ${isActive
                          ? 'text-white bg-indigo-600/90 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] border border-indigo-500/50'
                          : 'text-zinc-500 hover:text-white hover:bg-white/[0.03]'
                          }`}
                      >
                        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                          <item.icon size={18} strokeWidth={2.5} className={isActive ? 'text-white' : 'text-zinc-600 group-hover:text-indigo-400'} />
                        </div>
                        <span className="truncate">{item.label}</span>
                        {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* System Actions Area */}
      <div className="p-6 bg-zinc-950/80 backdrop-blur-3xl border-t border-white/5 relative z-20">
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-rose-500 hover:bg-rose-500/5 transition-all group"
        >
          <LogOut size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
          <span>Exit System</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
