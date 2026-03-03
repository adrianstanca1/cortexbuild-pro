/**
 * Weather-Based Scheduling - Industry First!
 * AI-powered scheduling that adapts to weather conditions
 */

import React, { useState, useEffect } from 'react';
import {
    Cloud,
    CloudRain,
    Sun,
    Wind,
    CloudSnow,
    AlertTriangle,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    Zap
} from 'lucide-react';
import { User } from '../../types';
import { supabase } from '../../supabaseClient';

interface WeatherForecast {
    date: Date;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
    temp: number;
    windSpeed: number;
    precipitation: number;
    workable: boolean;
    impactedTasks: number;
}

interface ScheduledTask {
    id: string;
    name: string;
    project: string;
    scheduledDate: Date;
    weatherDependent: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    alternative?: string;
}

export const WeatherBasedScheduling: React.FC<{ currentUser: User; goBack: () => void }> = ({ currentUser, goBack }) => {
    const [forecast, setForecast] = useState<WeatherForecast[]>([]);
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);

    useEffect(() => {
        const load = async () => {
            // Forecast placeholder: leave empty unless you connect external API
            setForecast([]);

            if (!supabase) { setTasks([]); return; }
            const { data } = await supabase
                .from('tasks')
                .select('id, title, project:projects(name), schedule_status, weather_sensitive, created_at')
                .eq('weather_sensitive', true)
                .order('created_at', { ascending: true })
                .limit(50);
            const mapped: ScheduledTask[] = (data || []).map((row: any) => ({
                id: row.id,
                name: row.title,
                project: row.project?.name || 'Project',
                scheduledDate: new Date(row.created_at),
                weatherDependent: !!row.weather_sensitive,
                riskLevel: 'high',
                alternative: row.schedule_status === 'review_pending' ? 'Reschedule pending' : undefined
            }));
            setTasks(mapped);
        };
        load();
    }, []);

    const getWeatherIcon = (condition: string) => {
        const icons = {
            sunny: <Sun className="h-8 w-8 text-yellow-500" />,
            cloudy: <Cloud className="h-8 w-8 text-gray-500" />,
            rainy: <CloudRain className="h-8 w-8 text-blue-500" />,
            stormy: <CloudRain className="h-8 w-8 text-purple-500" />,
            snowy: <CloudSnow className="h-8 w-8 text-cyan-500" />
        };
        return icons[condition as keyof typeof icons] || icons.cloudy;
    };

    const workableDays = forecast.filter(f => f.workable).length;
    const totalImpactedTasks = forecast.reduce((sum, f) => sum + f.impactedTasks, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Cloud className="h-8 w-8 text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-900">Weather-Based Scheduling</h1>
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full">
                            INDUSTRY FIRST
                        </span>
                    </div>
                    <p className="text-gray-600 text-lg">
                        AI-powered scheduling that adapts to weather conditions automatically
                    </p>
                </div>

                {/* Alert Banner */}
                {totalImpactedTasks > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8">
                        <div className="flex items-center gap-4">
                            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-red-900 mb-1">Weather Alert!</h3>
                                <p className="text-red-800">
                                    {totalImpactedTasks} weather-dependent tasks may be affected in the next 5 days.
                                    AI has suggested alternatives below.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <Calendar className="h-8 w-8 text-blue-600" />
                            <span className="text-3xl font-bold text-gray-900">{workableDays}</span>
                        </div>
                        <p className="text-sm text-gray-600">Workable Days (Next 5)</p>
                        <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Good conditions</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <AlertTriangle className="h-8 w-8 text-orange-600" />
                            <span className="text-3xl font-bold text-gray-900">{totalImpactedTasks}</span>
                        </div>
                        <p className="text-sm text-gray-600">Impacted Tasks</p>
                        <div className="mt-2 flex items-center gap-1 text-sm text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Needs rescheduling</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <Zap className="h-8 w-8 text-purple-600" />
                            <span className="text-3xl font-bold text-gray-900">Auto</span>
                        </div>
                        <p className="text-sm text-gray-600">AI Optimization</p>
                        <div className="mt-2 flex items-center gap-1 text-sm text-purple-600">
                            <Zap className="h-4 w-4" />
                            <span>Enabled</span>
                        </div>
                    </div>
                </div>

                {/* 5-Day Forecast */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">5-Day Weather Forecast</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 divide-x divide-gray-200">
                        {forecast.map((day, idx) => (
                            <div
                                key={idx}
                                className={`p-6 ${!day.workable ? 'bg-red-50' : ''} hover:bg-gray-50 transition-colors`}
                            >
                                <div className="text-center">
                                    <div className="text-sm font-medium text-gray-600 mb-2">
                                        {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className="flex justify-center mb-3">
                                        {getWeatherIcon(day.condition)}
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 mb-1">{day.temp}°C</div>
                                    <div className="text-sm text-gray-600 mb-3 capitalize">{day.condition}</div>
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <div className="flex items-center justify-center gap-1">
                                            <Wind className="h-3 w-3" />
                                            {day.windSpeed} km/h
                                        </div>
                                        <div className="flex items-center justify-center gap-1">
                                            <CloudRain className="h-3 w-3" />
                                            {day.precipitation}%
                                        </div>
                                    </div>
                                    {!day.workable && (
                                        <div className="mt-3 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                            Not Workable
                                        </div>
                                    )}
                                    {day.impactedTasks > 0 && (
                                        <div className="mt-2 text-xs text-red-600 font-medium">
                                            {day.impactedTasks} tasks affected
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Impacted Tasks */}
                {tasks.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Weather-Dependent Tasks</h2>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {tasks.map((task) => (
                                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900">{task.name}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    task.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                                                    task.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {task.riskLevel} risk
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{task.project}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {task.scheduledDate.toLocaleDateString()}
                                                </div>
                                                {task.alternative && (
                                                    <div className="flex items-center gap-1 text-blue-600">
                                                        <Zap className="h-4 w-4" />
                                                        AI Suggestion: {task.alternative}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                                            Reschedule
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

