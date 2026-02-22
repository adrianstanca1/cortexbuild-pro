import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Calendar, MapPin, User, CheckCircle } from 'lucide-react';
import { NCR } from '../../services/constructionApi';

interface NCRFormProps {
    onSubmit: (data: Partial<NCR>) => void;
    onClose: () => void;
}

const NCRForm: React.FC<NCRFormProps> = ({ onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        ncrNumber: '',
        title: '',
        description: '',
        location: '',
        discoveredBy: '',
        discoveredDate: new Date().toISOString().split('T')[0],
        severity: 'medium' as NCR['severity'],
        category: 'workmanship',
        assignedTo: '',
        dueDate: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-all">
            <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Initiate NCR</h2>
                            <p className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] mt-1">Non-Conformance Report Entry</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all" title="Close form">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    NCR Reference #
                                </label>
                                <input
                                    type="text"
                                    name="ncrNumber"
                                    value={formData.ncrNumber}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. QC-742"
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Severity
                                </label>
                                <select
                                    name="severity"
                                    value={formData.severity}
                                    onChange={handleChange}
                                    title="Severity Level"
                                    className={`w-full px-6 py-4 border-none rounded-2xl font-black focus:ring-2 focus:ring-rose-500 transition-all outline-none appearance-none ${formData.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
                                        formData.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                            'bg-zinc-50 text-zinc-900'
                                        }`}
                                >
                                    <option value="low">LOW</option>
                                    <option value="medium">MEDIUM</option>
                                    <option value="high">HIGH</option>
                                    <option value="critical">CRITICAL</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                Deficiency Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Concrete Spalling in Section B"
                                className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                Detailed Findings
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={4}
                                placeholder="Describe the non-conformance and required corrective actions..."
                                className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-rose-500 transition-all outline-none resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Location / Grid
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g. Level 4, Grid C2"
                                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    title="NCR Category"
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-rose-500 transition-all outline-none appearance-none"
                                >
                                    <option value="workmanship">Workmanship</option>
                                    <option value="material">Material</option>
                                    <option value="safety">Safety</option>
                                    <option value="structural">Structural</option>
                                    <option value="mep">MEP</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Assigned Responsible Entity
                                </label>
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <input
                                        type="text"
                                        name="assignedTo"
                                        value={formData.assignedTo}
                                        onChange={handleChange}
                                        placeholder="Subcontractor or Foreman"
                                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
                                    Required Closure Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-500" />
                                    <input
                                        id="dueDate"
                                        type="date"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-14 pr-6 py-4 bg-rose-50/50 border-none rounded-2xl text-rose-600 font-black focus:ring-2 focus:ring-rose-500 transition-all outline-none"
                                        title="Due Date"
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
                                className="flex-1 px-8 py-5 bg-rose-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-500/20 active:scale-95 transition-all shadow-lg"
                            >
                                Initiate NCR
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NCRForm;
