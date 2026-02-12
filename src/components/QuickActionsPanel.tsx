import React, { useState } from 'react';
import {
    Zap,
    Send,
    Trash2,
    Download,
    AlertOctagon,
    RefreshCw,
    Bell,
    MessageSquare,
    HardDrive,
    Activity,
    CheckCircle2,
    XCircle,
    Clock
} from 'lucide-react';
import { db } from '../services/db';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';

interface QuickActionsPanelProps {
    className?: string;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ className = "" }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastLevel, setBroadcastLevel] = useState<'info' | 'warning' | 'critical'>('info');
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        action: string | null;
        title: string;
        message: string;
        variant: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        action: null,
        title: '',
        message: '',
        variant: 'info'
    });

    const { success, error, info } = useToast();

    const handleAction = async (action: string) => {
        setLoading(action);
        try {
            switch (action) {
                case 'flush_cache':
                    await db.flushCache();
                    success('System cache flushed successfully');
                    break;
                case 'trigger_backup':
                    // Mock for now
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    success('Database backup initiated');
                    break;
                case 'broadcast':
                    if (!broadcastMsg.trim()) {
                        info('Please enter a message to broadcast');
                        setLoading(null);
                        return;
                    }
                    await db.sendBroadcast(broadcastMsg, broadcastLevel);
                    success('Broadcast sent successfully');
                    setBroadcastMsg('');
                    break;
                case 'restart_services':
                    await db.restartServices();
                    success('Restart command sent to all services');
                    break;
            }
        } catch (err) {
            error(`Action failed: ${action}`);
            console.error(err);
        } finally {
            setLoading(null);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const initiateAction = (action: string) => {
        const configs: Record<string, { title: string, message: string, variant: 'danger' | 'warning' | 'info' }> = {
            flush_cache: {
                title: 'Flush System Cache',
                message: 'Are you sure you want to flush all system caches? This may temporarily slow down initial requests.',
                variant: 'warning'
            },
            trigger_backup: {
                title: 'Initiate Database Backup',
                message: 'This will create a full snapshot of the production database. It might take a few minutes.',
                variant: 'info'
            },
            restart_services: {
                title: 'Restart Platform Services',
                message: 'CRITICAL: This will initiate a rolling restart of all application services. Connected users may experience brief interruptions.',
                variant: 'danger'
            }
        };

        const config = configs[action];
        if (config) {
            setConfirmModal({
                isOpen: true,
                action,
                ...config
            });
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Platform Quick Actions</h2>
                    <p className="text-sm text-slate-500">Run critical system operations</p>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Broadcast Tool */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-500" />
                        System-Wide Broadcast
                    </label>
                    <div className="flex flex-col gap-3">
                        <textarea
                            placeholder="Type a message to send to all online users..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none h-20"
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {(['info', 'warning', 'critical'] as const).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setBroadcastLevel(level)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${broadcastLevel === level
                                            ? (level === 'info' ? 'bg-indigo-600 text-white' :
                                                level === 'warning' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white')
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => handleAction('broadcast')}
                                disabled={loading === 'broadcast' || !broadcastMsg.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {loading === 'broadcast' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send Broadcast
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => initiateAction('flush_cache')}
                        className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                            <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900">Flush Cache</div>
                            <div className="text-xs text-slate-500">Clear all system caches</div>
                        </div>
                    </button>

                    <button
                        onClick={() => initiateAction('trigger_backup')}
                        className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                            <HardDrive className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900">Create Backup</div>
                            <div className="text-xs text-slate-500">Initiate database snapshot</div>
                        </div>
                    </button>

                    <button
                        onClick={() => initiateAction('restart_services')}
                        className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50/30 transition-all group text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:bg-red-600 transition-colors">
                            <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900 text-red-600">Restart All</div>
                            <div className="text-xs text-slate-500">Full system rolling restart</div>
                        </div>
                    </button>

                    <button
                        onClick={() => info('Detailed logs coming soon')}
                        className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-left"
                    >
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                            <Activity className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900">System Logs</div>
                            <div className="text-xs text-slate-500">View real-time error stream</div>
                        </div>
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => handleAction(confirmModal.action!)}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />
        </div>
    );
};

export default QuickActionsPanel;
