// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'field_worker' | 'supervisor' | 'admin';
  avatarUrl?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'on_hold';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  geofenceLat: number;
  geofenceLng: number;
  geofenceRadius: number; // meters
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Time tracking types
export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  clockInTime: string;
  clockOutTime?: string;
  clockInLat?: number;
  clockInLng?: number;
  clockOutLat?: number;
  clockOutLng?: number;
  duration?: number; // minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Photo types
export interface Photo {
  id: string;
  projectId: string;
  userId: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  capturedAt: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Daily log types
export interface DailyLog {
  id: string;
  projectId: string;
  userId: string;
  date: string;
  weather: {
    temp: number;
    condition: string;
    humidity: number;
  };
  laborHours: {
    trade: string;
    hours: number;
  }[];
  quantities: {
    item: string;
    quantity: number;
    unit: string;
  }[];
  notes?: string;
  photoIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Task types
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// RFI types
export interface RFI {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'open' | 'answered' | 'closed';
  priority: 'low' | 'medium' | 'high';
  planId?: string;
  pinX?: number;
  pinY?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// Sync queue types
export interface SyncQueueItem {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data: any;
  retryCount: number;
  status: 'pending' | 'synced' | 'failed';
  createdAt: string;
  syncedAt?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
