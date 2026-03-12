'use client';

import { signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { LogOut, ChevronDown, Settings, Search, X, Keyboard, Cloud, Sun, CloudRain, CloudSnow, Loader2, MapPin, PanelLeft, PanelLeftClose } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationsDropdown } from './notifications-dropdown';
import { MobileNav } from './mobile-nav';
import { ThemeToggleCompact } from '@/components/ui/theme-toggle';
import { KeyboardShortcutsModal, useKeyboardShortcuts } from '@/components/ui/keyboard-shortcuts';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/hooks/use-sidebar';

// Compact Weather Component
function CompactWeather() {
  const [weather, setWeather] = useState<{ temp: number; code: number; location: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Default to London, UK for construction company
    const fetchWeather = async () => {
      try {
        const lat = 51.5074; // London
        const lon = -0.1278;
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Europe/London`
        );
        if (res.ok) {
          const data = await res.json();
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
            location: 'London'
          });
        }
      } catch (e) {
        console.error('Weather fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return <Sun className="h-4 w-4 text-yellow-500" />;
    if (code >= 2 && code <= 3) return <Cloud className="h-4 w-4 text-slate-400" />;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className="h-4 w-4 text-blue-500" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="h-4 w-4 text-blue-300" />;
    return <Cloud className="h-4 w-4 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-default">
            {getWeatherIcon(weather.code)}
            <span className="text-sm font-medium text-foreground">{weather.temp}°C</span>
            <span className="text-xs text-muted-foreground">{weather.location}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>Current weather in {weather.location}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    avatarUrl?: string | null;
  };
  userRole?: string;
}

const roleLabelMap: Record<string, string> = {
  ADMIN: 'Administrator',
  PROJECT_MANAGER: 'Project Manager',
  FIELD_WORKER: 'Field Worker',
  SUPER_ADMIN: 'Super Admin',
  COMPANY_OWNER: 'Company Owner'
};

export function DashboardHeader({ user, userRole }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts();
  const { collapsed, toggleSidebar } = useSidebar();

  const roleLabel = roleLabelMap[user?.role ?? 'FIELD_WORKER'] ?? 'Member';

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search functionality
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.results || []);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSearchResultClick = (result: any) => {
    setShowSearch(false);
    setSearchQuery('');
    if (result.type === 'project') {
      router.push(`/projects/${result.id}`);
    } else if (result.type === 'task') {
      router.push(`/tasks?taskId=${result.id}`);
    } else if (result.type === 'team') {
      router.push(`/team`);
    }
  };

  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <MobileNav userRole={userRole || user?.role} />
          
          {/* Sidebar Toggle Button - Desktop */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all duration-200"
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? (
                    <PanelLeft className="h-5 w-5" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <span>{collapsed ? 'Expand Menu' : 'Collapse Menu'}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="hidden sm:flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-sm">CB</span>
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900 dark:text-white">CortexBuild Pro</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Construction Platform</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            {showSearch ? (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search projects, tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-72 pr-8 bg-white dark:bg-slate-800 shadow-lg border-slate-200 dark:border-slate-700"
                    data-search-input
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search Results Dropdown */}
                {(searchResults.length > 0 || isSearching) && (
                  <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    {isSearching ? (
                      <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                        <span className="text-sm">Searching...</span>
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {searchResults.map((result: any) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                          >
                            <div className={`p-2.5 rounded-xl ${
                              result.type === 'project' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                              result.type === 'task' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' :
                              'bg-gradient-to-br from-violet-500 to-purple-500'
                            } text-white shadow-sm`}>
                              {result.type === 'project' ? '📁' : result.type === 'task' ? '✓' : '👤'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white truncate">{result.name || result.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{result.type}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                title="Search (/)" 
              >
                <Search className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            )}
          </div>

          {/* Weather Indicator */}
          <CompactWeather />

          {/* Keyboard Shortcuts */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors hidden sm:flex"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggleCompact />

          {/* Notifications */}
          <NotificationsDropdown />

          {/* Divider */}
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/25">
                {(user?.name ?? 'U')?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name ?? 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-fade-in-up">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-white">{user?.name ?? 'User'}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email ?? ''}</p>
                  <Badge variant="default" className="mt-2">{roleLabel}</Badge>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700">
                      <Settings className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <LogOut className="h-4 w-4" />
                    </div>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
    </>
  );
}
