/**
 * Comprehensive API Client for CortexBuild Pro
 * Provides type-safe API calls with error handling, retries, and offline support
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// Get API URL from environment
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T = any> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface ApiErrorResponse {
    error: string;
    message?: string;
    statusCode?: number;
    details?: any;
}

class ApiClient {
    private client: AxiosInstance;
    private retryCount = 3;
    private retryDelay = 1000;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor - add auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - handle errors
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Unauthorized - clear token and redirect to login
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Retry logic for failed requests
     */
    private async retryRequest<T>(
        fn: () => Promise<T>,
        retries = this.retryCount
    ): Promise<T> {
        try {
            return await fn();
        } catch (error: any) {
            if (retries > 0 && this.isRetryableError(error)) {
                await this.delay(this.retryDelay);
                return this.retryRequest(fn, retries - 1);
            }
            throw error;
        }
    }

    /**
     * Check if error is retryable
     */
    private isRetryableError(error: any): boolean {
        // Retry on network errors or 5xx server errors
        return (
            !error.response ||
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT' ||
            (error.response.status >= 500 && error.response.status < 600)
        );
    }

    /**
     * Delay utility
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Generic GET request
     */
    public async get<T = any>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.retryRequest(() =>
                this.client.get<T>(url, config)
            );
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Generic POST request
     */
    public async post<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.post<T>(url, data, config);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Generic PUT request
     */
    public async put<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.put<T>(url, data, config);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Generic PATCH request
     */
    public async patch<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.patch<T>(url, data, config);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Generic DELETE request
     */
    public async delete<T = any>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.delete<T>(url, config);
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Handle errors consistently
     */
    private handleError(error: any): ApiResponse<never> {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            return {
                success: false,
                error:
                    axiosError.response?.data?.error ||
                    axiosError.response?.data?.message ||
                    axiosError.message ||
                    'An error occurred',
            };
        }
        return {
            success: false,
            error: error.message || 'An unknown error occurred',
        };
    }

    /**
     * Upload file with progress tracking
     */
    public async uploadFile(
        url: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ApiResponse<any>> {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await this.client.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(progress);
                    }
                },
            });
            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Download file
     */
    public async downloadFile(url: string, filename: string): Promise<boolean> {
        try {
            const response = await this.client.get(url, {
                responseType: 'blob',
            });

            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            return true;
        } catch (error) {
            console.error('Download error:', error);
            return false;
        }
    }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Resource-specific API methods
 */

// Projects API
export const projectsApi = {
    getAll: (params?: any) => apiClient.get('/v1/projects', { params }),
    getById: (id: string) => apiClient.get(`/v1/projects/${id}`),
    create: (data: any) => apiClient.post('/v1/projects', data),
    update: (id: string, data: any) => apiClient.put(`/v1/projects/${id}`, data),
    delete: (id: string) => apiClient.delete(`/v1/projects/${id}`),
};

// Tasks API
export const tasksApi = {
    getAll: (params?: any) => apiClient.get('/v1/tasks', { params }),
    getById: (id: string) => apiClient.get(`/v1/tasks/${id}`),
    create: (data: any) => apiClient.post('/v1/tasks', data),
    update: (id: string, data: any) => apiClient.put(`/v1/tasks/${id}`, data),
    delete: (id: string) => apiClient.delete(`/v1/tasks/${id}`),
    updateStatus: (id: string, status: string) =>
        apiClient.patch(`/v1/tasks/${id}/status`, { status }),
};

// Users API
export const usersApi = {
    getAll: (params?: any) => apiClient.get('/v1/users', { params }),
    getById: (id: string) => apiClient.get(`/v1/users/${id}`),
    getCurrent: () => apiClient.get('/v1/auth/me'),
    update: (id: string, data: any) => apiClient.put(`/v1/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/v1/users/${id}`),
};

// Companies API
export const companiesApi = {
    getAll: (params?: any) => apiClient.get('/v1/companies', { params }),
    getById: (id: string) => apiClient.get(`/v1/companies/${id}`),
    create: (data: any) => apiClient.post('/v1/companies', data),
    update: (id: string, data: any) => apiClient.put(`/v1/companies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/v1/companies/${id}`),
};

// Daily Logs API
export const dailyLogsApi = {
    getAll: (params?: any) => apiClient.get('/v1/daily-logs', { params }),
    getById: (id: string) => apiClient.get(`/v1/daily-logs/${id}`),
    create: (data: any) => apiClient.post('/v1/daily-logs', data),
    update: (id: string, data: any) => apiClient.put(`/v1/daily-logs/${id}`, data),
    delete: (id: string) => apiClient.delete(`/v1/daily-logs/${id}`),
};

// RFIs API
export const rfisApi = {
    getAll: (params?: any) => apiClient.get('/v1/rfis', { params }),
    getById: (id: string) => apiClient.get(`/v1/rfis/${id}`),
    create: (data: any) => apiClient.post('/v1/rfis', data),
    update: (id: string, data: any) => apiClient.put(`/v1/rfis/${id}`, data),
    delete: (id: string) => apiClient.delete(`/v1/rfis/${id}`),
};

// Safety Incidents API
export const safetyApi = {
    getAll: (params?: any) => apiClient.get('/v1/safety', { params }),
    getById: (id: string) => apiClient.get(`/v1/safety/${id}`),
    create: (data: any) => apiClient.post('/v1/safety', data),
    update: (id: string, data: any) => apiClient.put(`/v1/safety/${id}`, data),
    delete: (id: string) => apiClient.delete(`/v1/safety/${id}`),
};

// Notifications API
export const notificationsApi = {
    getAll: (params?: any) => apiClient.get('/v1/notifications', { params }),
    markAsRead: (id: string) => apiClient.patch(`/v1/notifications/${id}/read`),
    markAllAsRead: () => apiClient.post('/v1/notifications/read-all'),
    delete: (id: string) => apiClient.delete(`/v1/notifications/${id}`),
};

// Analytics API
export const analyticsApi = {
    getDashboard: () => apiClient.get('/v1/analytics/dashboard'),
    getProjectMetrics: (projectId: string) =>
        apiClient.get(`/v1/analytics/projects/${projectId}`),
    getCompanyMetrics: (companyId: string) =>
        apiClient.get(`/v1/analytics/companies/${companyId}`),
};

// Storage/Documents API
export const documentsApi = {
    upload: (file: File, onProgress?: (progress: number) => void) =>
        apiClient.uploadFile('/v1/storage/upload', file, onProgress),
    download: (id: string, filename: string) =>
        apiClient.downloadFile(`/v1/storage/download/${id}`, filename),
    getSignedUrl: (id: string) => apiClient.get(`/v1/storage/signed-url/${id}`),
};
