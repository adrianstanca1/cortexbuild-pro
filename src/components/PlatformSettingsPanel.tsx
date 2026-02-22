import React, { useState, useEffect } from 'react';
import {
    Settings,
    Shield,
    Globe,
    Key,
    Save,
    ShieldCheck,
    Clock,
    Mail,
    Cpu,
    ToggleLeft,
    RefreshCcw,
    Palette,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { db } from '../services/db';
import { useToast } from '../contexts/ToastContext';

interface SystemConfig {
    maintenanceMode: boolean;
    allowRegistrations: boolean;
    globalBeta: boolean;
    platformName: string;
    supportEmail: string;
    primaryColor: string;
    apiKeys: {
        googleMaps: string;
        sendGrid: string;
        openAi: string;
        gemini?: string;
    };
    enforce2FA: boolean;
    sessionIpLock: boolean;
    strictCsp: boolean;
    auditLogging: boolean;
    aiEngine: 'gemini' | 'openai' | 'anthropic';
    demoInstances: boolean;
}

export const PlatformSettingsPanel: React.FC = () => {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<'general' | 'security' | 'integrations' | 'advanced'>('general');
    const toast = useToast();

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const data = await db.getPlatformConfig();
            setConfig(data);
        } catch (error) {
            console.error('Failed to fetch platform config:', error);
            toast.error('Failed to load platform settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await db.updatePlatformConfig(config);
            toast.success('Platform settings updated successfully');
        } catch (error) {
            console.error('Failed to update config:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const verifyIntegration = async (type: 'email' | 'push' | 'ai') => {
        toast.info(`Verifying ${type} configuration...`);
        try {
            let res;
            if (type === 'email') res = await db.verifyEmailConfig();
            else if (type === 'push') res = await db.verifyPushConfig();
            else res = await db.verifyAiConfig();

            if (res.success) {
                toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} integration verified!`);
            } else {
                toast.error(`Verification failed: ${res.error}`);
            }
        } catch (error: any) {
            toast.error(`Verification failed: ${error.message}`);
        }
    };

    const handleServiceAction = async (action: 'flushCache' | 'restart' | 'backup') => {
        const msg = action === 'flushCache' ? 'Flushing cache...' : action === 'restart' ? 'Restarting services...' : 'Creating backup...';
        toast.info(msg);
        try {
            let res;
            if (action === 'flushCache') res = await db.flushSystemCache();
            else if (action === 'restart') res = await db.restartServices();
            else res = await db.triggerDatabaseBackup();

            if (res.success) {
                toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} action completed successfully`);
            } else {
                toast.error(`Action failed: ${res.error || 'Unknown error'}`);
            }
        } catch (err: any) {
            toast.error(`Operation failed: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <RefreshCcw className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                <p className="font-medium">Loading platform configuration...</p>
            </div>
        );
    }

    if (!config) return null;

    const navItems = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'integrations', label: 'Integrations', icon: Key },
        { id: 'advanced', label: 'Advanced', icon: Cpu }
    ];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row h-full min-h-[600px]">
                {/* Left Sidebar Nav */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === item.id
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}

                    <div className="pt-8 mt-8 border-t border-slate-200 space-y-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-100"
                        >
                            {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeSection === 'general' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Platform Branding</h3>
                                <p className="text-sm text-slate-500">Customize how your platform appears to users.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Name</label>
                                    <input
                                        type="text"
                                        value={config.platformName}
                                        onChange={(e) => setConfig({ ...config, platformName: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Support Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                            type="email"
                                            value={config.supportEmail}
                                            onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Color</label>
                                    <div className="flex gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg shadow-inner border border-slate-200"
                                            style={{ backgroundColor: config.primaryColor }}
                                        />
                                        <input
                                            type="text"
                                            value={config.primaryColor}
                                            onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="flex gap-3">
                                        <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-indigo-900">Public Registrations</p>
                                            <p className="text-xs text-indigo-700">Allow new companies to sign up on the platform</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, allowRegistrations: !config.allowRegistrations })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${config.allowRegistrations ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.allowRegistrations ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Security & Privacy</h3>
                                <p className="text-sm text-slate-500">Configure global security policies and access controls.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="flex gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <ShieldCheck className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Enforce Multi-Factor Authentication</p>
                                            <p className="text-xs text-slate-500">Require all users to setup 2FA to access the platform</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, enforce2FA: !config.enforce2FA })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${config.enforce2FA ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.enforce2FA ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="flex gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Clock className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Strict IP Pinning</p>
                                            <p className="text-xs text-slate-500">Invalidate sessions if user IP address changes</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, sessionIpLock: !config.sessionIpLock })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${config.sessionIpLock ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.sessionIpLock ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="flex gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Shield className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Enhanced Audit Logging</p>
                                            <p className="text-xs text-slate-500">Record all read operations and metadata access</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, auditLogging: !config.auditLogging })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${config.auditLogging ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.auditLogging ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'integrations' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Platform Integrations</h3>
                                <p className="text-sm text-slate-500">Management and verification of global API keys.</p>
                            </div>

                            <div className="space-y-6">
                                {/* SendGrid */}
                                <div className="p-5 border border-slate-200 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">SG</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">SendGrid Email</p>
                                                <p className="text-xs text-slate-500">Platform-wide transactional emails</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => verifyIntegration('email')}
                                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Test Connection
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="SendGrid API Key"
                                        value={config.apiKeys.sendGrid}
                                        onChange={(e) => setConfig({ ...config, apiKeys: { ...config.apiKeys, sendGrid: e.target.value } })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                    />
                                </div>

                                {/* AI Engine */}
                                <div className="p-5 border border-slate-200 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">AI</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">AI Compute Engine</p>
                                                <p className="text-xs text-slate-500">Google Gemini / OpenAI orchestration</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={config.aiEngine}
                                                onChange={(e) => setConfig({ ...config, aiEngine: e.target.value as any })}
                                                className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                            >
                                                <option value="gemini">Google Gemini</option>
                                                <option value="openai">OpenAI GPT-4</option>
                                            </select>
                                            <button
                                                onClick={() => verifyIntegration('ai')}
                                                className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Test Connection
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Primary AI API Key (Gemini/OpenAI)"
                                        value={config.apiKeys.gemini || config.apiKeys.openAi}
                                        onChange={(e) => setConfig({ ...config, apiKeys: { ...config.apiKeys, gemini: e.target.value, openAi: e.target.value } })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'advanced' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Advanced Controls</h3>
                                <p className="text-sm text-slate-500">High-impact platform actions and emergency controls.</p>
                            </div>

                            <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-rose-600 rounded-xl text-white shadow-lg shadow-rose-200">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-base font-bold text-rose-900">Global Maintenance Mode</h4>
                                            <button
                                                onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                                                className={`w-14 h-7 rounded-full transition-all relative ${config.maintenanceMode ? 'bg-rose-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${config.maintenanceMode ? 'left-8' : 'left-1'}`} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-rose-700 mt-1">If enabled, ALL platform access will be blocked except for SuperAdmins. Users will see a maintenance message via real-time WebSocket alert.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleServiceAction('flushCache')}
                                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group text-left"
                                >
                                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <RefreshCcw className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">Flush System Cache</p>
                                    <p className="text-xs text-slate-500">Invalidate all server-side redis/memory caches</p>
                                </button>

                                <button
                                    onClick={() => handleServiceAction('backup')}
                                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group text-left"
                                >
                                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <Save className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">Trigger DB Backup</p>
                                    <p className="text-xs text-slate-500">Run immediate encrypted snapshot of all tables</p>
                                </button>

                                <button
                                    onClick={() => handleServiceAction('restart')}
                                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-rose-500 hover:shadow-md transition-all group text-left"
                                >
                                    <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                        <RefreshCcw className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">Restart Backend</p>
                                    <p className="text-xs text-slate-500">Perform a graceful rolling restart of all nodes</p>
                                </button>
                            </div>

                            <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active System Parameters</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 text-[11px] font-mono">
                                    <div className="text-slate-500">NODE_ENV</div>
                                    <div className="text-slate-300">production</div>
                                    <div className="text-slate-500">API_VERSION</div>
                                    <div className="text-slate-300">v2.1.0-release</div>
                                    <div className="text-slate-500">AUTH_MECHANISM</div>
                                    <div className="text-slate-300">JWT + RSA256</div>
                                    <div className="text-slate-500">DB_ENGINE</div>
                                    <div className="text-slate-300">SQLite + MySQL (Hybrid)</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
