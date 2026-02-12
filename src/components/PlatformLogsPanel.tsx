import React, { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCcw, Download, Trash2, AlertCircle, Clock, FileText } from 'lucide-react';
import { db } from '../services/db';
import { useToast } from '../contexts/ToastContext';

interface LogData {
    logs: string;
    exists: boolean;
    size?: number;
    lastUpdated?: string;
}

export const PlatformLogsPanel: React.FC = () => {
    const [data, setData] = useState<LogData | null>(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lines, setLines] = useState(200);
    const scrollRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    const fetchLogs = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const logsData = await db.getPlatformLogs(lines);
            setData(logsData);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            if (!silent) toast.error('Failed to connect to log server');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [lines]);

    useEffect(() => {
        let interval: any;
        if (autoRefresh) {
            interval = setInterval(() => fetchLogs(true), 5000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, lines]);

    useEffect(() => {
        if (scrollRef.current && data?.logs) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [data?.logs]);

    const formatSize = (bytes?: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const downloadLogs = () => {
        if (!data?.logs) return;
        const blob = new Blob([data.logs], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `platform-logs-${new Date().toISOString()}.log`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Logs ready for download');
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-indigo-500" />
                        Backend System Logs
                    </h2>
                    <p className="text-sm text-slate-500">Real-time output from stdout and stderr</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {[100, 200, 500, 1000].map((l) => (
                            <button
                                key={l}
                                onClick={() => setLines(l)}
                                className={`px-3 py-1 text-xs rounded-md transition-all ${lines === l
                                        ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {l} lines
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => fetchLogs()}
                        disabled={loading}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 border border-slate-200"
                        title="Refresh Logs"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={downloadLogs}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 border border-slate-200"
                        title="Download Logs"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 ml-2 px-3 py-1 border border-slate-200 rounded-lg bg-white">
                        <span className="text-xs font-medium text-slate-600">Auto-refresh</span>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Log File Size</p>
                        <p className="text-lg font-bold text-slate-900">{formatSize(data?.size)}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                        <Clock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Last Activity</p>
                        <p className="text-lg font-bold text-slate-900">
                            {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Server Environment</p>
                        <p className="text-lg font-bold text-slate-900">Production</p>
                    </div>
                </div>
            </div>

            <div className="relative group">
                <div
                    ref={scrollRef}
                    className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl h-[500px] overflow-y-auto p-4 font-mono text-sm leading-relaxed"
                >
                    {loading && !data ? (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            <RefreshCcw className="w-6 h-6 animate-spin mr-2" />
                            Initializing secure log stream...
                        </div>
                    ) : !data?.exists ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-8 bg-slate-900/50 rounded-lg">
                            <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
                            <h3 className="text-lg font-medium text-slate-300">Log file not found</h3>
                            <p className="max-w-md mt-2">The system could not locate `start_output.log` on the server root. This usually means the server was started manually without redirection.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {data.logs.split('\n').map((line, i) => {
                                let textColor = 'text-slate-300';
                                if (line.toLowerCase().includes('error')) textColor = 'text-red-400 font-medium';
                                else if (line.toLowerCase().includes('warn')) textColor = 'text-amber-300';
                                else if (line.toLowerCase().includes('success') || line.toLowerCase().includes('connected')) textColor = 'text-emerald-400';
                                else if (line.toLowerCase().includes('info')) textColor = 'text-blue-300';

                                return (
                                    <div key={i} className={`flex gap-4 hover:bg-white/5 transition-colors px-2 py-0.5 rounded ${textColor}`}>
                                        <span className="text-slate-600 select-none w-8 text-right font-light">{i + 1}</span>
                                        <span className="flex-1 whitespace-pre-wrap">{line || '\u00A0'}</span>
                                    </div>
                                );
                            })}
                            <div className="h-4" />
                        </div>
                    )}
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-slate-800/80 backdrop-blur-sm text-[10px] text-slate-400 px-2 py-1 rounded border border-slate-700 uppercase tracking-tighter">
                        Streaming Live from Remote
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <p className="font-semibold">Security Notice</p>
                    <p>Logs may contain sensitive platform data. Access to this tab is logged and strictly restricted to SuperAdmins. Do not share raw log output with unauthorized personnel.</p>
                </div>
            </div>
        </div>
    );
};
