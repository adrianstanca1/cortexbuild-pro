import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, CheckCircle, Clock, ShieldAlert, FileText, Camera } from 'lucide-react';
import { ncrApi, NCR } from '../../services/constructionApi';
import { useProjects } from '../../contexts/ProjectContext';
import NCRForm from '../../components/construction/NCRForm';

const NCRsView: React.FC = () => {
    const { activeProject } = useProjects();
    const [ncrs, setNcrs] = useState<NCR[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeProject]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await ncrApi.getAll(activeProject?.id);
            setNcrs(res.data);
        } catch (error) {
            console.error('Failed to fetch NCRs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInitiateNCR = async (data: any) => {
        try {
            await ncrApi.create({
                ...data,
                projectId: activeProject!.id,
                discoveredBy: 'Current User', // Demo fallback
            });
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to initiate NCR:', error);
        }
    };

    const handleResolveNCR = async (id: string) => {
        const action = prompt('Describe the corrective action taken:');
        if (!action) return;
        try {
            await ncrApi.resolve(id, { correctiveAction: action });
            fetchData();
        } catch (error) {
            console.error('Failed to resolve NCR:', error);
        }
    };

    const filteredNCRs = ncrs.filter(ncr =>
        filter === 'all' || ncr.status === filter
    );

    const stats = {
        total: ncrs.length,
        open: ncrs.filter(ncr => ncr.status === 'open').length,
        resolved: ncrs.filter(ncr => ncr.status === 'resolved').length,
        critical: ncrs.filter(ncr => ncr.severity === 'critical').length,
    };

    const getStatusColor = (status: NCR['status']) => {
        switch (status) {
            case 'open': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'in_progress': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'resolved': return 'bg-sky-100 text-sky-800 border-sky-200';
            case 'closed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSeverityIcon = (severity: NCR['severity']) => {
        switch (severity) {
            case 'critical': return <ShieldAlert className="h-5 w-5 text-rose-600" />;
            case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
            default: return <AlertTriangle className="h-5 w-5 text-amber-600" />;
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Non-Conformance Reports (NCR)</h1>
                    <p className="text-gray-600 mt-1 uppercase text-xs font-black tracking-widest opacity-70">Quality control and structural deviation management</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all shadow-lg hover:shadow-rose-500/20 active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    INITIATE NCR
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reports</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Open Defects</p>
                            <p className="text-3xl font-black text-rose-600 mt-1">{stats.open}</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-2xl">
                            <Clock className="h-6 w-6 text-rose-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Resolved</p>
                            <p className="text-3xl font-black text-sky-600 mt-1">{stats.resolved}</p>
                        </div>
                        <div className="p-3 bg-sky-50 rounded-2xl">
                            <CheckCircle className="h-6 w-6 text-sky-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Critical Risks</p>
                            <p className="text-3xl font-black text-rose-700 mt-1">{stats.critical}</p>
                        </div>
                        <div className="p-3 bg-zinc-50 rounded-2xl">
                            <ShieldAlert className="h-6 w-6 text-zinc-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                    title="Filter NCRs by status"
                    aria-label="Filter NCRs by status"
                >
                    <option value="all">ALL STATUSES</option>
                    <option value="open">OPEN</option>
                    <option value="in_progress">IN PROGRESS</option>
                    <option value="resolved">RESOLVED</option>
                    <option value="closed">CLOSED</option>
                </select>
            </div>

            <div className="space-y-4">
                {filteredNCRs.map((ncr) => (
                    <div key={ncr.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:border-rose-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-rose-500/10 transition-colors" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full uppercase tracking-tighter">NCR-{ncr.ncrNumber}</span>
                                    <h3 className="text-xl font-black text-gray-900">{ncr.title}</h3>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusColor(ncr.status)}`}>
                                        {ncr.status.replace('_', ' ')}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {getSeverityIcon(ncr.severity)}
                                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{ncr.severity}</span>
                                    </div>
                                </div>
                                <p className="text-gray-600 mt-4 leading-relaxed max-w-2xl">{ncr.description}</p>
                                <div className="flex items-center gap-8 mt-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discovered By</span>
                                        <span className="text-sm font-bold text-gray-900 mt-1">{ncr.discoveredBy}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discovery Date</span>
                                        <span className="text-sm font-bold text-gray-900 mt-1">{new Date(ncr.discoveredDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</span>
                                        <span className="text-sm font-bold text-gray-900 mt-1">{ncr.location || 'Site Wide'}</span>
                                    </div>
                                    {ncr.dueDate && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Due Date</span>
                                            <span className="text-sm font-bold text-rose-600 mt-1">{new Date(ncr.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                                {ncr.correctiveAction && (
                                    <div className="mt-6 p-5 bg-sky-50 rounded-2xl border border-sky-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="h-4 w-4 text-sky-600" />
                                            <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">Corrective Action Taken</span>
                                        </div>
                                        <p className="text-sm text-sky-800 leading-relaxed font-medium">{ncr.correctiveAction}</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-right flex flex-col items-end gap-4">
                                <div className="flex gap-2">
                                    <button className="p-3 bg-gray-50 text-gray-500 rounded-2xl border border-gray-100 hover:bg-white hover:text-sky-600 transition-all group/btn" title="Snap deficiency photo">
                                        <Camera className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                    <button className="p-3 bg-gray-50 text-gray-500 rounded-2xl border border-gray-100 hover:bg-white hover:text-sky-600 transition-all group/btn" title="View attachments">
                                        <FileText className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                </div>
                                {ncr.status === 'open' && (
                                    <button
                                        onClick={() => handleResolveNCR(ncr.id)}
                                        className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-700 transition-all shadow-lg shadow-sky-500/20"
                                    >
                                        <CheckCircle size={14} />
                                        RESOLVE DEFECT
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredNCRs.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                        <ShieldAlert className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No quality reports found</p>
                    </div>
                )}
            </div>

            {showForm && (
                <NCRForm
                    onSubmit={handleInitiateNCR}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
};

export default NCRsView;
