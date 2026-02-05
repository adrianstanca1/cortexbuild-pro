// Define types locally to avoid @prisma/client import issues during build
export type UserRole = 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'ADMIN' | 'PROJECT_MANAGER' | 'FIELD_WORKER';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DocumentType = 'CONTRACT' | 'PERMIT' | 'DRAWING' | 'SPECIFICATION' | 'REPORT' | 'PHOTO' | 'OTHER';

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
