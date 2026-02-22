import React, { useState } from 'react';
import { X, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { PCO } from '../../services/constructionApi';

interface PCOFormProps {
    onSubmit: (data: Partial<PCO>) => void;
    onClose: () => void;
}

const PCOForm: React.FC<PCOFormProps> = ({ onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        pcoNumber: '',
        title: '',
        description: '',
        requestedBy: '',
        requestDate: new Date().toISOString().split('T')[0],
        estimatedCost: 0,
        estimatedDays: 0,
        priority: 'medium' as PCO['priority'],
        category: 'site_condition',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'estimatedCost' || name === 'estimatedDays' ? parseFloat(value) || 0 : value,
        }));
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-all">
            <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Register PCO</h2>
                            <p className="text-xs font-black text-sky-500 uppercase tracking-[0.2em] mt-1">Potential Change Order Internal Registry</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all" title="Close form">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    PCO Reference #
                                </label>
                                <input
                                    type="text"
                                    name="pcoNumber"
                                    value={formData.pcoNumber}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. 024"
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-sky-500 transition-all outline-none appearance-none"
                                    title="PCO Category"
                                >
                                    <option value="site_condition">Site Condition</option>
                                    <option value="design_change">Design Change</option>
                                    <option value="owner_request">Owner Request</option>
                                    <option value="unforeseen">Unforeseen</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                Event Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Impact title..."
                                className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                Full Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={4}
                                placeholder="Details of the event and potential impact..."
                                className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-sky-500 transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="requestedBy" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Requested By
                                </label>
                                <input
                                    id="requestedBy"
                                    type="text"
                                    name="requestedBy"
                                    value={formData.requestedBy}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Priority Level
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-sky-500 transition-all outline-none appearance-none"
                                    title="Priority Level"
                                >
                                    <option value="low">LOW</option>
                                    <option value="medium">MEDIUM</option>
                                    <option value="high">HIGH</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Estimated Exposure ($)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-500" />
                                    <input
                                        id="estimatedCost"
                                        type="number"
                                        name="estimatedCost"
                                        value={formData.estimatedCost}
                                        onChange={handleChange}
                                        className="w-full pl-14 pr-6 py-4 bg-rose-50/50 border-none rounded-2xl text-rose-600 font-black focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                                        title="Estimated Cost"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Schedule Variance (Days)
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <input
                                        id="estimatedDays"
                                        type="number"
                                        name="estimatedDays"
                                        value={formData.estimatedDays}
                                        onChange={handleChange}
                                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                                        title="Estimated Days Impact"
                                    />
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
                                className="flex-1 px-8 py-5 bg-sky-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-sky-700 hover:shadow-xl hover:shadow-sky-500/20 active:scale-95 transition-all shadow-lg"
                            >
                                Register PCO
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PCOForm;
