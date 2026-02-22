import React, { useState, useEffect } from 'react';
import { Plus, Clock, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { pcosApi, PCO } from '../../services/constructionApi';
import { useProjects } from '../../contexts/ProjectContext';
import PCOForm from '../../components/construction/PCOForm';
import ConvertPCOModal from '../../components/construction/ConvertPCOModal';

const PCOsView: React.FC = () => {
    const { activeProject } = useProjects();
    const [pcos, setPcos] = useState<PCO[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [showForm, setShowForm] = useState(false);
    const [convertingPco, setConvertingPco] = useState<PCO | null>(null);

    useEffect(() => {
        fetchData();
    }, [activeProject]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await pcosApi.getAll(activeProject?.id);
            setPcos(res.data);
        } catch (error) {
            console.error('Failed to fetch PCOs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterPCO = async (data: any) => {
        try {
            await pcosApi.create({
                ...data,
                projectId: activeProject!.id,
            });
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create PCO:', error);
        }
    };

    const handleConvertToCO = (pco: PCO) => {
        setConvertingPco(pco);
    };

    const handleConfirmConversion = async (data: any) => {
        try {
            // In a real app, we might update the PCO status and create the CO in one tx or sequence
            // Here we use the backend 'convert' endpoint which should handle both
            await pcosApi.convertToCO(convertingPco!.id);
            setConvertingPco(null);
            fetchData();
        } catch (error) {
            console.error('Failed to convert PCO:', error);
        }
    };

    const filteredPCOs = pcos.filter(pco =>
        filter === 'all' || pco.status === filter
    );

    const stats = {
        total: pcos.length,
        pending: pcos.filter(pco => pco.status === 'pending').length,
        converted: pcos.filter(pco => pco.status === 'converted').length,
        potentialCost: pcos.filter(pco => pco.status !== 'void').reduce((sum, pco) => sum + (pco.estimatedCost || 0), 0),
    };

    const getStatusColor = (status: PCO['status']) => {
        switch (status) {
            case 'converted': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'void': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Potential Change Orders (PCO)</h1>
                    <p className="text-gray-600 mt-1 uppercase text-xs font-black tracking-widest opacity-70">Register and track potential impact events</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-2xl font-black text-sm hover:bg-sky-700 transition-all shadow-lg hover:shadow-sky-500/20 active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    REGISTER PCO
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Events</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Pending Review</p>
                            <p className="text-3xl font-black text-yellow-600 mt-1">{stats.pending}</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-2xl">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Converted to CO</p>
                            <p className="text-3xl font-black text-indigo-600 mt-1">{stats.converted}</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <CheckCircle className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Estimated Exposure</p>
                            <p className="text-3xl font-black text-gray-900 mt-1">${stats.potentialCost.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-2xl">
                            <AlertTriangle className="h-6 w-6 text-rose-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    title="Filter PCOs by status"
                    aria-label="Filter PCOs by status"
                >
                    <option value="all">ALL PCOs</option>
                    <option value="draft">DRAFT</option>
                    <option value="pending">PENDING</option>
                    <option value="converted">CONVERTED</option>
                    <option value="void">VOID</option>
                </select>
            </div>

            <div className="space-y-4">
                {filteredPCOs.map((pco) => (
                    <div key={pco.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:border-sky-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-colors" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full uppercase tracking-tighter">PCO-{pco.pcoNumber}</span>
                                    <h3 className="text-xl font-black text-gray-900">{pco.title}</h3>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusColor(pco.status)}`}>
                                        {pco.status}
                                    </span>
                                </div>
                                <p className="text-gray-600 mt-4 leading-relaxed max-w-2xl">{pco.description}</p>
                                <div className="flex items-center gap-8 mt-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requested By</span>
                                        <span className="text-sm font-bold text-gray-900 mt-1">{pco.requestedBy}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Request Date</span>
                                        <span className="text-sm font-bold text-gray-900 mt-1">{new Date(pco.requestDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</span>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full mt-1 border ${pco.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            pco.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>{pco.priority.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-4">
                                <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 min-w-[180px]">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Cost Impact</p>
                                    <p className="text-2xl font-black text-rose-600 mt-1">
                                        ${pco.estimatedCost?.toLocaleString() || '0'}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-500 mt-1 tracking-tight">+{pco.estimatedDays || 0} Extension Days</p>
                                </div>
                                {pco.status === 'pending' && (
                                    <button
                                        onClick={() => handleConvertToCO(pco)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                    >
                                        <FileText size={14} />
                                        CONVERT TO CO
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredPCOs.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No potential change orders found</p>
                    </div>
                )}
            </div>

            {showForm && (
                <PCOForm
                    onSubmit={handleRegisterPCO}
                    onClose={() => setShowForm(false)}
                />
            )}

            {convertingPco && (
                <ConvertPCOModal
                    pco={convertingPco}
                    onSubmit={handleConfirmConversion}
                    onClose={() => setConvertingPco(null)}
                />
            )}
        </div>
    );
};

export default PCOsView;
