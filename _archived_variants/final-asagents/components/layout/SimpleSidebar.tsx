import React from 'react';
import { User, View } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../notifications/NotificationCenter';
import {
  Home,
  FolderOpen,
  CheckSquare,
  Wrench,
  Shield,
  DollarSign,
  Bot,
  Settings,
  LogOut,
  Building2,
  BarChart3
} from 'lucide-react';

interface SimpleSidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  user: User | null;
}

interface NavItemProps {
  view: View;
  label: string;
  icon: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
  count?: number;
}

const NavItem: React.FC<NavItemProps> = ({ view, label, icon, activeView, setActiveView, count }) => (
  <button
    onClick={() => setActiveView(view)}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${activeView === view
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 hover:bg-gray-100'
      }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
    {count && count > 0 && (
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);

export const SimpleSidebar: React.FC<SimpleSidebarProps> = ({ activeView, setActiveView, user }) => {
  const { logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  const navigationItems: NavItemProps[] = [
    {
      view: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      activeView,
      setActiveView,
    },
    {
      view: 'projects',
      label: 'Projects',
      icon: <FolderOpen className="w-5 h-5" />,
      activeView,
      setActiveView,
    },
    {
      view: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="w-5 h-5" />,
      activeView,
      setActiveView,
    },
    {
      view: 'equipment',
      label: 'Equipment',
      icon: <Wrench className="w-5 h-5" />,
      activeView,
      setActiveView,
    },
    {
      view: 'expenses',
      label: 'Expenses',
      icon: <DollarSign className="w-5 h-5" />,
      activeView,
      setActiveView,
    },
    {
      view: 'safety',
      label: 'Safety',
      icon: <Shield className="w-5 h-5" />,
      activeView,
      setActiveView,
    },
    {
      view: 'ai',
      label: 'AI Assistant',
      icon: <Bot className="w-5 h-5" />,
      activeView,
      setActiveView,
    },
    {
      view: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="w-5 h-5" />,
      activeView,
      setActiveView,
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">AS Agents</h1>
            <p className="text-xs text-gray-500">Construction Platform</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Main Navigation
          </p>
          {navigationItems.map((item) => (
            <NavItem key={item.view} {...item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => setActiveView('settings' as View)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeView === 'settings'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'
            }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
};