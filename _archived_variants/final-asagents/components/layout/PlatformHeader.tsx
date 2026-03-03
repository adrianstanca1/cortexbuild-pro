import React from 'react';
import { User, View } from '../../types';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { Button } from '../ui/Button';
import {
    Search,
    HelpCircle,
    Building2,
    Menu
} from 'lucide-react';

interface PlatformHeaderProps {
    user: User | null;
    activeView: View;
    setActiveView: (view: View) => void;
    onToggleSidebar?: () => void;
}

export const PlatformHeader: React.FC<PlatformHeaderProps> = ({
    user,
    activeView,
    setActiveView,
    onToggleSidebar
}) => {
    const handleNavigate = (url: string) => {
        // Extract view from URL and navigate
        const viewMap: Record<string, View> = {
            '/projects': 'projects',
            '/tasks': 'tasks',
            '/equipment': 'equipment',
            '/expenses': 'expenses',
            '/safety': 'safety',
            '/ai': 'ai',
            '/settings': 'settings'
        };

        const view = viewMap[url];
        if (view) {
            setActiveView(view);
        }
    };

    const getViewTitle = (view: View): string => {
        const titles: Record<View, string> = {
            dashboard: 'Dashboard',
            projects: 'Projects',
            tasks: 'Tasks',
            equipment: 'Equipment',
            expenses: 'Expenses',
            safety: 'Safety',
            ai: 'AI Assistant',
            settings: 'Settings',
            map: 'Map View',
            time: 'Time Tracking',
            invoices: 'Invoices',
            clients: 'Clients',
            team: 'Team',
            timetracking: 'Time Tracking',
            timesheets: 'Timesheets',
            analytics: 'Analytics',
            chat: 'Chat',
            documents: 'Documents',
            audit: 'Audit Log',
            procurement: 'Procurement',
            reports: 'Reports',
            templates: 'Templates'
        };
        return titles[view] || view.charAt(0).toUpperCase() + view.slice(1);
    };

    if (!user) return null;

    return (
        <header className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
                {/* Left Side */}
                <div className="flex items-center gap-4">
                    {/* Mobile menu button (for responsive design) */}
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Logo and current view */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center lg:hidden">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">
                                {getViewTitle(activeView)}
                            </h1>
                            <p className="text-sm text-gray-500 hidden sm:block">
                                Construction Management Platform
                            </p>
                        </div>
                    </div>
                </div>

                {/* Center - Search (for future implementation) */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search projects, tasks, equipment..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    {/* Help Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex"
                        onClick={() => setActiveView('ai')}
                        aria-label="Get help"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </Button>

                    {/* Notifications */}
                    <NotificationCenter onNavigate={handleNavigate} />

                    {/* User Avatar */}
                    <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {user.role}
                            </p>
                        </div>
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};