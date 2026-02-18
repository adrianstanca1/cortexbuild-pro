'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCircle, FolderKanban, ListTodo, Users, FileText, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRealtime } from '@/hooks/use-realtime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  action: string;
  entityName?: string;
  message: string;
  projectName?: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  read: boolean;
}

const typeIcons: Record<string, typeof FolderKanban> = {
  project: FolderKanban,
  task: ListTodo,
  team_member: Users,
  document: FileText,
};

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced fetch to prevent excessive API calls on rapid real-time events
  const debouncedFetchNotifications = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchNotifications();
    }, 500); // Wait 500ms after last event
  }, [fetchNotifications]);

  // Real-time updates with debouncing
  useRealtime((event) => {
    if (event.type === 'activity_logged' || event.type === 'notification') {
      debouncedFetchNotifications();
    }
  });

  useEffect(() => {
    fetchNotifications();
    
    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Optimistic update already done; silently ignore network errors
    }
  };

  const getIcon = (type: string) => {
    const Icon = typeIcons[type] || Bell;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    !notification.read ? 'bg-purple-50/50' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    !notification.read ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.projectName && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        in {notification.projectName}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 bg-purple-500 rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 p-2">
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full">
                  View all activity
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
