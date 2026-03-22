// Define types locally to avoid @prisma/client import issues during build
export type UserRole = 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'ADMIN' | 'PROJECT_MANAGER' | 'FIELD_WORKER';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DocumentType = 'CONTRACT' | 'PERMIT' | 'DRAWING' | 'SPECIFICATION' | 'REPORT' | 'PHOTO' | 'OTHER';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string | null;
  avatarUrl: string | null;
}

export interface DashboardStats {
  totalProjects: number;
  activeTasks: number;
  teamMembers: number;
  pendingItems: number;
}

export interface ProjectWithRelations {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  location: string | null;
  clientName: string | null;
  budget: number | null;
  startDate: Date | null;
  endDate: Date | null;
  manager: { id: string; name: string; avatarUrl: string | null } | null;
  _count: { tasks: number; documents: number; teamMembers: number };
}

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  project: { id: string; name: string };
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface GeneratedImage {
  url: string;
  base64?: string;
  prompt?: string;
  timestamp?: number;
}

export interface SafetyIncident {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  date: Date;
  projectId?: string;
  reportedBy?: string;
}

export interface SafetyHazard {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location?: string;
  status?: 'OPEN' | 'REVIEWING' | 'RESOLVED';
  projectId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  certifications?: Certification[];
}

export interface Certification {
  id: string;
  name: string;
  issuedDate: Date;
  expiryDate?: Date;
  status?: 'VALID' | 'EXPIRED' | 'PENDING';
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  projectId: string;
  uploadedAt: Date;
  uploadedBy?: string;
}

export interface ProjectDrawing {
  id: string;
  name: string;
  type: string;
  url: string;
  projectId: string;
  version?: string;
  uploadedAt: Date;
}

export interface DrawingMarkup {
  id: string;
  drawingId: string;
  authorId: string;
  markup: string;
  createdAt: Date;
}

export interface ProjectPhase {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  tasks?: TaskWithRelations[];
}

export interface Permission {
  action: string;
  resource: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [{ action: '*', resource: '*' }],
  COMPANY_OWNER: [{ action: '*', resource: '*' }],
  ADMIN: [
    { action: 'read', resource: 'projects' },
    { action: 'write', resource: 'projects' },
    { action: 'delete', resource: 'projects' },
  ],
  PROJECT_MANAGER: [
    { action: 'read', resource: 'projects' },
    { action: 'write', resource: 'projects' },
  ],
  FIELD_WORKER: [
    { action: 'read', resource: 'projects' },
  ],
};

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';
  projectId?: string;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  location?: string;
  clientName?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  projectId?: string;
  assigneeId?: string;
}
