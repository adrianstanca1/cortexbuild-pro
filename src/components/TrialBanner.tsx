import { useEffect, useState } from 'react';
import { AlertCircle, Clock, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TrialStatus {
    isActive: boolean;
    daysRemaining: number;
    trialEndsAt: string;
    storageUsed: number;
    storageQuota: number;
    databaseUsed: number;
    databaseQuota: number;
}

export function TrialBanner() {
    const { user } = useAuth();
    const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
    const [showBanner, setShowBanner] = useState(true);

    useEffect(() => {
        if (user?.companyId) {
            fetchTrialStatus();
        }
    }, [user?.companyId]);

    const fetchTrialStatus = async () => {
        try {
            const response = await fetch(`/api/companies/${user?.companyId}/trial-status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTrialStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch trial status:', error);
        }
    };

    if (!showBanner || !trialStatus || !trialStatus.isActive) return null;

    const storagePercent = (trialStatus.storageUsed / trialStatus.storageQuota) * 100;
    const isWarning = trialStatus.daysRemaining <= 3;
    const isCritical = trialStatus.daysRemaining <= 1;

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 ${isCritical ? 'bg-red-600' : isWarning ? 'bg-orange-600' : 'bg-blue-600'
            } text-white shadow-lg`}>
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {isCritical ? (
                                <AlertCircle className="w-5 h-5" />
                            ) : (
                                <Clock className="w-5 h-5" />
                            )}
                            <span className="font-semibold">
                                {trialStatus.daysRemaining === 0
                                    ? 'Trial expires today!'
                                    : `${trialStatus.daysRemaining} day${trialStatus.daysRemaining !== 1 ? 's' : ''} remaining in trial`
                                }
                            </span>
                        </div>

                        <div className="hidden md:flex items-center gap-2 text-sm">
                            <span>Storage: {Math.round(storagePercent)}% used</span>
                            <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all"
                                    style={{ width: `${Math.min(storagePercent, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.href = '/billing'}
                            className="flex items-center gap-2 px-4 py-1.5 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Zap className="w-4 h-4" />
                            Upgrade Now
                        </button>
                        <button
                            onClick={() => setShowBanner(false)}
                            className="text-white/80 hover:text-white transition-colors"
                            aria-label="Dismiss banner"
                        >
                            ×
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
