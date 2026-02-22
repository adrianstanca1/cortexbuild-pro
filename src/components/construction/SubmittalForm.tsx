import React, { useState } from 'react';
import {
    X, Upload, FileText, AlertCircle, CheckCircle,
    Layers, Calendar, Info, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Submittal } from '../../services/constructionApi';

interface SubmittalFormProps {
    submittal?: Submittal;
    onSubmit: (data: Partial<Submittal>) => Promise<void>;
    onClose: () => void;
}

const SUBMITTAL_TYPES = [
    { value: 'Shop Drawing', label: 'SHOP DRAWING' },
    { value: 'Product Data', label: 'PRODUCT DATA' },
    { value: 'Sample', label: 'SAMPLE' },
    { value: 'Mix Design', label: 'MIX DESIGN' },
    { value: 'Test Report', label: 'TEST REPORT' },
    { value: 'Certificate', label: 'CERTIFICATE' },
];

const SubmittalForm: React.FC<SubmittalFormProps> = ({ submittal, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        number: submittal?.number || '',
        title: submittal?.title || '',
        type: submittal?.type || 'Shop Drawing',
        specSection: submittal?.specSection || '',
        dueDate: submittal?.dueDate?.split('T')[0] || '',
        documentUrl: submittal?.documentUrl || '',
        notes: submittal?.notes || '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.number || !formData.title || !formData.type) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            await onSubmit(formData);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save submittal');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-zinc-900 px-10 py-8 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                                <Layers size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Document Submission</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            {submittal ? 'Refine Submittal' : 'New Package Entry'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 p-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-2xl transition-all"
                        title="Close form"
                        aria-label="Close dialog"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-12">
                    {error && (
                        <div className="flex items-center gap-4 p-6 bg-rose-50 border border-rose-100 rounded-3xl text-rose-600 animate-in slide-in-from-top-4 duration-300">
                            <div className="p-2 bg-rose-100 rounded-xl">
                                <AlertCircle size={20} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-wider leading-relaxed">{error}</p>
                        </div>
                    )}

                    {/* Section: Metadata */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 opacity-40">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">01 Metadata Architecture</span>
                            <div className="h-px flex-1 bg-zinc-100"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1" htmlFor="submittal-number">
                                    Submittal ID <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="submittal-number"
                                    type="text"
                                    name="number"
                                    value={formData.number}
                                    onChange={handleChange}
                                    placeholder="e.g., S-001"
                                    title="Submittal Number"
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none placeholder:text-zinc-300"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1" htmlFor="submittal-type">
                                    Document Type <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    id="submittal-type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    title="Submittal Type"
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none text-zinc-600"
                                    required
                                >
                                    {SUBMITTAL_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1" htmlFor="submittal-title">
                                Package Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                id="submittal-title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Structural Steel Shop Drawings - Level 3"
                                title="Submittal Title"
                                className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none placeholder:text-zinc-300"
                                required
                            />
                        </div>
                    </div>

                    {/* Section: Logistics */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 opacity-40">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">02 Compliance & Logistics</span>
                            <div className="h-px flex-1 bg-zinc-100"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1" htmlFor="submittal-spec">
                                    Spec Section
                                </label>
                                <div className="relative group">
                                    <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                    <input
                                        id="submittal-spec"
                                        type="text"
                                        name="specSection"
                                        value={formData.specSection}
                                        onChange={handleChange}
                                        placeholder="05 12 00"
                                        title="Specification Section"
                                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none placeholder:text-zinc-300 uppercase tracking-widest"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1" htmlFor="submittal-due">
                                    Response Deadline
                                </label>
                                <div className="relative group">
                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                    <input
                                        id="submittal-due"
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        title="Due Date"
                                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-zinc-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 font-bold">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1" htmlFor="submittal-url">
                                Digital Asset URL
                            </label>
                            <div className="flex gap-4">
                                <div className="relative flex-1 group">
                                    <Upload className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                    <input
                                        id="submittal-url"
                                        type="url"
                                        name="documentUrl"
                                        value={formData.documentUrl}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        title="Document URL"
                                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none placeholder:text-zinc-300"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="px-8 py-4 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-zinc-900/10 flex items-center gap-2 shrink-0 h-[52px]"
                                    title="Upload File"
                                >
                                    UPLOAD
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section: Content */}
                    <div className="space-y-8 font-bold">
                        <div className="flex items-center gap-3 opacity-40">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">03 Descriptive Content</span>
                            <div className="h-px flex-1 bg-zinc-100"></div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1" htmlFor="submittal-notes">
                                Submittal Narrative & Notes
                            </label>
                            <textarea
                                id="submittal-notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={4}
                                placeholder="PROVIDE ADDITIONAL CONTEXT, SPECIAL REQUIREMENTS, OR MATERIAL DETAILS..."
                                title="Submittal Notes"
                                className="w-full px-6 py-6 bg-zinc-50 border-none rounded-[2rem] text-xs font-bold focus:ring-2 focus:ring-emerald-500 transition-all outline-none min-h-[150px] resize-none placeholder:text-zinc-300"
                            />
                        </div>
                    </div>

                    {/* Workflow Intelligence */}
                    <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                            <ShieldCheck size={80} className="text-emerald-600" />
                        </div>
                        <div className="relative z-10 flex gap-6">
                            <div className="p-4 bg-emerald-100 rounded-3xl h-fit">
                                <Info size={24} className="text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest mb-2">Automated Workflow Engine</h4>
                                <p className="text-[10px] text-emerald-700/80 font-bold uppercase tracking-widest leading-[1.8] max-w-md">
                                    Submittals remain in <strong className="text-emerald-900">Draft</strong> state until submission.
                                    Reviewers will receive instant notifications via the real-time connectivity layer upon entry updates.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col md:flex-row gap-4 pt-10 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-5 bg-zinc-50 text-zinc-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-all active:scale-95"
                            title="Cancel and close"
                        >
                            CANCEL CHANGES
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                            title={submittal ? 'Update Entry' : 'Create Entry'}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                            ) : (
                                <>
                                    {submittal ? 'REFINE ENTRY' : 'CREATE SUBMITTAL'}
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmittalForm;
