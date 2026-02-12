import React, { useState, useEffect } from 'react';
import { Database, HardDrive, Shield, RefreshCw, Save, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { db } from '@/services/db';

interface DatabaseControlData {
    registry: {
        status: string;
        region: string;
        dbConnectionString?: string;
    };
    storage: {
        storageQuota: number;
        storageUsed: number;
    };
    usage: {
        apiCalls: number;
        storageBytes: number;
        activeUsers: number;
    };
}

interface DatabaseControlPanelProps {
    companyId: string;
}

const DatabaseControlPanel: React.FC<DatabaseControlPanelProps> = ({ companyId }) => {
    const [data, setData] = useState<DatabaseControlData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quotaGB, setQuotaGB] = useState<string>('10');
    const [dbStatus, setDbStatus] = useState<string>('ACTIVE');

    useEffect(() => {
        fetchData();
    }, [companyId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await db.getCompanyDatabaseControl(companyId);
            setData(result);
            setQuotaGB((result.storage.storageQuota / (1024 * 1024 * 1024)).toString());
            setDbStatus(result.registry.status);
        } catch (err: any) {
            console.error('Failed to fetch database control:', err);
            setError(err.message || 'Failed to fetch database control data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            await db.updateCompanyDatabaseControl(companyId, {
                storageQuota: parseFloat(quotaGB) * 1024 * 1024 * 1024,
                status: dbStatus
            });
            await fetchData();
        } catch (err: any) {
            console.error('Failed to update database control:', err);
            setError(err.message || 'Failed to update database control');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    const storageUsagePercent = Math.round((data.storage.storageUsed / data.storage.storageQuota) * 100);
    const isOverQuota = storageUsagePercent > 100;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-red-800">Error</h4>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Storage Management */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-gray-900">Storage Management</h4>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-sm text-gray-600">Current Usage</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(data.storage.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB
                                    <span className="text-sm font-normal text-gray-500 ml-1">of {quotaGB} GB</span>
                                </p>
                            </div>
                            <span className={`text-sm font-bold px-2 py-1 rounded-full ${isOverQuota ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {storageUsagePercent}% Used
                            </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${isOverQuota ? 'bg-red-500' : 'bg-blue-500'
                                    }`}
                                style={{ width: `${Math.min(storageUsagePercent, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Adjust Storage Quota (GB)</label>
                        <div className="flex gap-4">
                            <input
                                type="number"
                                value={quotaGB}
                                onChange={(e) => setQuotaGB(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                min="1"
                                max="1000"
                            />
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Update Quota
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage Analytics */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-600" />
                        <h4 className="font-bold text-gray-900">Provisioning & Usage Analytics</h4>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                                <RefreshCw className="w-3.5 h-3.5" />
                                API Requests (24h)
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{data.usage.apiCalls.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">Total requests processed</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                                <HardDrive className="w-3.5 h-3.5" />
                                Storage Consumed
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{(data.usage.storageBytes / (1024 * 1024)).toFixed(2)} MB</p>
                            <p className="text-xs text-gray-500 mt-1">Assets, docs & database size</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                                <Shield className="w-3.5 h-3.5" />
                                Active Sessions
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{data.usage.activeUsers}</p>
                            <p className="text-xs text-gray-500 mt-1">Current concurrently active users</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Database Access */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-bold text-gray-900">Database Connectivity</h4>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${data.registry.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${data.registry.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        {data.registry.status}
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">Region</p>
                            <p className="text-sm font-medium text-indigo-900 uppercase">{data.registry.region}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Accessibility</p>
                            <p className="text-sm font-medium text-green-900">Dedicated Endpoint Available</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-900">Tenant Access Status</p>
                                <p className="text-sm text-gray-600">Control if the tenant can access their database instance.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setDbStatus('ACTIVE')}
                                    className={`px-4 py-1.5 rounded-md transition-all text-sm font-bold ${dbStatus === 'ACTIVE' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setDbStatus('MAINTENANCE')}
                                    className={`px-4 py-1.5 rounded-md transition-all text-sm font-bold ${dbStatus === 'MAINTENANCE' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Maintenance
                                </button>
                                <button
                                    onClick={() => setDbStatus('DISABLED')}
                                    className={`px-4 py-1.5 rounded-md transition-all text-sm font-bold ${dbStatus === 'DISABLED' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Disabled
                                </button>
                            </div>
                        </div>

                        {dbStatus !== data.registry.status && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between animate-in slide-in-from-top-2">
                                <p className="text-sm text-blue-700">Database status changes will affect tenant access immediately.</p>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
                                >
                                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Apply Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseControlPanel;
