import { TrialStatus, StorageUsage, StorageMetrics } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Trial API Service
 * Handles all trial and subscription-related API calls
 */
class TrialApiService {
    /**
     * Get trial status for a company
     */
    async getTrialStatus(companyId: string): Promise<TrialStatus> {
        const response = await fetch(`${API_BASE}/api/companies/${companyId}/trial-status`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch trial status: ${response.statusText}`);
        }

        const data = await response.json();

        // Calculate display status
        const status: 'active' | 'warning' | 'expired' =
            data.isExpired ? 'expired' :
                data.daysRemaining <= 3 ? 'warning' :
                    'active';

        return {
            ...data,
            status
        };
    }

    /**
     * Get storage usage for a company
     */
    async getStorageUsage(companyId: string): Promise<StorageUsage> {
        const response = await fetch(`${API_BASE}/api/companies/${companyId}/storage-usage`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch storage usage: ${response.statusText}`);
        }

        const data = await response.json();

        // Structure the response
        const fileStorage: StorageMetrics = {
            used: data.fileStorage?.used || 0,
            quota: data.fileStorage?.quota || 0,
            percentage: data.fileStorage?.percentage || 0,
            available: data.fileStorage?.available || 0,
            formattedUsed: data.fileStorage?.formattedUsed || '0 B',
            formattedQuota: data.fileStorage?.formattedQuota || '0 B',
            formattedAvailable: data.fileStorage?.formattedAvailable || '0 B',
        };

        const databaseStorage: StorageMetrics = {
            used: data.databaseStorage?.used || 0,
            quota: data.databaseStorage?.quota || 0,
            percentage: data.databaseStorage?.percentage || 0,
            available: data.databaseStorage?.available || 0,
            formattedUsed: data.databaseStorage?.formattedUsed || '0 B',
            formattedQuota: data.databaseStorage?.formattedQuota || '0 B',
            formattedAvailable: data.databaseStorage?.formattedAvailable || '0 B',
        };

        const totalUsage = {
            used: fileStorage.used + databaseStorage.used,
            quota: fileStorage.quota + databaseStorage.quota,
            percentage: ((fileStorage.used + databaseStorage.used) / (fileStorage.quota + databaseStorage.quota)) * 100 || 0,
        };

        return {
            fileStorage,
            databaseStorage,
            totalUsage,
        };
    }

    /**
     * Initiate upgrade from trial to paid plan
     */
    async initiateUpgrade(companyId: string, planId: 'starter' | 'pro' | 'enterprise'): Promise<{
        success: boolean;
        message: string;
        redirectUrl?: string;
    }> {
        const response = await fetch(`${API_BASE}/api/companies/${companyId}/upgrade`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ planId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to initiate upgrade: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Extend trial (SuperAdmin only)
     */
    async extendTrial(companyId: string, days: number): Promise<{
        success: boolean;
        newTrialEndDate: string;
    }> {
        const response = await fetch(`${API_BASE}/api/admin/companies/${companyId}/extend-trial`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ days }),
        });

        if (!response.ok) {
            throw new Error(`Failed to extend trial: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Manually expire trial (SuperAdmin only)
     */
    async expireTrial(companyId: string): Promise<{ success: boolean }> {
        const response = await fetch(`${API_BASE}/api/admin/companies/${companyId}/expire-trial`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to expire trial: ${response.statusText}`);
        }

        return response.json();
    }
}

export const trialApi = new TrialApiService();
