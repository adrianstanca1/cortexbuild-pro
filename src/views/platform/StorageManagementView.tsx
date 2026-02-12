
import React, { useState, useEffect } from 'react';
import { HardDrive, Folder, File, RefreshCw, BarChart } from 'lucide-react';
import { db } from '@/services/db';
import { useToast } from '@/contexts/ToastContext';

export const StorageManagementView: React.FC = () => {
    const { addToast } = useToast();
    const [buckets, setBuckets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadBuckets = async () => {
        setLoading(true);
        try {
            const data = await db.listBuckets();
            setBuckets(data.buckets || []);
        } catch (error) {
            console.error(error);
            addToast('Failed to load storage buckets', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBuckets();
    }, []);

    const totalUsage = (buckets || []).reduce((acc, b) => acc + (b.storageUsed || 0), 0);
    const totalUsageGB = (totalUsage / 1024 / 1024 / 1024).toFixed(2);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HardDrive className="text-indigo-500" /> Storage Management
            </h1>

            {/* Aggregated Stats */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
                <div>
                    <h3 className="text-indigo-900 dark:text-indigo-100 font-bold text-lg">Total Network Storage</h3>
                    <p className="text-indigo-600 dark:text-indigo-300 text-sm">Aggregated usage across all companies</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{totalUsageGB} <span className="text-lg text-indigo-400">GB</span></p>
                </div>
            </div>

            {/* Buckets List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Active Storage Buckets</h3>
                    <button
                        onClick={loadBuckets}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Company</th>
                                <th className="px-6 py-4">Bucket ID</th>
                                <th className="px-6 py-4">Usage</th>
                                <th className="px-6 py-4">Quota</th>
                                <th className="px-6 py-4">Fill Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {(buckets || []).length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-6 text-gray-400">No buckets found.</td></tr>
                            ) : (
                                (buckets || []).map(bucket => (
                                    <tr key={bucket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                                            {bucket.companyName}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                            {bucket.id}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-gray-200 font-medium">
                                            {bucket.usedGB} GB
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {Math.round(bucket.quota / 1024 / 1024 / 1024)} GB
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${Number(bucket.usagePercentage) > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${bucket.usagePercentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-gray-500">{bucket.usagePercentage}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
