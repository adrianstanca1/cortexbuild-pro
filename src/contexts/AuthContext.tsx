import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { db } from '@/services/db';
import { startLocationTracking, stopLocationTracking } from '@/services/liveMapService';

// Use VITE_API_URL from environment or default to current origin
const VITE_API_URL = import.meta.env.VITE_API_URL || '';
const API_URL = (VITE_API_URL.endsWith('/api') ? VITE_API_URL : `${VITE_API_URL}/api`).replace(/\/$/, '') + '/v1';
const TOKEN_KEY = 'token';

interface AuthContextType {
    user: UserProfile | null;
    login: (email: string, password: string) => Promise<{ user: UserProfile | null; error: Error | null }>;
    signup: (
        email: string,
        password: string,
        name: string,
        companyName: string
    ) => Promise<{ user: UserProfile | null; error: Error | null }>;
    logout: () => void;

    hasPermission: (permission: string) => boolean;
    addProjectId: (id: string) => void;
    refreshPermissions: () => Promise<void>;
    token: string | null;
    impersonateUser: (userId: string, reason?: string) => Promise<void>;
    stopImpersonating: () => Promise<void>;
    isImpersonating: boolean;
    loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const mapApiUser = (data: any): UserProfile => {
    const role = (data.role as UserRole) || UserRole.OPERATIVE;
    return {
        id: data.id,
        name: data.name || data.email?.split('@')[0] || 'User',
        email: data.email || '',
        phone: data.phone || '',
        role,
        permissions: data.permissions || [],
        memberships: data.memberships || [],
        avatarInitials: ((data.email || 'U')[0] || 'U').toUpperCase(),
        companyId: data.companyId || 'platform-admin',
        projectIds: data.projectIds || []
    };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    // Legacy flag removed (self hosted stack)
    const [isFetchingPermissions, setIsFetchingPermissions] = useState(false);
    const [originalSession, setOriginalSession] = useState<{ user: UserProfile; token: string } | null>(null);

    const persistSession = (sessionToken: string, profile: UserProfile) => {
        setToken(sessionToken);
        setUser(profile);
        localStorage.setItem(TOKEN_KEY, sessionToken);
        localStorage.setItem('user_role', profile.role);
        localStorage.setItem('companyId', profile.companyId || '');
        localStorage.setItem('userId', profile.id || '');
        // Start background GPS location tracking on login
        startLocationTracking();
    };

    const clearSession = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('user_role');
        localStorage.removeItem('companyId');
        localStorage.removeItem('userId');
        // Stop GPS tracking on logout
        stopLocationTracking();
    };

    const hydrateFromApi = async (sessionToken: string) => {
        try {
            const response = await fetch(`${API_URL}/user/me`, {
                headers: { Authorization: `Bearer ${sessionToken}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const data = await response.json();
            const profile = mapApiUser(data);
            setUser(profile);
            localStorage.setItem('user_role', profile.role);
            localStorage.setItem('companyId', profile.companyId || '');
            localStorage.setItem('userId', profile.id || '');
        } catch (error) {
            console.warn('Failed to hydrate session, clearing token', error);
            clearSession();
        }
    };

    useEffect(() => {
        if (token) {
            hydrateFromApi(token);
        }

        const adminToken = localStorage.getItem('admin_token');
        const adminUserJson = localStorage.getItem('admin_user');
        if (adminToken && adminUserJson) {
            try {
                setOriginalSession({
                    user: JSON.parse(adminUserJson),
                    token: adminToken
                });
            } catch (e) {
                console.warn('Failed to restore admin user session', e);
            }
        }
    }, []);

    const refreshPermissions = async () => {
        if (!user) return;
        setIsFetchingPermissions(true);
        try {
            const permissions = await db.getUserPermissions();
            setUser((prev) => (prev ? { ...prev, permissions } : null));
        } catch (e) {
            console.error('Failed to refresh permissions:', e);
        } finally {
            setIsFetchingPermissions(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            // Input validation
            const emailTrimmed = email?.trim();
            const passwordTrimmed = password?.trim();

            if (!emailTrimmed || typeof emailTrimmed !== 'string') {
                return { user: null, error: 'Email address is required' };
            }

            if (!passwordTrimmed || typeof passwordTrimmed !== 'string') {
                return { user: null, error: 'Password is required' };
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailTrimmed)) {
                return { user: null, error: 'Please enter a valid email address (example: user@domain.com)' };
            }

            // Rate limiting check
            const lastAttempt = localStorage.getItem('lastLoginAttempt');
            const now = Date.now();
            if (lastAttempt && now - parseInt(lastAttempt) < 30000) {
                return { user: null, error: 'Please wait 30 seconds before trying again' };
            }

            localStorage.setItem('lastLoginAttempt', now.toString());

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error || 'Login failed');
            }

            const profile: UserProfile = {
                id: payload.id,
                name: payload.name || payload.email?.split('@')[0] || 'User',
                email: payload.email || email,
                phone: payload.phone || '',
                role: payload.role || UserRole.OPERATIVE,
                permissions: payload.permissions || [],
                memberships: payload.memberships || [],
                avatarInitials: (payload.email || email || 'U')[0].toUpperCase(),
                companyId: payload.companyId || 'platform-admin',
                projectIds: payload.projectIds || []
            };

            persistSession(payload.token, profile);
            return { user: profile, error: null };
        } catch (e: any) {
            return { user: null, error: e };
        }
    };

    const signup = async (email: string, password: string, name: string, companyName: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, companyName })
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || 'Registration failed');
            }

            const profile: UserProfile = {
                id: payload.id,
                name: payload.name || name,
                email: payload.email || email,
                phone: payload.phone || '',
                role: payload.role || UserRole.COMPANY_ADMIN,
                permissions: payload.permissions || [],
                memberships: payload.memberships || [],
                avatarInitials: (payload.email || email || 'U')[0].toUpperCase(),
                companyId: payload.companyId,
                projectIds: payload.projectIds || []
            };

            persistSession(payload.token, profile);
            return { user: profile, error: null };
        } catch (e: any) {
            return { user: null, error: e };
        }
    };

    const logout = () => {
        if (isImpersonating && originalSession) {
            stopImpersonating().catch(() => null);
        }
        clearSession();
        setOriginalSession(null);
        localStorage.removeItem('dev_auth_token');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
    };

    const hasPermission = (permission: string) => {
        if (!user) return false;
        if (user.permissions?.includes('*')) return true;
        return user.permissions?.includes(permission) || false;
    };

    const addProjectId = (id: string) => {
        if (!user) return;
        if (user.projectIds?.includes(id)) return;
        setUser((prev) => (prev ? { ...prev, projectIds: [...(prev.projectIds || []), id] } : prev));
    };

    const impersonateUser = async (userId: string, reason?: string) => {
        const { user: impersonatedUser, token: newToken } = await db.impersonateUser(userId, reason);
        if (user && token) {
            setOriginalSession({ user, token: token || '' });
            localStorage.setItem('admin_token', token || '');
            localStorage.setItem('admin_user', JSON.stringify(user));
        }
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(impersonatedUser);
    };

    const stopImpersonating = async () => {
        await db.stopImpersonation();
        const adminToken = localStorage.getItem('admin_token');
        const adminUserJson = localStorage.getItem('admin_user');
        if (adminToken && adminUserJson) {
            localStorage.setItem(TOKEN_KEY, adminToken);
            setToken(adminToken);
            try {
                const adminUser = JSON.parse(adminUserJson);
                setUser(adminUser);
            } catch {
                await hydrateFromApi(adminToken);
            }
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setOriginalSession(null);
        } else {
            clearSession();
            setOriginalSession(null);
        }
    };

    const loginWithOAuth = async () => {
        throw new Error('OAuth login is not available on the self-hosted stack.');
    };

    const isImpersonating = !!originalSession;

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                signup,
                logout,
                hasPermission,
                addProjectId,
                refreshPermissions,
                token,
                impersonateUser,
                stopImpersonating,
                isImpersonating,
                loginWithOAuth
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
