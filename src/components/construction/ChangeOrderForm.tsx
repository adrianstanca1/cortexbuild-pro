import React, { useState } from 'react';
import { X, DollarSign, Clock, FileText, PlusCircle, AlertCircle } from 'lucide-react';
import { ChangeOrder } from '../../services/constructionApi';

interface ChangeOrderFormProps {
    onSubmit: (data: Partial<ChangeOrder>) => void;
    onClose: () => void;
}

const ChangeOrderForm: React.FC<ChangeOrderFormProps> = ({ onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        reasonForChange: '',
        originalCost: 0,
        revisedCost: 0,
        originalDays: 0,
        revisedDays: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('Cost') || name.includes('Days') ? parseFloat(value) || 0 : value,
        }));
    };

    const costDelta = formData.revisedCost - formData.originalCost;
    const daysDelta = formData.revisedDays - formData.originalDays;

    return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-all">
            <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Formal Change Order</h2>
                            <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Scope & Budget Modification</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all" title="Close form">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                Change Order Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Structural Revision - Grid Line 4"
                                className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                Scope Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={3}
                                placeholder="Describe the detailed change in scope of work..."
                                className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="reasonForChange" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                Reason for Change
                            </label>
                            <input
                                id="reasonForChange"
                                type="text"
                                name="reasonForChange"
                                value={formData.reasonForChange}
                                onChange={handleChange}
                                placeholder="e.g. Unforeseen Ground Conditions"
                                className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">Financial Impact</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="originalCost" className="text-[10px] font-black text-zinc-400">Original Contract Value</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                            <input
                                                id="originalCost"
                                                type="number"
                                                name="originalCost"
                                                value={formData.originalCost}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-6 py-3 bg-zinc-50 border-none rounded-xl text-zinc-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="revisedCost" className="text-[10px] font-black text-zinc-400">Revised Contract Value</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                                            <input
                                                id="revisedCost"
                                                type="number"
                                                name="revisedCost"
                                                value={formData.revisedCost}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-6 py-3 bg-indigo-50/50 border-none rounded-xl text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zinc-900 rounded-2xl flex justify-between items-center shadow-lg">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Net Change</span>
                                        <span className={`text-sm font-black ${costDelta >= 0 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                            {costDelta >= 0 ? '+' : ''} ${costDelta.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em] border-b border-zinc-100 pb-2">Schedule Impact</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="originalDays" className="text-[10px] font-black text-zinc-400">Original Duration (Days)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                            <input
                                                id="originalDays"
                                                type="number"
                                                name="originalDays"
                                                value={formData.originalDays}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-6 py-3 bg-zinc-50 border-none rounded-xl text-zinc-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="revisedDays" className="text-[10px] font-black text-zinc-400">Revised Duration (Days)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
                                            <input
                                                id="revisedDays"
                                                type="number"
                                                name="revisedDays"
                                                value={formData.revisedDays}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-6 py-3 bg-indigo-50/50 border-none rounded-xl text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zinc-900 rounded-2xl flex justify-between items-center shadow-lg">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Time Extension</span>
                                        <span className={`text-sm font-black ${daysDelta >= 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                            {daysDelta >= 0 ? '+' : ''} {daysDelta} Days
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-8 py-5 border border-zinc-100 text-zinc-400 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95 transition-all shadow-lg"
                            >
                                Create Change Order
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangeOrderForm;
