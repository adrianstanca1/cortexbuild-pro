import React, { useState, useEffect } from 'react';
import {
    Plus, FileText, CheckCircle, XCircle, Clock, AlertTriangle,
    Eye, Send, Edit, Trash2, History, Download, X, Search,
    Filter, Calendar, User, FileCheck, Layers
} from 'lucide-react';
import { submittalsApi, Submittal } from '../../services/constructionApi';
import { useProjects } from '../../contexts/ProjectContext';
import SubmittalForm from '../../components/construction/SubmittalForm';

const SubmittalsView: React.FC = () => {
    const { activeProject } = useProjects();
    const [submittals, setSubmittals] = useState<Submittal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedSubmittal, setSelectedSubmittal] = useState<Submittal | undefined>();
    const [reviewingSubmittal, setReviewingSubmittal] = useState<Submittal | null>(null);
    const [reviewStatus, setReviewStatus] = useState<Submittal['status']>('Approved');
    const [reviewComments, setReviewComments] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        if (activeProject) {
            fetchData();
        }
    }, [activeProject]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await submittalsApi.getAll(activeProject?.id);
            setSubmittals(res.data);
        } catch (error) {
            console.error('Failed to fetch submittals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmittal = async (data: Partial<Submittal>) => {
        try {
            if (selectedSubmittal) {
                await submittalsApi.update(selectedSubmittal.id, data);
            } else {
                await submittalsApi.create({
                    ...data,
                    projectId: activeProject!.id,
                });
            }
            setShowForm(false);
            setSelectedSubmittal(undefined);
            fetchData();
        } catch (error) {
            console.error('Failed to save submittal:', error);
            throw error;
        }
    };

    const handleSubmitForReview = async (id: string) => {
        if (!confirm('Submit this submittal for review? The project manager will be notified.')) return;

        try {
            await submittalsApi.submit(id);
            fetchData();
        } catch (error) {
            console.error('Failed to submit submittal:', error);
            alert('Failed to submit submittal for review');
        }
    };

    const handleReview = async () => {
        if (!reviewingSubmittal) return;

        try {
            await submittalsApi.review(reviewingSubmittal.id, reviewStatus, reviewComments);
            setReviewingSubmittal(null);
            setReviewComments('');
            fetchData();
        } catch (error) {
            console.error('Failed to review submittal:', error);
            alert('Failed to submit review');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this submittal? This action cannot be undone.')) return;

        try {
            await submittalsApi.delete(id);
            fetchData();
        } catch (error: any) {
            console.error('Failed to delete submittal:', error);
            alert(error.response?.data?.error || 'Failed to delete submittal');
        }
    };

    const stats = {
        total: submittals.length,
        draft: submittals.filter(s => s.status === 'Draft').length,
        pending: submittals.filter(s => s.status === 'Pending Review').length,
        approved: submittals.filter(s => s.status === 'Approved' || s.status === 'Approved as Noted').length,
        rejected: submittals.filter(s => s.status === 'Rejected').length,
        resubmit: submittals.filter(s => s.status === 'Revise and Resubmit').length,
    };

    const filteredSubmittals = submittals.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.specSection?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter = filterType === 'all' || s.status === filterType;
        return matchesSearch && matchesFilter;
    });

    const getStatusStyles = (status: Submittal['status']) => {
        switch (status) {
            case 'Approved':
            case 'Approved as Noted':
                return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: CheckCircle };
            case 'Pending Review':
                return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: Clock };
            case 'Draft':
                return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', icon: FileText };
            case 'Revise and Resubmit':
                return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: History };
            case 'Rejected':
                return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: XCircle };
            default:
                return { bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-100', icon: FileText };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Loading Submittals...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-zinc-900 text-white rounded-2xl shadow-xl shadow-zinc-900/10">
                            <Layers size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Documentation Engine</span>
                    </div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Submittals & Shop Drawings</h1>
                    <p className="text-zinc-500 mt-2 font-bold text-sm max-w-xl">
                        Streamline your approval process with version control and real-time revision tracking for all project submittals.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedSubmittal(undefined);
                        setShowForm(true);
                    }}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:scale-95 group"
                    title="New Submittal"
                    aria-label="Create a new submittal"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                    NEW SUBMITTAL
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                    { label: 'Total Files', value: stats.total, color: 'zinc', icon: FileCheck },
                    { label: 'Pending', value: stats.pending, color: 'amber', icon: Clock },
                    { label: 'Approved', value: stats.approved, color: 'emerald', icon: CheckCircle },
                    { label: 'Revision', value: stats.resubmit, color: 'orange', icon: History },
                    { label: 'Rejected', value: stats.rejected, color: 'rose', icon: XCircle },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 hover:shadow-xl hover:shadow-zinc-500/5 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{idx + 1}</span>
                        </div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-zinc-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-md p-4 rounded-[2.5rem] border border-zinc-100">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="SEARCH BY NUMBER, TITLE OR SPEC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest placeholder:text-zinc-300 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Filter className="text-zinc-400 ml-2" size={16} />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="flex-1 md:flex-none px-6 py-4 bg-zinc-50 border-none rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none text-zinc-600 min-w-[180px]"
                        title="Filter by Status"
                    >
                        <option value="all">ALL STATUSES</option>
                        <option value="Draft">DRAFT</option>
                        <option value="Pending Review">PENDING REVIEW</option>
                        <option value="Approved">APPROVED</option>
                        <option value="Approved as Noted">APPROVED AS NOTED</option>
                        <option value="Revise and Resubmit">REVISE & RESUBMIT</option>
                        <option value="Rejected">REJECTED</option>
                    </select>
                </div>
            </div>

            {/* Submittals List */}
            <div className="grid grid-cols-1 gap-6">
                {filteredSubmittals.map((submittal) => {
                    const styles = getStatusStyles(submittal.status);
                    const StatusIcon = styles.icon;

                    return (
                        <div key={submittal.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 hover:shadow-2xl hover:shadow-zinc-500/10 transition-all group overflow-hidden relative">
                            {/* Decorative Background Element */}
                            <div className={`absolute top-0 right-0 w-32 h-32 ${styles.bg} opacity-20 blur-3xl -mr-16 -mt-16 transition-all group-hover:opacity-40 rounded-full`}></div>

                            <div className="relative flex flex-col lg:flex-row justify-between lg:items-center gap-8">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <div className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            {submittal.number}
                                        </div>
                                        <div className={`flex items-center gap-2 px-4 py-2 ${styles.bg} ${styles.text} rounded-xl text-[10px] font-black border ${styles.border} uppercase tracking-widest`}>
                                            <StatusIcon size={12} />
                                            {submittal.status}
                                        </div>
                                        {submittal.revision > 1 && (
                                            <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black border border-amber-100 uppercase tracking-widest flex items-center gap-2">
                                                <History size={12} />
                                                REV {submittal.revision}
                                            </div>
                                        )}
                                        <div className="px-4 py-2 bg-zinc-50 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                            {submittal.type}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-zinc-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                                        {submittal.title}
                                    </h3>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Spec Section</p>
                                            <div className="flex items-center gap-2 text-zinc-600">
                                                <FileText size={14} className="text-zinc-400" />
                                                <span className="text-sm font-bold uppercase tracking-tight">{submittal.specSection || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Submitted Date</p>
                                            <div className="flex items-center gap-2 text-zinc-600">
                                                <Calendar size={14} className="text-zinc-400" />
                                                <span className="text-sm font-bold uppercase tracking-tight">{new Date(submittal.dateSubmitted).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Due Date</p>
                                            <div className="flex items-center gap-2 text-zinc-600">
                                                <Clock size={14} className="text-zinc-400" />
                                                <span className="text-sm font-bold uppercase tracking-tight">{submittal.dueDate ? new Date(submittal.dueDate).toLocaleDateString() : 'NO DEADLINE'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Submitter</p>
                                            <div className="flex items-center gap-2 text-zinc-600">
                                                <User size={14} className="text-zinc-400" />
                                                <span className="text-sm font-bold uppercase tracking-tight truncate max-w-[120px]">{submittal.submitterName || 'Team Member'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {submittal.reviewedDate && (
                                        <div className="mt-8 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 border-dashed relative overflow-hidden group/review">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-2xl ${styles.bg} ${styles.text}`}>
                                                        <StatusIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Final Status Notes</p>
                                                        <p className="text-xs font-bold text-zinc-700 mt-1 leading-relaxed">
                                                            {submittal.notes || 'Status confirmed with standard project compliance requirements.'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-left md:text-right shrink-0">
                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reviewed By</p>
                                                    <p className="text-xs font-black text-zinc-900 uppercase tracking-widest mt-1">
                                                        {submittal.reviewerName || 'Project Manager'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Pane */}
                                <div className="flex items-center gap-3 shrink-0 lg:flex-col lg:bg-zinc-50 lg:p-3 lg:rounded-[2rem] transition-all group-hover:bg-zinc-100">
                                    {submittal.documentUrl && (
                                        <a
                                            href={submittal.documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-4 bg-white text-zinc-400 hover:text-emerald-600 rounded-2xl shadow-sm border border-zinc-100 hover:border-emerald-200 transition-all hover:scale-105"
                                            title="View Documentation"
                                            aria-label="View submittal document"
                                        >
                                            <Eye size={22} />
                                        </a>
                                    )}

                                    {submittal.status === 'Draft' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setSelectedSubmittal(submittal);
                                                    setShowForm(true);
                                                }}
                                                className="p-4 bg-white text-zinc-400 hover:text-amber-500 rounded-2xl shadow-sm border border-zinc-100 hover:border-amber-200 transition-all hover:scale-105"
                                                title="Edit Draft"
                                                aria-label="Edit submittal draft"
                                            >
                                                <Edit size={22} />
                                            </button>
                                            <button
                                                onClick={() => handleSubmitForReview(submittal.id)}
                                                className="p-4 bg-white text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl shadow-sm border border-zinc-100 hover:border-emerald-500 transition-all hover:scale-105"
                                                title="Submit for Review"
                                                aria-label="Submit for review"
                                            >
                                                <Send size={22} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(submittal.id)}
                                                className="p-4 bg-white text-zinc-400 hover:text-rose-500 rounded-2xl shadow-sm border border-zinc-100 hover:border-rose-200 transition-all hover:scale-105"
                                                title="Delete Draft"
                                                aria-label="Delete submittal draft"
                                            >
                                                <Trash2 size={22} />
                                            </button>
                                        </>
                                    )}

                                    {submittal.status === 'Pending Review' && (
                                        <button
                                            onClick={() => {
                                                setReviewingSubmittal(submittal);
                                                setReviewStatus('Approved');
                                                setReviewComments('');
                                            }}
                                            className="p-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-105"
                                            title="Execute Review"
                                            aria-label="Review submittal"
                                        >
                                            <FileCheck size={22} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredSubmittals.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-zinc-200">
                        <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="h-10 w-10 text-zinc-200" />
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">No submittals active</h3>
                        <p className="text-zinc-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">Initialize your documentation engine to begin tracking</p>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <SubmittalForm
                    submittal={selectedSubmittal}
                    onSubmit={handleCreateSubmittal}
                    onClose={() => {
                        setShowForm(false);
                        setSelectedSubmittal(undefined);
                    }}
                />
            )}

            {/* Review Modal */}
            {reviewingSubmittal && (
                <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] transition-all">
                    <div className="bg-white rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full uppercase tracking-tighter">Workflow Action</span>
                                        <span className="px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest bg-amber-50 text-amber-600 border-amber-100">
                                            Status Update
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Review Submittal</h2>
                                    <p className="text-zinc-500 mt-2 font-bold text-sm">
                                        {reviewingSubmittal.number}: {reviewingSubmittal.title}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setReviewingSubmittal(null)}
                                    className="p-3 hover:bg-zinc-50 rounded-2xl transition-colors text-zinc-400 hover:text-zinc-900"
                                    title="Close review"
                                    aria-label="Close review modal"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                        Review Decision
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'Approved', label: 'APPROVED', color: 'emerald' },
                                            { id: 'Approved as Noted', label: 'AS NOTED', color: 'blue' },
                                            { id: 'Revise and Resubmit', label: 'REVISE', color: 'orange' },
                                            { id: 'Rejected', label: 'REJECTED', color: 'rose' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setReviewStatus(opt.id as Submittal['status'])}
                                                className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all ${reviewStatus === opt.id
                                                    ? `bg-${opt.color}-50 border-${opt.color}-500 text-${opt.color}-600`
                                                    : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                        Review Comments & Feedback
                                    </label>
                                    <textarea
                                        value={reviewComments}
                                        onChange={(e) => setReviewComments(e.target.value)}
                                        rows={4}
                                        placeholder="PROVIDE FEEDBACK, REQUIRED CORRECTIONS, OR APPROVAL NOTES..."
                                        className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none min-h-[120px] resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-12">
                                <button
                                    onClick={() => setReviewingSubmittal(null)}
                                    className="flex-1 py-4 bg-zinc-50 text-zinc-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReview}
                                    className="flex-2 px-12 py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-zinc-900/20 active:scale-95"
                                >
                                    Confirm Decision
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmittalsView;
