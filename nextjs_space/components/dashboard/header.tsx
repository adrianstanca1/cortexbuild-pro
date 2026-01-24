'use client';

import { signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { LogOut, User, ChevronDown, Settings, Search, X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { NotificationsDropdown } from './notifications-dropdown';
import { MobileNav } from './mobile-nav';
import { ThemeToggleCompact } from '@/components/ui/theme-toggle';
import { KeyboardShortcutsModal, useKeyboardShortcuts } from '@/components/ui/keyboard-shortcuts';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <MobileNav userRole={userRole || user?.role} />
          <h1 className="text-lg font-semibold text-foreground hidden sm:block">Construction Management</h1>
        </div>

        <div className="flex items-center gap-2">
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
                    className="w-64 pr-8 bg-background"
                    data-search-input
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search Results Dropdown */}
                {(searchResults.length > 0 || isSearching) && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border border-border overflow-hidden z-50">
                    {isSearching ? (
                      <div className="p-4 text-center text-muted-foreground">Searching...</div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {searchResults.map((result: any) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSearchResultClick(result)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left transition-colors"
                          >
                            <div className={`p-2 rounded-lg ${
                              result.type === 'project' ? 'bg-blue-500/10 text-blue-500' :
                              result.type === 'task' ? 'bg-green-500/10 text-green-500' :
                              'bg-purple-500/10 text-purple-500'
                            }`}>
                              {result.type === 'project' ? '📁' : result.type === 'task' ? '✓' : '👤'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{result.name || result.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{result.type}</p>
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
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Search (/)" 
              >
                <Search className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 hover:bg-muted rounded-lg transition-colors hidden sm:flex"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggleCompact />

          {/* Notifications */}
          <NotificationsDropdown />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {(user?.name ?? 'U')?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground">{user?.name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg border border-border py-2 z-50 animate-slide-up">
                <div className="px-4 py-2 border-b border-border">
                  <p className="font-medium text-foreground">{user?.name ?? 'User'}</p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email ?? ''}</p>
                  <Badge variant="secondary" className="mt-1">{roleLabel}</Badge>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
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
