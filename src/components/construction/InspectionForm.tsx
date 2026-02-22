import React, { useState, useEffect } from 'react';
import { X, ClipboardCheck, Calendar, MapPin, User, ChevronRight } from 'lucide-react';
import { Inspection, InspectionTemplate, inspectionsApi } from '../../services/constructionApi';

interface InspectionFormProps {
    onSubmit: (data: Partial<Inspection>) => void;
    onClose: () => void;
}

const InspectionForm: React.FC<InspectionFormProps> = ({ onSubmit, onClose }) => {
    const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        type: 'quality',
        scheduledDate: new Date().toISOString().split('T')[0],
        inspector: '',
        location: '',
        checklist: [] as any[],
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await inspectionsApi.templates.getAll();
            setTemplates(res.data.templates);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            checklist: JSON.stringify(formData.checklist)
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleApplyTemplate = (template: InspectionTemplate) => {
        setFormData(prev => ({
            ...prev,
            title: template.name,
            type: template.type,
            checklist: JSON.parse(template.checklist),
        }));
    };

    return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] transition-all">
            <div className="bg-white rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300 flex">

                {/* Left Sidebar: Templates */}
                <div className="w-1/3 bg-zinc-50 border-r border-zinc-100 p-8 overflow-y-auto hidden md:block">
                    <div className="flex items-center gap-2 mb-6">
                        <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Available Templates</h3>
                    </div>
                    <div className="space-y-3">
                        {templates.map(template => (
                            <button
                                key={template.id}
                                onClick={() => handleApplyTemplate(template)}
                                className="w-full text-left p-4 bg-white rounded-2xl border border-zinc-100 hover:border-indigo-500/30 hover:shadow-md transition-all group"
                            >
                                <p className="text-sm font-black text-zinc-900 group-hover:text-indigo-600 transition-colors">{template.name}</p>
                                <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-tighter">{template.type}</p>
                            </button>
                        ))}
                        {templates.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-[10px] font-black text-zinc-400 uppercase">No templates found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Form Content */}
                <div className="flex-1 p-10 overflow-y-auto">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Schedule Inspection</h2>
                            <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Quality & Safety Compliance</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-zinc-50 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition-all" title="Close form">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                Inspection Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Daily Safety Walkthrough - Sector 7"
                                className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="type" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Inspection Type
                                </label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    title="Inspection Type"
                                    className="w-full px-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
                                >
                                    <option value="safety">SAFETY</option>
                                    <option value="quality">QUALITY</option>
                                    <option value="progress">PROGRESS</option>
                                    <option value="final">FINAL</option>
                                    <option value="technical">TECHNICAL</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="scheduledDate" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Scheduled Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
                                    <input
                                        id="scheduledDate"
                                        type="date"
                                        name="scheduledDate"
                                        value={formData.scheduledDate}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="inspector" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Assigned Inspector
                                </label>
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <input
                                        id="inspector"
                                        type="text"
                                        name="inspector"
                                        value={formData.inspector}
                                        onChange={handleChange}
                                        required
                                        placeholder="Name of inspector"
                                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="location" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                                    Location / Work Zone
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                    <input
                                        id="location"
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g. Level 2, Phase A"
                                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 border-none rounded-2xl text-zinc-900 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
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
                                className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95 transition-all shadow-lg"
                            >
                                Schedule Inspection
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InspectionForm;
