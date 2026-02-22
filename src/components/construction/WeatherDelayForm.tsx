import React, { useState } from 'react';
import { X, CloudRain, Clock, AlertTriangle } from 'lucide-react';

interface WeatherDelayFormProps {
    onSubmit: (data: any) => void;
    onClose: () => void;
}

const WeatherDelayForm: React.FC<WeatherDelayFormProps> = ({ onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        weatherType: '',
        severity: 'minor' as const,
        duration: 8,
        affectedActivities: '',
        costImpact: 0,
        scheduleImpact: 1,
        justification: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            affectedActivities: formData.affectedActivities.split(',').map(s => s.trim()).filter(s => s !== ''),
            duration: Number(formData.duration),
            costImpact: Number(formData.costImpact),
            scheduleImpact: Number(formData.scheduleImpact),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Log Weather Delay</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Date</label>
                            <input
                                required
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Weather Type</label>
                            <input
                                required
                                type="text"
                                value={formData.weatherType}
                                onChange={(e) => setFormData({ ...formData, weatherType: e.target.value })}
                                placeholder="e.g. Heavy Rain, High Winds"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Severity</label>
                            <select
                                value={formData.severity}
                                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="minor">Minor</option>
                                <option value="moderate">Moderate</option>
                                <option value="severe">Severe</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Duration (Hours)</label>
                            <input
                                required
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Affected Activities (comma separated)</label>
                        <input
                            required
                            type="text"
                            value={formData.affectedActivities}
                            onChange={(e) => setFormData({ ...formData, affectedActivities: e.target.value })}
                            placeholder="e.g. Concrete Pour, Roofing"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Cost Impact ($)</label>
                            <input
                                type="number"
                                value={formData.costImpact}
                                onChange={(e) => setFormData({ ...formData, costImpact: Number(e.target.value) })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Schedule Impact (Days)</label>
                            <input
                                type="number"
                                value={formData.scheduleImpact}
                                onChange={(e) => setFormData({ ...formData, scheduleImpact: Number(e.target.value) })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Justification / Notes</label>
                        <textarea
                            required
                            value={formData.justification}
                            onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                            placeholder="Detailed explanation of the delay..."
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <CloudRain className="h-4 w-4" />
                            Log Delay
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WeatherDelayForm;
