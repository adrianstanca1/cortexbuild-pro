import React, { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingUp, FlaskConical, AlertCircle, CheckCircle } from 'lucide-react';
import { concreteApi, ConcretePour, ConcreteTest } from '../../services/constructionApi';
import { useProjects } from '../../contexts/ProjectContext';
import ConcretePourForm from '../../components/construction/ConcretePourForm';
import ConcreteTestForm from '../../components/construction/ConcreteTestForm';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const ConcreteView: React.FC = () => {
    const { activeProject } = useProjects();
    const [activeTab, setActiveTab] = useState<'pours' | 'analysis'>('pours');
    const [pours, setPours] = useState<ConcretePour[]>([]);
    const [selectedPourId, setSelectedPourId] = useState<string | null>(null);
    const [pourTests, setPourTests] = useState<ConcreteTest[]>([]);
    const [strengthCurve, setStrengthCurve] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPourForm, setShowPourForm] = useState(false);
    const [showTestForm, setShowTestForm] = useState(false);

    useEffect(() => {
        if (activeProject) {
            fetchData();
        }
    }, [activeProject]);

    useEffect(() => {
        if (selectedPourId) {
            fetchPourDetails(selectedPourId);
        }
    }, [selectedPourId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await concreteApi.pours.getAll(activeProject?.id);
            setPours(res.data);
            if (res.data.length > 0 && !selectedPourId) {
                setSelectedPourId(res.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch concrete pours:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPourDetails = async (pourId: string) => {
        try {
            const [testsRes, curveRes] = await Promise.all([
                concreteApi.tests.getAll(pourId),
                concreteApi.getStrengthCurve(pourId)
            ]);
            setPourTests(testsRes.data);
            setStrengthCurve((curveRes.data as any).curve || []);
        } catch (error) {
            console.error('Failed to fetch pour details:', error);
        }
    };

    const handleCreatePour = async (data: any) => {
        try {
            await concreteApi.pours.create({
                ...data,
                projectId: activeProject!.id,
                scheduledDate: data.pourDate,
            });
            setShowPourForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create pour:', error);
        }
    };

    const handleCreateTest = async (data: any) => {
        try {
            await concreteApi.tests.create(data);
            setShowTestForm(false);
            if (selectedPourId) {
                fetchPourDetails(selectedPourId);
            }
        } catch (error) {
            console.error('Failed to create test:', error);
        }
    };

    const stats = {
        total: pours.length,
        completed: pours.filter(p => p.status === 'completed').length,
        totalVolume: pours.reduce((sum, p) => sum + p.volume, 0),
        avgStrength: pourTests.length > 0
            ? Math.round(pourTests.reduce((sum, t) => sum + t.strength, 0) / pourTests.length)
            : 0
    };

    const getStatusColor = (status: ConcretePour['status']) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'scheduled': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'cancelled': return 'bg-zinc-50 text-zinc-400 border-zinc-100';
            default: return 'bg-zinc-50 text-zinc-600 border-zinc-100';
        }
    };

    if (loading && pours.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loading Concrete Data...</p>
            </div>
        );
    }

    const selectedPour = pours.find(p => p.id === selectedPourId);

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Concrete Management</h1>
                    <p className="text-zinc-500 mt-2 font-bold text-sm">Track pours, mix designs, and verify structural integrity through strength analysis.</p>
                </div>
                <button
                    onClick={() => setShowPourForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                >
                    <Plus size={16} />
                    Schedule Pour
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-zinc-50 text-zinc-500 rounded-2xl">
                            <Calendar size={20} />
                        </div>
                        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Total Pours</span>
                    </div>
                    <p className="text-3xl font-black text-zinc-900">{stats.total}</p>
                    <p className="text-xs font-bold text-zinc-400 mt-1">{stats.completed} Completed</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Total Volume</span>
                    </div>
                    <p className="text-3xl font-black text-zinc-900">{stats.totalVolume.toLocaleString()}</p>
                    <p className="text-xs font-bold text-zinc-400 mt-1">Cubic Yards</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <FlaskConical size={20} />
                        </div>
                        <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Avg Strength</span>
                    </div>
                    <p className="text-3xl font-black text-zinc-900">{stats.avgStrength.toLocaleString()}</p>
                    <p className="text-xs font-bold text-zinc-400 mt-1">PSI (Tested)</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden">
                <div className="border-b border-zinc-100 px-8">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('pours')}
                            className={`py-6 border-b-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'pours'
                                ? 'border-zinc-900 text-zinc-900'
                                : 'border-transparent text-zinc-400 hover:text-zinc-600'
                                }`}
                        >
                            Pour Registry
                        </button>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`py-6 border-b-2 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'analysis'
                                ? 'border-zinc-900 text-zinc-900'
                                : 'border-transparent text-zinc-400 hover:text-zinc-600'
                                }`}
                        >
                            Strength Analysis
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    {activeTab === 'pours' && (
                        <div className="space-y-4">
                            {pours.map((pour) => (
                                <div
                                    key={pour.id}
                                    onClick={() => setSelectedPourId(pour.id)}
                                    className={`p-6 rounded-3xl border transition-all cursor-pointer group ${selectedPourId === pour.id
                                        ? 'bg-zinc-50 border-zinc-200 shadow-inner'
                                        : 'bg-white border-zinc-100 hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-500/5'
                                        }`}
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-black text-zinc-900">{pour.location}</h3>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getStatusColor(pour.status)}`}>
                                                    {pour.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-6 text-zinc-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    <span className="text-xs font-bold uppercase tracking-tight">{new Date(pour.scheduledDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-tight text-zinc-400">Vol:</span>
                                                    <span className="text-xs font-bold text-zinc-700">{pour.volume} CY</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-tight text-zinc-400">Mix:</span>
                                                    <span className="text-xs font-bold text-zinc-700">{pour.mixDesign}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {pour.status === 'completed' && (
                                            <div className="flex items-center gap-4 pl-4 border-l border-zinc-200">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Slump</p>
                                                    <p className="text-sm font-bold text-zinc-700">{pour.slump}&quot;</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Temp</p>
                                                    <p className="text-sm font-bold text-zinc-700">{pour.temperature}°F</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {pours.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-zinc-400 font-bold uppercase text-xs tracking-widest">No pours scheduled</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'analysis' && selectedPour && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Chart Section */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 h-[400px]">
                                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6">Strength Development Curve</h3>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <LineChart data={strengthCurve} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                                            <XAxis dataKey="age" stroke="#71717a" fontSize={10} tickFormatter={(val) => `${val} days`} />
                                            <YAxis stroke="#71717a" fontSize={10} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                labelStyle={{ fontWeight: 'bold', color: '#18181b', marginBottom: '4px' }}
                                            />
                                            <Legend />
                                            <ReferenceLine y={3000} label="Target 3000" stroke="#f43f5e" strokeDasharray="3 3" />
                                            <ReferenceLine y={4000} label="Target 4000" stroke="#10b981" strokeDasharray="3 3" />
                                            <Line
                                                type="monotone"
                                                dataKey="strength"
                                                name="Measured Strength (PSI)"
                                                stroke="#2563eb"
                                                strokeWidth={3}
                                                dot={{ r: 4, strokeWidth: 2 }}
                                                activeDot={{ r: 8 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Tests List Section */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Compression Tests</h3>
                                    <button
                                        onClick={() => setShowTestForm(true)}
                                        className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors text-zinc-600"
                                        title="Add New Test"
                                        aria-label="Add New Test"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {pourTests.map((test) => (
                                        <div key={test.id} className="p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black text-zinc-900">{test.age}-Day</span>
                                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">{new Date(test.testDate).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 mt-1">{test.notes || 'No notes'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-black ${test.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {test.strength.toLocaleString()}
                                                </p>
                                                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">PSI</p>
                                            </div>
                                        </div>
                                    ))}
                                    {pourTests.length === 0 && (
                                        <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">No tests recorded</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analysis' && !selectedPour && (
                        <div className="text-center py-20">
                            <AlertCircle className="h-10 w-10 text-zinc-200 mx-auto mb-4" />
                            <p className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Select a pour to view analysis</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showPourForm && (
                <ConcretePourForm
                    onSubmit={handleCreatePour}
                    onClose={() => setShowPourForm(false)}
                />
            )}

            {showTestForm && selectedPour && (
                <ConcreteTestForm
                    pourId={selectedPour.id}
                    onSubmit={handleCreateTest}
                    onClose={() => setShowTestForm(false)}
                />
            )}
        </div>
    );
};

export default ConcreteView;

