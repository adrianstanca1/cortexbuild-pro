import React, { useState, useRef, useEffect } from 'react';
import { Database, Play, AlertTriangle, Clock, History, Trash2, Copy, Search, Terminal as TerminalIcon, ShieldAlert } from 'lucide-react';
import { db } from '../services/db';
import { useToast } from '../contexts/ToastContext';

interface QueryHistory {
    query: string;
    timestamp: Date;
    duration: string;
    success: boolean;
}

export const DatabaseTerminal: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<QueryHistory[]>([]);
    const [destructiveWarning, setDestructiveWarning] = useState(false);
    const resultsEndRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    useEffect(() => {
        const savedHistory = localStorage.getItem('sql_history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory).map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })));
            } catch (e) {
                console.error('Failed to parse history');
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('sql_history', JSON.stringify(history));
    }, [history]);

    const scrollToResults = () => {
        resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const isDestructive = (q: string) => {
        const d = q.trim().toLowerCase();
        return d.startsWith('delete') || d.startsWith('drop') || d.startsWith('truncate') || d.startsWith('update');
    };

    const executeQuery = async (overrideWarning = false) => {
        if (!query.trim()) return;

        if (!overrideWarning && isDestructive(query)) {
            setDestructiveWarning(true);
            return;
        }

        setLoading(true);
        setDestructiveWarning(false);
        try {
            const res = await db.executeSql(query);
            setResults(res);
            setHistory(prev => [{
                query,
                timestamp: new Date(),
                duration: res.duration,
                success: res.success
            }, ...prev].slice(0, 50));

            if (res.success) {
                toast.success(`Query executed in ${res.duration}`);
                setTimeout(scrollToResults, 100);
            } else {
                toast.error(res.error || 'Query failed');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.info('Copied to clipboard');
    };

    const renderResultsTable = () => {
        if (!results?.result || !Array.isArray(results.result) || results.result.length === 0) {
            return (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    {results?.result?.changes !== undefined
                        ? `Operation successful. ${results.result.changes} rows affected.`
                        : 'No results to display or non-tabular data returned.'}
                </div>
            );
        }

        const columns = Object.keys(results.result[0]);

        return (
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-inner bg-white">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                            {columns.map(col => (
                                <th key={col} className="px-4 py-3 whitespace-nowrap uppercase tracking-wider text-[10px]">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {results.result.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                {columns.map(col => (
                                    <td key={col} className="px-4 py-2 font-mono text-slate-700 max-w-xs truncate">
                                        {row[col] === null ? <span className="text-slate-300 italic">NULL</span> : String(row[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Database className="w-5 h-5 text-emerald-500" />
                        SQL Diagnostic Terminal
                    </h2>
                    <p className="text-sm text-slate-500">Direct interface for platform database troubleshooting</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setHistory([]); localStorage.removeItem('sql_history'); }}
                        className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-slate-400 border border-slate-200"
                        title="Clear History"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor Column */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative group">
                        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                            <TerminalIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Query Editor</span>
                        </div>
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="SELECT * FROM companies LIMIT 10;"
                            className="w-full h-48 pt-10 px-4 pb-4 bg-slate-900 text-emerald-400 font-mono text-sm rounded-2xl border-2 border-slate-800 focus:border-indigo-500 outline-none shadow-2xl resize-none transition-all"
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <button
                                onClick={() => executeQuery()}
                                disabled={loading || !query.trim()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                            >
                                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                {loading ? 'Running...' : 'Run Query (F5)'}
                            </button>
                        </div>
                    </div>

                    {destructiveWarning && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-4 animate-in slide-in-from-top-2">
                            <div className="p-2 bg-rose-600 rounded-lg text-white">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-rose-900">Destructive Operation Detected</h4>
                                <p className="text-sm text-rose-700">This query will modify or delete data. Ensure you have a recent backup before proceeding.</p>
                                <div className="mt-3 flex gap-3">
                                    <button
                                        onClick={() => executeQuery(true)}
                                        className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
                                    >
                                        I Understand, Execute
                                    </button>
                                    <button
                                        onClick={() => setDestructiveWarning(false)}
                                        className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {results && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    Result Set
                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-mono">
                                        {results.duration}
                                    </span>
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => results.result && copyToClipboard(JSON.stringify(results.result, null, 2))}
                                        className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy JSON
                                    </button>
                                </div>
                            </div>
                            {renderResultsTable()}
                        </div>
                    )}
                </div>

                {/* History Column */}
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-400" />
                            Query History
                        </h3>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {history.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">No queries yet</p>
                                </div>
                            ) : (
                                history.map((h, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(h.query)}
                                        className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${h.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {h.success ? 'Success' : 'Failed'}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                {h.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-xs font-mono text-slate-700 line-clamp-2 mb-2">{h.query}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            <span>{h.duration}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="group-hover:text-indigo-600">Re-use Query</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-800">
                                <p className="font-bold">Dangerous Access</p>
                                <p className="mt-1">This tool bypasses ORM safety layers. Queries interact directly with the database engine. Verify all filters and constraints before execution.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div ref={resultsEndRef} />
        </div>
    );
};
