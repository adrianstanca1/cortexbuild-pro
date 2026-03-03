import React, { useState, useEffect } from 'react';
import { User, View } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { EnhancedConstructionDashboard } from './dashboard/EnhancedConstructionDashboard';
import { ProjectsView } from './views/ProjectsView';
import { TaskManagement } from './tasks/TaskManagement';
import { EquipmentManagement } from './equipment/EquipmentManagement';
import { ExpenseManagement } from './expense/ExpenseManagement';
import { SafetyIncidentManagement } from './safety/SafetyIncidentManagement';
import { AIAssistant } from './ai/AIAssistant';
import { ReportsAnalytics } from './reports/ReportsAnalytics';
import { SimpleSidebar } from './layout/SimpleSidebar';
import { PlatformHeader } from './layout/PlatformHeader';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning';
}

export const ConstructionPlatform: React.FC = () => {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [toastCounter, setToastCounter] = useState(0);

    const addToast = (message: string, type: 'success' | 'error' | 'warning') => {
        const newToast: Toast = {
            id: toastCounter,
            message,
            type
        };

        setToasts(prev => [...prev, newToast]);
        setToastCounter(prev => prev + 1);

        // Auto-remove toast after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
        }, 5000);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const renderMainContent = () => {
        if (!user) return null;

        switch (activeView) {
            case 'dashboard':
                return (
                    <EnhancedConstructionDashboard
                        user={user}
                        addToast={addToast}
                        setActiveView={setActiveView}
                    />
                );

            case 'projects':
                return (
                    <ProjectsView
                        user={user}
                        addToast={addToast}
                        setActiveView={setActiveView}
                    />
                );

            case 'tasks':
                return <TaskManagement user={user} addToast={addToast} setActiveView={setActiveView} />;

            case 'equipment':
                return (
                    <EquipmentManagement
                        user={user}
                        addToast={addToast}
                        setActiveView={setActiveView}
                    />
                );

            case 'expenses':
                return (
                    <ExpenseManagement
                        user={user}
                        addToast={addToast}
                        setActiveView={setActiveView}
                    />
                );

            case 'safety':
                return (
                    <SafetyIncidentManagement
                        user={user}
                        addToast={addToast}
                        setActiveView={setActiveView}
                    />
                );

            case 'ai':
                return <AIAssistant user={user} addToast={addToast} setActiveView={setActiveView} />;

            case 'reports':
                return <ReportsAnalytics user={user} addToast={addToast} setActiveView={setActiveView} />;
                
            default:
                return <EnhancedConstructionDashboard user={user} addToast={addToast} setActiveView={setActiveView} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <PlatformHeader
                user={user}
                activeView={activeView}
                setActiveView={setActiveView}
            />
            
            <div className="flex flex-1">
                {/* Sidebar */}
                <SimpleSidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    user={user}
                />

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    {renderMainContent()}
                </main>
            </div>

            {/* Toast Notifications */}
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded-lg shadow-lg max-w-sm ${
                            toast.type === 'success'
                                ? 'bg-green-500 text-white'
                                : toast.type === 'error'
                                ? 'bg-red-500 text-white'
                                : 'bg-yellow-500 text-white'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-3 text-white hover:text-gray-200"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};