// Trial Configuration
export const TRIAL_CONFIG = {
    // Trial duration in days
    DURATION_DAYS: 14,

    // Storage and database quotas (5GB each)
    STORAGE_QUOTA_BYTES: 5 * 1024 * 1024 * 1024, // 5GB
    DATABASE_QUOTA_BYTES: 5 * 1024 * 1024 * 1024, // 5GB

    // Maximum users allowed in trial
    MAX_USERS: 10,

    // Warning days before expiration
    WARNING_DAYS: [7, 3, 1],

    // Trial plan features
    FEATURES: {
        projects: true,
        tasks: true,
        ai: true,
        reports: true,
        financial: true,
        safety: true,
        equipment: true,
        documents: true,
        team: true,
        // Restricted features
        integrations: false,
        api: false,
        customBranding: false,
        sso: false,
    },

    // Storage warning thresholds (percentage)
    STORAGE_WARNING_THRESHOLDS: {
        YELLOW: 75,  // 75% used
        RED: 90,     // 90% used
    },
};

export const PLAN_QUOTAS = {
    trial: {
        storage: 5 * 1024 * 1024 * 1024,      // 5GB
        database: 5 * 1024 * 1024 * 1024,     // 5GB
        users: 10,
        projects: 50,
    },
    pro: {
        storage: 100 * 1024 * 1024 * 1024,    // 100GB
        database: 50 * 1024 * 1024 * 1024,    // 50GB
        users: 100,
        projects: 1000,
    },
    enterprise: {
        storage: 1024 * 1024 * 1024 * 1024,   // 1TB
        database: 500 * 1024 * 1024 * 1024,   // 500GB
        users: -1,  // Unlimited
        projects: -1, // Unlimited
    },
};

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function calculateDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getStorageWarningLevel(usedBytes: number, quotaBytes: number): 'green' | 'yellow' | 'red' {
    const percentage = (usedBytes / quotaBytes) * 100;

    if (percentage >= TRIAL_CONFIG.STORAGE_WARNING_THRESHOLDS.RED) {
        return 'red';
    } else if (percentage >= TRIAL_CONFIG.STORAGE_WARNING_THRESHOLDS.YELLOW) {
        return 'yellow';
    }
    return 'green';
}
