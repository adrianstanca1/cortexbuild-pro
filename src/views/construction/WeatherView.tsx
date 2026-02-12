import React, { useState, useEffect } from 'react';
import { Plus, CloudRain, DollarSign, Clock } from 'lucide-react';
import { weatherApi, WeatherDelay } from '../../services/constructionApi';
import { useProjects } from '../../contexts/ProjectContext';
import WeatherDelayForm from '../../components/construction/WeatherDelayForm';

const WeatherView: React.FC = () => {
    const { activeProject } = useProjects();
    const [delays, setDelays] = useState<WeatherDelay[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeProject]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await weatherApi.getDelays(activeProject?.id);
            setDelays(res.data);
        } catch (error) {
            console.error('Failed to fetch weather delays:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDelay = async (data: any) => {
        try {
            await weatherApi.create({
                ...data,
                projectId: activeProject!.id,
            });
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create weather delay:', error);
        }
    };

    const stats = {
        totalDelays: delays.length,
        totalHours: delays.reduce((sum, d) => sum + d.duration, 0),
        totalCost: delays.reduce((sum, d) => sum + (d.costImpact || 0), 0),
        totalSchedule: delays.reduce((sum, d) => sum + (d.scheduleImpact || 0), 0),
    };

    const getSeverityColor = (severity: WeatherDelay['severity']) => {
        switch (severity) {
            case 'severe': return 'bg-red-100 text-red-800 border-red-200';
            case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Weather Tracking</h1>
                    <p className="text-gray-600 mt-1">Document weather delays and their impacts</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Log Weather Delay
                </button>
            </div>

            {showForm && (
                <WeatherDelayForm
                    onSubmit={handleCreateDelay}
                    onClose={() => setShowForm(false)}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Delays</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDelays}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <CloudRain className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Hours</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.totalHours}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Cost Impact</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">${stats.totalCost.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Schedule Impact</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalSchedule} days</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {delays.map((delay) => (
                    <div key={delay.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-gray-900">{delay.weatherType}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(delay.severity)}`}>
                                        {delay.severity.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    {new Date(delay.date).toLocaleDateString()} • Duration: {delay.duration} hours
                                </p>
                                <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-700">Affected Activities:</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {delay.affectedActivities.map((activity, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                                                {activity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-700">{delay.justification}</p>
                                </div>
                            </div>
                            <div className="text-right space-y-2 ml-6">
                                {delay.costImpact && (
                                    <div>
                                        <p className="text-xs text-gray-600">Cost Impact</p>
                                        <p className="text-lg font-bold text-red-600">${delay.costImpact.toLocaleString()}</p>
                                    </div>
                                )}
                                {delay.scheduleImpact && (
                                    <div>
                                        <p className="text-xs text-gray-600">Schedule Impact</p>
                                        <p className="text-lg font-bold text-purple-600">{delay.scheduleImpact} days</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {delays.length === 0 && <p className="text-center text-gray-500 py-8">No weather delays logged</p>}
            </div>
        </div>
    );
};

export default WeatherView;
