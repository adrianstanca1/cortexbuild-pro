/**
 * Enhanced API Client with comprehensive error handling, retries, and offline support
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

// Get API URL from environment
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/\$/, '');

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
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
  code?: string;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  retryableStatuses: number[];
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

class EnhancedApiClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;
  private requestQueue: Map<string, AbortController> = new Map();

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...defaultRetryConfig, ...retryConfig };
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token and request ID
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // Add timestamp
        config.headers['X-Request-Time'] = new Date().toISOString();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig &amp; { _retry?: boolean };
        
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Try to refresh token or logout
          const refreshed = await this.handleTokenRefresh();
          if (refreshed) {
            const token = localStorage.getItem('token');
            if (token) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.client(originalRequest);
          } else {
            this.handleAuthFailure();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async handleTokenRefresh(): Promise<boolean> {
    try {
      // Attempt token refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  }

  private handleAuthFailure() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login?error=session_expired';
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      // Network errors are retryable
      return true;
    }

    const status = error.response.status;
    return this.retryConfig.retryableStatuses.includes(status);
  }

  /**
   * Delay utility with exponential backoff
   */
  private async delay(attempt: number): Promise<void> {
    const delayMs = this.retryConfig.exponentialBackoff
      ? this.retryConfig.retryDelay * Math.pow(2, attempt - 1)
      : this.retryConfig.retryDelay;
    
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    requestId: string
  ): Promise<AxiosResponse<T>> {
    let lastError: AxiosError | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Check if request was cancelled
        const controller = this.requestQueue.get(requestId);
        if (controller?.signal.aborted) {
          throw new Error('Request was cancelled');
        }

        return await requestFn();
      } catch (error: any) {
        lastError = error;

        // Don't retry if it's not a retryable error
        if (!this.isRetryableError(error) || attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        // Wait before retrying
        await this.delay(attempt + 1);
      }
    }

    throw lastError;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    method: string,
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const controller = new AbortController();
    this.requestQueue.set(requestId, controller);

    try {
      const response = await this.executeWithRetry(
        () => this.client.request<T>({
          method,
          url,
          ...config,
          signal: controller.signal
        }),
        requestId
      );

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      return this.handleError(error);
    } finally {
      this.requestQueue.delete(requestId);
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: any): ApiResponse<never> {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      // Handle specific error types
      if (!axiosError.response) {
        return {
          success: false,
          error: 'Network error. Please check your connection.',
          statusCode: 0
        };
      }

      const status = axiosError.response.status;
      const data = axiosError.response.data;

      // User-friendly error messages
      let errorMessage = data?.message || data?.error || axiosError.message;
      
      switch (status) {
        case 400:
          errorMessage = data?.message || 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Your session has expired. Please log in again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 409:
          errorMessage = data?.message || 'This action conflicts with existing data.';
          break;
        case 422:
          errorMessage = data?.message || 'Validation failed. Please check your input.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorMessage = 'Server error. Please try again later.';
          break;
      }

      return {
        success: false,
        error: errorMessage,
        message: data?.message,
        statusCode: status,
        ...data
      };
    }

    // Non-Axios error
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      statusCode: 0
    };
  }

  /**
   * Cancel all pending requests
   */
  public cancelAllRequests() {
    this.requestQueue.forEach(controller => controller.abort());
    this.requestQueue.clear();
  }

  /**
   * Cancel specific request
   */
  public cancelRequest(requestId: string) {
    const controller = this.requestQueue.get(requestId);
    if (controller) {
      controller.abort();
      this.requestQueue.delete(requestId);
    }
  }

  // Public API methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, config);
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, { ...config, data });
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, { ...config, data });
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, { ...config, data });
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, config);
  }

  /**
   * Upload file with progress tracking
   */
  public async uploadFile(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    onCancel?: () => void
  ): Promise<ApiResponse<any>> {
    const requestId = this.generateRequestId();
    const controller = new AbortController();
    this.requestQueue.set(requestId, controller);

    if (onCancel) {
      const originalOnCancel = onCancel;
      onCancel = () => {
        controller.abort();
        originalOnCancel();
      };
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error) {
      return this.handleError(error);
    } finally {
      this.requestQueue.delete(requestId);
    }
  }

  /**
   * Download file
   */
  public async downloadFile(
    url: string, 
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<boolean>> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        }
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

      return {
        success: true,
        data: true,
        statusCode: response.status
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const enhancedApiClient = new EnhancedApiClient();

// Resource-specific API methods with enhanced error handling
export const enhancedProjectsApi = {
  getAll: (params?: any) => enhancedApiClient.get('/v1/projects', { params }),
  getById: (id: string) => enhancedApiClient.get(`/v1/projects/${id}`),
  create: (data: any) => enhancedApiClient.post('/v1/projects', data),
  update: (id: string, data: any) => enhancedApiClient.put(`/v1/projects/${id}`, data),
  delete: (id: string) => enhancedApiClient.delete(`/v1/projects/${id}`),
};

export const enhancedTasksApi = {
  getAll: (params?: any) => enhancedApiClient.get('/v1/tasks', { params }),
  getById: (id: string) => enhancedApiClient.get(`/v1/tasks/${id}`),
  create: (data: any) => enhancedApiClient.post('/v1/tasks', data),
  update: (id: string, data: any) => enhancedApiClient.put(`/v1/tasks/${id}`, data),
  delete: (id: string) => enhancedApiClient.delete(`/v1/tasks/${id}`),
  updateStatus: (id: string, status: string) =>
    enhancedApiClient.patch(`/v1/tasks/${id}/status`, { status }),
};

export const enhancedUsersApi = {
  getAll: (params?: any) => enhancedApiClient.get('/v1/users', { params }),
  getById: (id: string) => enhancedApiClient.get(`/v1/users/${id}`),
  getCurrent: () => enhancedApiClient.get('/v1/auth/me'),
  update: (id: string, data: any) => enhancedApiClient.put(`/v1/users/${id}`, data),
  delete: (id: string) => enhancedApiClient.delete(`/v1/users/${id}`),
};

export const enhancedCompaniesApi = {
  getAll: (params?: any) => enhancedApiClient.get('/v1/companies', { params }),
  getById: (id: string) => enhancedApiClient.get(`/v1/companies/${id}`),
  create: (data: any) => enhancedApiClient.post('/v1/companies', data),
  update: (id: string, data: any) => enhancedApiClient.put(`/v1/companies/${id}`, data),
  delete: (id: string) => enhancedApiClient.delete(`/v1/companies/${id}`),
};

export const enhancedDocumentsApi = {
  upload: (file: File, onProgress?: (progress: number) => void) =>
    enhancedApiClient.uploadFile('/v1/storage/upload', file, onProgress),
  download: (id: string, filename: string, onProgress?: (progress: number) => void) =>
    enhancedApiClient.downloadFile(`/v1/storage/download/${id}`, filename, onProgress),
  getSignedUrl: (id: string) => enhancedApiClient.get(`/v1/storage/signed-url/${id}`),
};

export default EnhancedApiClient;
