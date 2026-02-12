
import React, { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, Trash2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { db } from '@/services/db';
import { useToast } from '@/contexts/ToastContext';

export const DatabaseManagementView: React.FC = () => {
    const { addToast } = useToast();
    const [stats, setStats] = useState<any>(null);
    const [backups, setBackups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [creatingBackup, setCreatingBackup] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const health = await db.getDatabaseHealth();
            const backupsData = await db.listDatabaseBackups();

            setStats(health);
            setBackups(backupsData.backups || []);
        } catch (error) {
            console.error(error);
            addToast('Failed to load database stats', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateBackup = async () => {
        setCreatingBackup(true);
        try {
            await db.createDatabaseBackup();
            addToast('Backup created successfully', 'success');
            loadData();
        } catch (error) {
            console.error(error);
            addToast('Backup creation failed', 'error');
        } finally {
            setCreatingBackup(false);
        }
    };

    const handleDownloadBackup = async (filename: string) => {
        try {
            await db.downloadDatabaseBackup(filename);
            addToast('Download started', 'success');
        } catch (error) {
            console.error(error);
            addToast('Download failed', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="text-blue-500" /> Database Management
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 mb-1">Database Size</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.databaseSizeMB || '0.00'} MB</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 mb-1">Total Tables</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalTables || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 mb-1">Query Latency</p>
                    <p className="text-2xl font-bold text-emerald-500">{stats?.queryLatency || '0ms'}</p>
                </div>
            </div>

            {/* Backups Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Backups & Snapshots</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={loadData}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={handleCreateBackup}
                            disabled={creatingBackup}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {creatingBackup ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
                            Create Backup
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Filename</th>
                                <th className="px-6 py-4">Created At</th>
                                <th className="px-6 py-4">Size</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {!(backups || []) || (backups || []).length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                        No backups found.
                                    </td>
                                </tr>
                            ) : (
                                (backups || []).map((backup) => (
                                    <tr key={backup.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <Database size={16} className="text-gray-400" />
                                            {backup.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(backup.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {backup.sizeMB} MB
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDownloadBackup(backup.name)}
                                                className="text-blue-500 hover:text-blue-700 font-medium text-xs flex items-center gap-1 ml-auto"
                                            >
                                                <Download size={12} />
                                                Download
                                            </button>
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
