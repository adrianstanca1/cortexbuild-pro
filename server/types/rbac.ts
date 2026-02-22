// Multi-Tenant Architecture & RBAC Types
// Created: 2025-12-22

/**
 * User roles in hierarchical order (lowest to highest privilege)
 */
export enum UserRole {
    CLIENT = 'CLIENT',
    READ_ONLY = 'READ_ONLY',
    OPERATIVE = 'OPERATIVE',
    SUPERVISOR = 'SUPERVISOR',
    FINANCE = 'FINANCE',
    PROJECT_MANAGER = 'PROJECT_MANAGER',
    COMPANY_ADMIN = 'COMPANY_ADMIN',
    SUPERADMIN = 'SUPERADMIN',
}

/**
 * Role hierarchy for privilege comparison
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    [UserRole.CLIENT]: -1,
    [UserRole.READ_ONLY]: 0,
    [UserRole.OPERATIVE]: 1,
    [UserRole.SUPERVISOR]: 2,
    [UserRole.FINANCE]: 3,
    [UserRole.PROJECT_MANAGER]: 4,
    [UserRole.COMPANY_ADMIN]: 5,
    [UserRole.SUPERADMIN]: 6,
};

const ROLE_ALIASES: Record<string, UserRole> = {
    SUPERADMIN: UserRole.SUPERADMIN,
    SUPER_ADMIN: UserRole.SUPERADMIN,
    SUPERADMINISTRATOR: UserRole.SUPERADMIN,
    COMPANYADMIN: UserRole.COMPANY_ADMIN,
    COMPANY_ADMIN: UserRole.COMPANY_ADMIN,
    COMPANYOWNER: UserRole.COMPANY_ADMIN,
    COMPANY_OWNER: UserRole.COMPANY_ADMIN,
    COMPANYOWNERADMIN: UserRole.COMPANY_ADMIN,
    COMPANY_OWNER_ADMIN: UserRole.COMPANY_ADMIN,
    READONLY: UserRole.READ_ONLY,
    READ_ONLY: UserRole.READ_ONLY,
    PROJECTMANAGER: UserRole.PROJECT_MANAGER,
    PROJECT_MANAGER: UserRole.PROJECT_MANAGER,
    CLIENT: UserRole.CLIENT
};

const USER_ROLE_VALUES = new Set(Object.values(UserRole));

export function normalizeRole(role?: string | UserRole): UserRole {
    if (!role) return UserRole.READ_ONLY;
    const raw = role.toString().trim().toUpperCase();
    if (USER_ROLE_VALUES.has(raw as UserRole)) {
        return raw as UserRole;
    }
    const collapsed = raw.replace(/[^A-Z0-9]/g, '');
    return ROLE_ALIASES[raw] || ROLE_ALIASES[collapsed] || UserRole.READ_ONLY;
}

/**
 * Membership status
 */
export enum MembershipStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    INVITED = 'invited',
    INACTIVE = 'inactive',
}

/**
 * Membership linking a user to a company with a role
 */
export interface Membership {
    id: string;
    userId: string;
    companyId: string;
    role: UserRole;
    permissions?: string[]; // Explicit permission overrides
    status: MembershipStatus;
    joinedAt?: string;
    invitedBy?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Permission definition
 */
export interface Permission {
    id: string;
    name: string; // e.g., 'projects.create'
    resource: string; // e.g., 'projects'
    action: string; // e.g., 'create'
    description?: string;
    createdAt: string;
}

/**
 * Role-Permission mapping
 */
export interface RolePermission {
    roleId: string;
    permissionId: string;
}

/**
 * Audit log entry
 */
export interface AuditLog {
    id: string;
    userId?: string;
    companyId?: string;
    action: string; // e.g., 'company.created', 'user.suspended'
    resource?: string; // e.g., 'companies', 'projects'
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    severity?: string;
    createdAt: string;
}

/**
 * Tenant context for request scoping
 */
export interface TenantContext {
    tenantId: string;
    userId: string;
    userName?: string; // Enhanced context
    role: UserRole;
    permissions: string[];
    isSuperadmin: boolean;
}

/**
 * DTOs for service methods
 */
export interface CreateMembershipDto {
    userId: string;
    companyId: string;
    role: UserRole;
    permissions?: string[];
    invitedBy?: string;
}

export interface UpdateMembershipDto {
    role?: UserRole;
    permissions?: string[];
    status?: MembershipStatus;
}

export interface AuditEventDto {
    userId?: string;
    userName?: string;
    companyId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    severity?: string;
}

export interface AuditFilters {
    userId?: string;
    companyId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
}

/**
 * Helper to check if a role has at least the required privilege level
 */
export function hasRolePrivilege(userRole: UserRole, requiredRole: UserRole): boolean {
    const normalizedUserRole = normalizeRole(userRole);
    const normalizedRequiredRole = normalizeRole(requiredRole);
    return ROLE_HIERARCHY[normalizedUserRole] >= ROLE_HIERARCHY[normalizedRequiredRole];
}

/**
 * Helper to check if user is superadmin
 */
export function isSuperadmin(role: string | UserRole): boolean {
    return normalizeRole(role) === UserRole.SUPERADMIN;
}
