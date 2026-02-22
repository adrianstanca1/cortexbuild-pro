import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Clock, CheckCircle, XCircle, FileText, AlertTriangle, ShieldCheck, PlayCircle } from 'lucide-react';
import { changeOrdersApi, ChangeOrder } from '../../services/constructionApi';
import { useProjects } from '../../contexts/ProjectContext';
import ChangeOrderForm from '../../components/construction/ChangeOrderForm';

const ChangeOrdersView: React.FC = () => {
    const { activeProject } = useProjects();
    const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeProject]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await changeOrdersApi.getAll(activeProject?.id);
            setChangeOrders(res.data.changeOrders);
        } catch (error) {
            console.error('Failed to fetch change orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCO = async (data: any) => {
        try {
            await changeOrdersApi.create({
                ...data,
                projectId: activeProject!.id,
            });
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create change order:', error);
        }
    };

    const handleApprove = async (id: string) => {
        if (!window.confirm('Are you sure you want to approve this change order? This will modify the contract value.')) return;
        try {
            await changeOrdersApi.approve(id);
            fetchData();
        } catch (error) {
            console.error('Failed to approve change order:', error);
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm('Are you sure you want to reject this change order?')) return;
        try {
            await changeOrdersApi.reject(id);
            fetchData();
        } catch (error) {
            console.error('Failed to reject change order:', error);
        }
    };

    const handleExecute = async (id: string) => {
        if (!window.confirm('Are you sure you want to execute this change order? This will finalize the budget adjustment.')) return;
        try {
            await changeOrdersApi.execute(id);
            fetchData();
        } catch (error) {
            console.error('Failed to execute change order:', error);
        }
    };

    const filteredOrders = changeOrders.filter(co =>
        filter === 'all' || co.status === filter
    );

    const stats = {
        total: changeOrders.length,
        pending: changeOrders.filter(co => co.status === 'pending').length,
        approved: changeOrders.filter(co => co.status === 'approved' || co.status === 'executed').length,
        netImpact: changeOrders.filter(co => co.status !== 'rejected').reduce((sum, co) => sum + co.costDelta, 0),
    };

    const getStatusColor = (status: ChangeOrder['status']) => {
        switch (status) {
            case 'executed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'approved': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Contract Change Orders (CO)</h1>
                    <p className="text-gray-600 mt-1 uppercase text-xs font-black tracking-widest opacity-70">Formal scope modifications and contract ledger</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    INITIATE CHANGE ORDER
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Variances</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Awaiting Approval</p>
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
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Executed Ledger</p>
                            <p className="text-3xl font-black text-emerald-600 mt-1">{changeOrders.filter(co => co.status === 'executed').length}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                            <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Net Budget Impact</p>
                            <p className={`text-3xl font-black mt-1 ${stats.netImpact >= 0 ? 'text-gray-900' : 'text-emerald-600'}`}>
                                {stats.netImpact >= 0 ? '+' : ''}${stats.netImpact.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <DollarSign className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    title="Filter Change Orders by status"
                >
                    <option value="all">ALL CHANGE ORDERS</option>
                    <option value="pending">PENDING</option>
                    <option value="approved">APPROVED</option>
                    <option value="executed">EXECUTED</option>
                    <option value="rejected">REJECTED</option>
                </select>
            </div>

            <div className="space-y-4">
                {filteredOrders.map((co) => (
                    <div key={co.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
                        <div className="flex justify-between items-start relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full uppercase tracking-tighter">{co.coNumber}</span>
                                    <h3 className="text-xl font-black text-gray-900">{co.title}</h3>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusColor(co.status)}`}>
                                        {co.status}
                                    </span>
                                </div>
                                <p className="text-gray-600 mt-4 leading-relaxed max-w-2xl">{co.description}</p>
                                <div className="flex items-center gap-8 mt-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason for Change</span>
                                        <span className="text-sm font-bold text-gray-900 mt-1">{co.reasonForChange || 'Project Optimization'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Created On</span>
                                        <span className="text-sm font-bold text-gray-900 mt-1">{new Date(co.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {co.approvedAt && (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Approved At</span>
                                            <span className="text-sm font-bold text-emerald-600 mt-1">{new Date(co.approvedAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-4 min-w-[240px]">
                                <div className="bg-zinc-900 px-8 py-5 rounded-[2rem] border border-white/10 shadow-xl relative overflow-hidden group/impact">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover/impact:opacity-100 transition-opacity" />
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contract Delta</p>
                                        <p className={`text-2xl font-black mt-1 ${co.costDelta >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {co.costDelta >= 0 ? '+' : ''}${co.costDelta.toLocaleString()}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Clock className="h-3 w-3 text-zinc-400" />
                                            <p className="text-[10px] font-bold text-zinc-400 tracking-tight">
                                                {co.daysDelta >= 0 ? '+' : ''}{co.daysDelta} Extension Days
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {co.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleReject(co.id)}
                                                className="p-3 bg-zinc-50 text-rose-500 rounded-2xl border border-zinc-100 hover:bg-rose-50 transition-all group/btn"
                                                title="Reject Change Order"
                                            >
                                                <XCircle className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(co.id)}
                                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                <ShieldCheck size={14} />
                                                APPROVE CO
                                            </button>
                                        </>
                                    )}
                                    {co.status === 'approved' && (
                                        <button
                                            onClick={() => handleExecute(co.id)}
                                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                                        >
                                            <PlayCircle size={14} />
                                            EXECUTE & UPDATE BUDGET
                                        </button>
                                    )}
                                    {co.status === 'executed' && (
                                        <div className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-zinc-200">
                                            <ShieldCheck size={14} />
                                            LEDGER ACCESSED
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredOrders.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No change orders found</p>
                    </div>
                )}
            </div>

            {showForm && (
                <ChangeOrderForm
                    onSubmit={handleCreateCO}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
};

export default ChangeOrdersView;
