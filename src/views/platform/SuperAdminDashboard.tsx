import React, { useState, useEffect } from 'react';
import {
    Users,
    ShieldAlert,
    Flag,
    BarChart3,
    Activity,
    HeartPulse,
    LayoutDashboard,
    Bell,
    Settings,
    Terminal
} from 'lucide-react';
import ActivityMonitor from '@/components/ActivityMonitor';
import SystemHealthDashboard from '@/components/SystemHealthDashboard';
import SuperAdminUsersPanel from '@/components/SuperAdminUsersPanel';
import QuickActionsPanel from '@/components/QuickActionsPanel';
import AuditLogViewer from '@/components/AuditLogViewer';
import FeatureFlagManager from '@/components/FeatureFlagManager';
import { PlatformLogsPanel } from '@/components/PlatformLogsPanel';
import { PlatformSettingsPanel } from '@/components/PlatformSettingsPanel';
import { DatabaseTerminal } from '@/components/DatabaseTerminal';
import { SupportTicketsPanel } from '@/components/SupportTicketsPanel';
import { db } from '@/services/db';
import { Lock, LifeBuoy, Database } from 'lucide-react';

const SuperAdminDashboard: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'features' | 'logs' | 'settings' | 'terminal' | 'support'>('users');

    useEffect(() => {
        const checkOnlineStatus = () => {
            setIsOnline(navigator.onLine);
            if (navigator.onLine) setLastUpdate(new Date());
        };

        window.addEventListener('online', checkOnlineStatus);
        window.addEventListener('offline', checkOnlineStatus);

        const interval = setInterval(() => {
            if (navigator.onLine) setLastUpdate(new Date());
        }, 30000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', checkOnlineStatus);
            window.removeEventListener('offline', checkOnlineStatus);
        };
    }, []);

    const tabs = [
        { id: 'users', label: 'User Directory', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'audit', label: 'Security Audit', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'features', label: 'Feature Flags', icon: Flag, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'logs', label: 'System Logs', icon: Terminal, color: 'text-slate-600', bg: 'bg-slate-100' },
        { id: 'terminal', label: 'DB Terminal', icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'support', label: 'Support Desk', icon: LifeBuoy, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'settings', label: 'Platform Config', icon: Settings, color: 'text-rose-600', bg: 'bg-rose-50' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="animate-in fade-in slide-in-from-left duration-500">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-indigo-600" />
                            Platform Command Center
                        </h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2 font-medium">
                            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                            {isOnline ? 'System is fully operational' : 'Platform connectivity issues detected'}
                            <span className="text-slate-300 mx-2">|</span>
                            Last synced: {lastUpdate.toLocaleTimeString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500">
                        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm group hover:border-indigo-200 transition-all">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Environment</div>
                            <div className="text-sm font-bold text-indigo-600 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                PRODUCTION CLUSTER
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance & Health Layer */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <ActivityMonitor />
                    <SystemHealthDashboard />
                </div>

                {/* Management Layer */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar: Quick Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <QuickActionsPanel />

                        {/* Tab Switcher (Vertical on Large) */}
                        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                        ? `${tab.bg} ${tab.color} shadow-sm ring-1 ring-inset ring-slate-200`
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? '' : 'text-slate-400'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Main Content: Tabbed Panels */}
                    <div className="lg:col-span-3 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'users' && <SuperAdminUsersPanel />}
                        {activeTab === 'audit' && <AuditLogViewer />}
                        {activeTab === 'features' && <FeatureFlagManager />}
                        {activeTab === 'logs' && <PlatformLogsPanel />}
                        {activeTab === 'terminal' && <DatabaseTerminal />}
                        {activeTab === 'support' && <SupportTicketsPanel />}
                        {activeTab === 'settings' && <PlatformSettingsPanel />}
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400 tracking-widest uppercase">
                    <p>© 2026 CortexBuild Pro Intelligence Unit. System v2.1.0-Phase3</p>
                    <div className="flex items-center gap-8">
                        <button className="hover:text-indigo-600 transition-colors flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5" />
                            Notifications
                        </button>
                        <button className="hover:text-indigo-600 transition-colors flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5" />
                            Security Protocol
                        </button>
                        <button className="hover:text-indigo-600 transition-colors flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5" />
                            Global Config
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
