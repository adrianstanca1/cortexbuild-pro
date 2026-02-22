/**
 * Live Map Service - API client for location tracking, site maps, and map zones.
 * Provides background GPS tracking and real-time location updates.
 */

import { apiClient } from './apiClient';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LocationUpdate {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
}

export interface UserLocation {
    id: string;
    name: string;
    email: string;
    role: string;
    latitude: number;
    longitude: number;
    lastLocationUpdate: string;
    avatar?: string;
    mapRole: 'Manager' | 'Foreman' | 'Labor';
    status: 'Active' | 'Idle';
    lastActive: string;
}

export interface LocationLogEntry {
    id: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    recordedAt: string;
}

export interface SiteMap {
    id: string;
    companyId: string;
    projectId: string;
    name: string;
    sourceFileUrl?: string;
    sourceFileName?: string;
    mapImageUrl?: string;
    boundaries?: any;
    metadata?: any;
    createdBy: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface MapZone {
    id: string;
    siteMapId: string;
    label: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    top: number;
    left: number;
    width: number;
    height: number;
    protocol: string;
    trigger: string;
    createdAt: string;
}

export interface LocationAlert {
    id: string;
    userId?: string;
    projectId?: string;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'danger';
    zoneId?: string;
    latitude?: number;
    longitude?: number;
    acknowledged: boolean;
    createdAt: string;
}

export interface DrawingAnalysisResult {
    siteMapId: string;
    projectId: string;
    fileName: string;
    zonesCreated: number;
    createdAt: string;
}

// ─── Location Tracking API ──────────────────────────────────────────────────

export const liveMapApi = {
    /** Send current GPS location to the server */
    updateLocation: (data: LocationUpdate) =>
        apiClient.post<{ success: boolean; id: string; recordedAt: string }>('/location/update', data),

    /** Get current locations of all team members */
    getUserLocations: (projectId?: string) =>
        apiClient.get<UserLocation[]>('/location/users', { params: projectId ? { projectId } : {} }),

    /** Get location history for a user */
    getLocationHistory: (userId: string, hours = 24) =>
        apiClient.get<LocationLogEntry[]>(`/location/history/${userId}`, { params: { hours } }),

    /** Get location alerts */
    getLocationAlerts: (projectId?: string) =>
        apiClient.get<LocationAlert[]>('/location/alerts', { params: projectId ? { projectId } : {} }),

    /** Create a location alert */
    createLocationAlert: (data: { userId?: string; projectId?: string; type: string; message: string; severity?: string; zoneId?: string; latitude?: number; longitude?: number }) =>
        apiClient.post<LocationAlert>('/location/alerts', data),
};

// ─── Site Maps API ──────────────────────────────────────────────────────────

export const siteMapApi = {
    /** Get site maps for a project */
    getSiteMaps: (projectId?: string) =>
        apiClient.get<SiteMap[]>('/site-maps', { params: projectId ? { projectId } : {} }),

    /** Create a new site map */
    createSiteMap: (data: { projectId: string; name: string; sourceFileUrl?: string; sourceFileName?: string; mapImageUrl?: string; boundaries?: any; metadata?: any }) =>
        apiClient.post<SiteMap>('/site-maps', data),

    /** Delete a site map */
    deleteSiteMap: (id: string) =>
        apiClient.delete(`/site-maps/${id}`),

    /** Submit drawing analysis results (from frontend AI processing) */
    analyzeDrawing: (data: { projectId: string; fileName: string; fileUrl?: string; analysisResult?: any; zones?: MapZone[] }) =>
        apiClient.post<DrawingAnalysisResult>('/site-maps/analyze-drawing', data),

    /** Get zones for a site map */
    getMapZones: (mapId: string) =>
        apiClient.get<MapZone[]>(`/site-maps/${mapId}/zones`),

    /** Create a zone on a site map */
    createMapZone: (mapId: string, data: Partial<MapZone>) =>
        apiClient.post<MapZone>(`/site-maps/${mapId}/zones`, data),

    /** Delete a zone */
    deleteMapZone: (mapId: string, zoneId: string) =>
        apiClient.delete(`/site-maps/${mapId}/zones/${zoneId}`),
};

// ─── Background Location Tracker ────────────────────────────────────────────

let locationWatchId: number | null = null;
let locationInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start background GPS tracking. Captures location on start and
 * sends updates every 10 minutes to the server.
 */
export function startLocationTracking(onUpdate?: (location: LocationUpdate) => void): void {
    if (!('geolocation' in navigator)) {
        console.warn('[LiveMap] Geolocation not supported');
        return;
    }

    const sendLocation = (position: GeolocationPosition) => {
        const update: LocationUpdate = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
        };

        // Send to server
        liveMapApi.updateLocation(update).catch(err => {
            console.warn('[LiveMap] Failed to send location:', err);
        });

        // Notify callback
        if (onUpdate) onUpdate(update);
    };

    // Capture initial location
    navigator.geolocation.getCurrentPosition(sendLocation, (err) => {
        console.warn('[LiveMap] Initial location capture failed:', err.message);
    }, { enableHighAccuracy: true, timeout: 10000 });

    // Update every 10 minutes
    locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(sendLocation, (err) => {
            console.warn('[LiveMap] Periodic location capture failed:', err.message);
        }, { enableHighAccuracy: true, timeout: 10000 });
    }, 10 * 60 * 1000); // 10 minutes
}

/**
 * Stop background location tracking.
 */
export function stopLocationTracking(): void {
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
    if (locationInterval !== null) {
        clearInterval(locationInterval);
        locationInterval = null;
    }
}
