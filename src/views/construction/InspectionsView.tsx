import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, AlertTriangle, CheckCircle, XCircle, ClipboardCheck, LayoutGrid, List, MapPin, Calendar, Clock, ShieldCheck, FileText } from 'lucide-react';
import { inspectionsApi, Inspection, InspectionTemplate } from '../../services/constructionApi';
import { useProjects } from '../../contexts/ProjectContext';
import InspectionCard from '../../components/construction/InspectionCard';
import InspectionForm from '../../components/construction/InspectionForm';

const InspectionsView: React.FC = () => {
    const { activeProject } = useProjects();
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

    useEffect(() => {
        fetchData();
    }, [activeProject]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const inspectionsRes = await inspectionsApi.getAll(activeProject?.id);
            // inspectionsRes.data is { success: boolean, inspections: Inspection[] }
            setInspections((inspectionsRes.data as any).inspections || []);
        } catch (error) {
            console.error('Failed to fetch inspections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInspection = async (data: any) => {
        try {
            await inspectionsApi.create({
                ...data,
                projectId: activeProject!.id,
            });
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create inspection:', error);
        }
    };

    const handleCompleteInspection = async (id: string, passFailStatus: string) => {
        try {
            await inspectionsApi.complete(id, {
                passFailStatus,
                findings: [], // Simplified for now
                deficiencies: [],
                notes: 'Completed in field view',
            });
            setSelectedInspection(null);
            fetchData();
        } catch (error) {
            console.error('Failed to complete inspection:', error);
        }
    };

    const filteredInspections = inspections.filter(inspection => {
        const matchesSearch = inspection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inspection.inspector.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || inspection.type === filterType;
        return matchesSearch && matchesType;
    });

    const stats = {
        total: inspections.length,
        scheduled: inspections.filter(i => i.status === 'scheduled').length,
        passed: inspections.filter(i => i.status === 'passed' || i.passFailStatus === 'passed').length,
        failed: inspections.filter(i => i.status === 'failed' || i.passFailStatus === 'failed').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Compliance & Quality (QC)</h1>
                    <p className="text-gray-600 mt-1 uppercase text-xs font-black tracking-widest opacity-70">Field inspections, safety audits, and checklist execution</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                    title="Schedule Inspection"
                    aria-label="Schedule a new field inspection"
                >
                    <Plus className="h-5 w-5" />
                    SCHEDULE INSPECTION
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Audits</p>
                    <p className="text-3xl font-black text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Scheduled</p>
                            <p className="text-3xl font-black text-amber-600 mt-1">{stats.scheduled}</p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-2xl">
                            <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Passed</p>
                            <p className="text-3xl font-black text-emerald-600 mt-1">{stats.passed}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl">
                            <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Found Deficiencies</p>
                            <p className="text-3xl font-black text-rose-600 mt-1">{stats.failed}</p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-2xl">
                            <AlertTriangle className="h-6 w-6 text-rose-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="SEARCH INSPECTIONS OR INSPECTORS..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-zinc-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest placeholder:text-zinc-300 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="flex-1 md:flex-none px-6 py-3 bg-zinc-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none text-zinc-600"
                        title="Filter by Type"
                    >
                        <option value="all">ALL TYPES</option>
                        <option value="safety">SAFETY</option>
                        <option value="quality">QUALITY</option>
                        <option value="progress">PROGRESS</option>
                        <option value="final">FINAL</option>
                        <option value="technical">TECHNICAL</option>
                    </select>
                    <div className="hidden md:flex bg-zinc-50 p-1 rounded-2xl border border-zinc-100 overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-900'}`}
                            title="Grid View"
                            aria-label="Switch to Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-900'}`}
                            title="List View"
                            aria-label="Switch to List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Inspections UI */}
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {filteredInspections.map((inspection) => (
                    <InspectionCard
                        key={inspection.id}
                        inspection={inspection}
                        onClick={() => setSelectedInspection(inspection)}
                    />
                ))}
            </div>

            {filteredInspections.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                    <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No inspections found matching criteria</p>
                </div>
            )}

            {/* Modals */}
            {showForm && (
                <InspectionForm
                    onSubmit={handleCreateInspection}
                    onClose={() => setShowForm(false)}
                />
            )}

            {selectedInspection && (
                <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-all">
                    <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full uppercase tracking-tighter">{selectedInspection.inspectionNumber}</span>
                                        <span className="px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest bg-zinc-50 text-zinc-500 border-zinc-100">
                                            {selectedInspection.status}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedInspection.title}</h2>
                                    <p className="text-gray-600 mt-2 flex items-center gap-2">
                                        <Calendar size={14} />
                                        <span className="text-sm font-bold uppercase tracking-tight">{new Date(selectedInspection.scheduledDate).toLocaleDateString()}</span>
                                        <span className="text-zinc-300">•</span>
                                        <MapPin size={14} />
                                        <span className="text-sm font-bold uppercase tracking-tight">{selectedInspection.location || 'Site Wide'}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedInspection(null)}
                                    className="p-3 bg-zinc-50 text-zinc-400 hover:text-zinc-900 rounded-2xl transition-all"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-6">
                                    <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em] border-b border-zinc-200 pb-3">Inspection Execution</h4>

                                    {selectedInspection.status === 'scheduled' || selectedInspection.status === 'in_progress' ? (
                                        <div className="space-y-4">
                                            <p className="text-sm font-bold text-zinc-500 leading-relaxed italic">Confirm the findings for this inspection to update the compliance registry.</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => handleCompleteInspection(selectedInspection.id, 'passed')}
                                                    className="flex flex-col items-center gap-4 p-8 bg-white rounded-3xl border-2 border-transparent hover:border-emerald-500/30 hover:shadow-xl transition-all group"
                                                    title="Mark as Passed"
                                                    aria-label="Complete inspection with PASSED status"
                                                >
                                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <ShieldCheck size={28} />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-emerald-600">PASSED</span>
                                                </button>
                                                <button
                                                    onClick={() => handleCompleteInspection(selectedInspection.id, 'failed')}
                                                    className="flex flex-col items-center gap-4 p-8 bg-white rounded-3xl border-2 border-transparent hover:border-rose-500/30 hover:shadow-xl transition-all group"
                                                    title="Mark as Failed"
                                                    aria-label="Complete inspection with FAILED status"
                                                >
                                                    <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <AlertTriangle size={28} />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-rose-600">FAILED</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedInspection.passFailStatus === 'passed' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                    {selectedInspection.passFailStatus === 'passed' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Result Status</p>
                                                    <p className={`text-xl font-black uppercase tracking-wide ${selectedInspection.passFailStatus === 'passed' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {selectedInspection.passFailStatus?.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-white rounded-2xl border border-zinc-100">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Findings Report</p>
                                                <p className="text-sm font-bold text-zinc-700 leading-relaxed italic">
                                                    {selectedInspection.notes || 'Inspection completed successfully without additional notes recorded.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-center gap-8 text-zinc-400">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Assigned Inspector</span>
                                        <span className="text-xs font-bold text-zinc-900 mt-1">{selectedInspection.inspector}</span>
                                    </div>
                                    <div className="w-px h-8 bg-zinc-100" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Compliance Level</span>
                                        <span className="text-xs font-bold text-zinc-900 mt-1">Contract Grade A</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InspectionsView;
