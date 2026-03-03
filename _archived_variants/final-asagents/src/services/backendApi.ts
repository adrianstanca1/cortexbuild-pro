// Backend API Service for ASAgents Platform
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Configuration - Use environment variables with fallbacks
const getEnvVar = (key: string, fallback: string): string => {
  if (typeof window !== 'undefined' && (window as any).VITE_ENV) {
    return (window as any).VITE_ENV[key] || fallback;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
};

const API_BASE_URL = getEnvVar('VITE_API_URL', 'http://localhost:5001/api');
const WS_BASE_URL = getEnvVar('VITE_WS_URL', 'ws://localhost:5001/ws');

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
    response_time_ms?: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  company?: Company;
  token: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'worker' | 'client';
  company_id?: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  type: 'general_contractor' | 'subcontractor' | 'client' | 'supplier';
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
  end_date?: string;
  budget?: number;
  spent?: number;
  progress: number;
  company_id: string;
  manager_id?: string;
  client_id?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  // Extended fields from joins
  manager_name?: string;
  client_name?: string;
  task_count?: number;
  completed_tasks?: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  project_id?: string;
  client_id: string;
  company_id: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Extended fields from joins
  client_name?: string;
  project_name?: string;
  item_count?: number;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    response_time?: number;
    tables?: number;
    total_rows?: number;
    size_bytes?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  services: {
    api: boolean;
    websocket: boolean;
    file_storage: boolean;
  };
  environment?: string;
  node_version?: string;
}

// Create axios instance
class BackendApiService {
  private api: AxiosInstance;
  private token: string | null = null;
  private wsConnection: WebSocket | null = null;
  private wsListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          success: response.data.success,
          message: response.data.message
        });
        return response;
      },
      (error: AxiosError<ApiResponse>) => {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          errors: error.response?.data?.errors
        });

        // Handle 401 errors by clearing token
        if (error.response?.status === 401) {
          this.clearAuth();
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );

    // Load token from localStorage
    this.loadAuth();
  }

  // Authentication methods
  setAuth(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    this.connectWebSocket();
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem('auth_token');
    this.disconnectWebSocket();
  }

  private loadAuth() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.token = token;
      this.connectWebSocket();
    }
  }

  // WebSocket methods
  private connectWebSocket() {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.wsConnection = new WebSocket(WS_BASE_URL);
      
      this.wsConnection.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.emit('ws:connected', {});
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);
          this.emit(`ws:${message.type}`, message.data);
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      };

      this.wsConnection.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.emit('ws:disconnected', {});
        // Attempt to reconnect after 3 seconds
        setTimeout(() => this.connectWebSocket(), 3000);
      };

      this.wsConnection.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('ws:error', error);
      };
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
    }
  }

  private disconnectWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  // Event system for WebSocket
  on(event: string, callback: Function) {
    if (!this.wsListeners.has(event)) {
      this.wsListeners.set(event, []);
    }
    this.wsListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.wsListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.wsListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // API Methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    if (response.data.success && response.data.data) {
      this.setAuth(response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login failed');
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed, clearing local auth anyway');
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<{ user: User; company?: Company }> {
    const response = await this.api.get<ApiResponse<{ user: User; company?: Company }>>('/auth/me');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get user');
  }

  async getProjects(params?: any): Promise<{ projects: Project[]; meta: any }> {
    const response = await this.api.get<ApiResponse<Project[]>>('/projects', { params });
    if (response.data.success && response.data.data) {
      return {
        projects: response.data.data,
        meta: response.data.meta || {}
      };
    }
    throw new Error(response.data.message || 'Failed to get projects');
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.api.get<ApiResponse<Project>>(`/projects/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get project');
  }

  async createProject(project: any): Promise<Project> {
    const response = await this.api.post<ApiResponse<Project>>('/projects', project);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create project');
  }

  async updateProject(id: string, updates: any): Promise<Project> {
    const response = await this.api.put<ApiResponse<Project>>(`/projects/${id}`, updates);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update project');
  }

  async deleteProject(id: string): Promise<void> {
    const response = await this.api.delete<ApiResponse>(`/projects/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete project');
    }
  }

  async getInvoices(params?: any): Promise<{ invoices: Invoice[]; meta: any }> {
    const response = await this.api.get<ApiResponse<Invoice[]>>('/invoices', { params });
    if (response.data.success && response.data.data) {
      return {
        invoices: response.data.data,
        meta: response.data.meta || {}
      };
    }
    throw new Error(response.data.message || 'Failed to get invoices');
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await this.api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get invoice');
  }

  async createInvoice(invoice: any): Promise<Invoice> {
    const response = await this.api.post<ApiResponse<Invoice>>('/invoices', invoice);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create invoice');
  }

  async updateInvoice(id: string, updates: any): Promise<Invoice> {
    const response = await this.api.put<ApiResponse<Invoice>>(`/invoices/${id}`, updates);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update invoice');
  }

  async deleteInvoice(id: string): Promise<void> {
    const response = await this.api.delete<ApiResponse>(`/invoices/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete invoice');
    }
  }

  async getInvoiceSummary(): Promise<any> {
    const response = await this.api.get<ApiResponse>('/invoices/summary');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get invoice summary');
  }

  async getHealthCheck(): Promise<HealthCheck> {
    const response = await this.api.get<ApiResponse<HealthCheck>>('/health');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to get health check');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getWebSocketStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.wsConnection) return 'disconnected';
    switch (this.wsConnection.readyState) {
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CONNECTING: return 'connecting';
      default: return 'disconnected';
    }
  }
}

// Export singleton instance
export const backendApi = new BackendApiService();
export default backendApi;
