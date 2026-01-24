import { UserRole, ProjectStatus, TaskStatus, TaskPriority, DocumentType } from "@prisma/client";

export type { UserRole, ProjectStatus, TaskStatus, TaskPriority, DocumentType };

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
