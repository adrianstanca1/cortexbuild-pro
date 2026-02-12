import React, { useState } from 'react';
import { X, ArrowRight, FileText, CheckCircle, Calculator } from 'lucide-react';
import { PCO } from '../../services/constructionApi';

interface ConvertPCOModalProps {
    pco: PCO;
    onSubmit: (data: { coNumber: string; costImpact: number; scheduleImpact: number }) => void;
    onClose: () => void;
}

const ConvertPCOModal: React.FC<ConvertPCOModalProps> = ({ pco, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        coNumber: '',
        costImpact: pco.estimatedCost || 0,
        scheduleImpact: pco.estimatedDays || 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-all">
            <div className="bg-white rounded-[2.5rem] max-w-xl w-full shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Convert to Change Order</h2>
                            <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Formalizing PCO-{pco.pcoNumber}</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all" title="Close modal">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mb-8 p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Source PCO</p>
                        <h3 className="text-lg font-bold text-zinc-900">{pco.title}</h3>
                        <div className="flex gap-4 mt-2">
                            <span className="text-xs font-medium text-zinc-500">Est. Cost: ${pco.estimatedCost?.toLocaleString()}</span>
                            <span className="text-xs font-medium text-zinc-500">Est. Days: {pco.estimatedDays}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                Assign Formal CO Number
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                                <input
                                    id="coNumber"
                                    type="text"
                                    name="coNumber"
                                    value={formData.coNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, coNumber: e.target.value }))}
                                    required
                                    placeholder="e.g. CO-012"
                                    className="w-full pl-14 pr-6 py-4 bg-indigo-50/30 border-none rounded-2xl text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    title="Change Order Number"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="costImpact" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Final Cost Impact ($)
                                </label>
                                <input
                                    id="costImpact"
                                    type="number"
                                    value={formData.costImpact}
                                    onChange={(e) => setFormData(prev => ({ ...prev, costImpact: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    title="Final Cost Impact"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="scheduleImpact" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Final Schedule (Days)
                                </label>
                                <input
                                    id="scheduleImpact"
                                    type="number"
                                    value={formData.scheduleImpact}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduleImpact: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    title="Final Schedule Impact"
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-white/20 transition-colors" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Action Required</p>
                                    <p className="font-bold text-sm mt-1">Formalizing this document will notify stakeholders</p>
                                </div>
                                <ArrowRight className="h-6 w-6 opacity-50 group-hover:translate-x-1 transition-transform" />
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
                                className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-lg"
                            >
                                Confirm Conversion
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ConvertPCOModal;
