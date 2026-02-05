/**
 * Input Validation Schemas using Zod
 * 
 * Centralized validation schemas for all API endpoints
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idSchema = z.object({
  id: z.string().uuid(),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
});

// ============================================================================
// Auth Schemas
// ============================================================================

export const signInSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

export const signUpSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(100),
  organizationName: z.string().min(2).max(200).optional(),
});

export const passwordResetSchema = z.object({
  email: z.string().email().max(255),
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
});

// ============================================================================
// Project Schemas
// ============================================================================

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).default('PLANNING'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().nonnegative().optional(),
  location: z.string().max(500).optional(),
  clientName: z.string().max(200).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// ============================================================================
// Task Schemas
// ============================================================================

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string().uuid(),
});

export const bulkTaskUpdateSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    assigneeId: z.string().uuid().optional(),
  }),
});

// ============================================================================
// RFI Schemas
// ============================================================================

export const createRfiSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  projectId: z.string().uuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().uuid().optional(),
});

export const updateRfiSchema = createRfiSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'ANSWERED', 'CLOSED']).optional(),
});

// ============================================================================
// Submittal Schemas
// ============================================================================

export const createSubmittalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().uuid(),
  type: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().uuid().optional(),
});

export const updateSubmittalSchema = createSubmittalSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMIT']).optional(),
});

// ============================================================================
// Document Schemas
// ============================================================================

export const uploadDocumentSchema = z.object({
  fileName: z.string().min(1).max(500),
  fileSize: z.number().int().positive().max(100 * 1024 * 1024), // 100MB max
  mimeType: z.string().max(100),
  projectId: z.string().uuid().optional(),
  category: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
});

export const documentFilterSchema = z.object({
  projectId: z.string().uuid().optional(),
  category: z.string().optional(),
  search: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// Team Schemas
// ============================================================================

export const inviteTeamMemberSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'FIELD_WORKER']),
  projectIds: z.array(z.string().uuid()).optional(),
});

export const updateTeamMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'FIELD_WORKER']).optional(),
  active: z.boolean().optional(),
  projectIds: z.array(z.string().uuid()).optional(),
});

// ============================================================================
// Safety Schemas
// ============================================================================

export const createSafetyIncidentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  projectId: z.string().uuid(),
  severity: z.enum(['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL']),
  incidentDate: z.string().datetime(),
  location: z.string().max(500).optional(),
  injuryType: z.string().max(200).optional(),
  witnessIds: z.array(z.string().uuid()).optional(),
});

export const updateSafetyIncidentSchema = createSafetyIncidentSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(['REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
});

// ============================================================================
// Time Entry Schemas
// ============================================================================

export const createTimeEntrySchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().optional(),
  hours: z.number().positive().max(24),
  date: z.string().datetime(),
  description: z.string().max(1000).optional(),
  billable: z.boolean().default(true),
});

export const updateTimeEntrySchema = createTimeEntrySchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
});

// ============================================================================
// Daily Report Schemas
// ============================================================================

export const createDailyReportSchema = z.object({
  projectId: z.string().uuid(),
  date: z.string().datetime(),
  weather: z.string().max(200).optional(),
  temperature: z.string().max(50).optional(),
  workPerformed: z.string().min(1).max(5000),
  equipmentUsed: z.string().max(2000).optional(),
  materialsDelivered: z.string().max(2000).optional(),
  visitorsOnSite: z.string().max(1000).optional(),
  safetyNotes: z.string().max(2000).optional(),
  delays: z.string().max(2000).optional(),
  totalWorkers: z.number().int().nonnegative().optional(),
});

export const updateDailyReportSchema = createDailyReportSchema.partial().extend({
  id: z.string().uuid(),
});

// ============================================================================
// Webhook Schemas
// ============================================================================

export const createWebhookSchema = z.object({
  url: z.string().url().max(500),
  events: z.array(z.string()).min(1),
  secret: z.string().min(16).max(200).optional(),
  active: z.boolean().default(true),
});

export const updateWebhookSchema = createWebhookSchema.partial().extend({
  id: z.string().uuid(),
});

// ============================================================================
// Admin Schemas
// ============================================================================

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(200),
  domain: z.string().max(100).optional(),
  settings: z.record(z.any()).optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial().extend({
  id: z.string().uuid(),
  active: z.boolean().optional(),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN', 'PROJECT_MANAGER', 'FIELD_WORKER']),
});

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validate request data against schema
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod errors for API response
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  for (const error of errors.errors) {
    const path = error.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(error.message);
  }
  
  return formatted;
}
