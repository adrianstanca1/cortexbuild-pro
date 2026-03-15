// =====================================================
// ORGANIZATION ENTITLEMENTS SYSTEM
// Controls module access and limits for organizations
// =====================================================

// Module entitlements structure
export interface ModuleEntitlements {
  projects: boolean;
  tasks: boolean;
  documents: boolean;
  rfis: boolean;
  submittals: boolean;
  changeOrders: boolean;
  dailyReports: boolean;
  safety: boolean;
  reports: boolean;
  team: boolean;
  punchLists?: boolean;
  inspections?: boolean;
  equipment?: boolean;
  meetings?: boolean;
}

// Limits structure
export interface EntitlementLimits {
  storageGB: number;
  maxUsers: number;
  maxProjects: number;
}

// Full entitlements interface
export interface Entitlements {
  modules: ModuleEntitlements;
  limits: EntitlementLimits;
}

// Default entitlements for new organizations
export const DEFAULT_ENTITLEMENTS: Entitlements = {
  modules: {
    projects: true,
    tasks: true,
    documents: true,
    rfis: true,
    submittals: true,
    changeOrders: true,
    dailyReports: true,
    safety: true,
    reports: true,
    team: true,
    punchLists: true,
    inspections: true,
    equipment: true,
    meetings: true,
  },
  limits: {
    storageGB: 10,
    maxUsers: 50,
    maxProjects: 100,
  },
};

// Module labels for display
export const MODULE_LABELS: Record<keyof ModuleEntitlements, string> = {
  projects: "Projects",
  tasks: "Tasks",
  documents: "Documents",
  rfis: "RFIs",
  submittals: "Submittals",
  changeOrders: "Change Orders",
  dailyReports: "Daily Reports",
  safety: "Safety",
  reports: "Reports",
  team: "Team Management",
  punchLists: "Punch Lists",
  inspections: "Inspections",
  equipment: "Equipment",
  meetings: "Meetings",
};

/**
 * Parse entitlements from database JSON
 */
export function parseEntitlements(entitlementsJson: any): Entitlements {
  if (!entitlementsJson) {
    return DEFAULT_ENTITLEMENTS;
  }

  try {
    const parsed =
      typeof entitlementsJson === "string"
        ? JSON.parse(entitlementsJson)
        : entitlementsJson;

    return {
      modules: {
        ...DEFAULT_ENTITLEMENTS.modules,
        ...(parsed.modules || {}),
      },
      limits: {
        ...DEFAULT_ENTITLEMENTS.limits,
        ...(parsed.limits || {}),
      },
    };
  } catch (error) {
    console.error("Error parsing entitlements:", error);
    return DEFAULT_ENTITLEMENTS;
  }
}

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

/**
 * Check if a module is enabled for an organization
 */
export function isModuleEnabledForOrg(
  entitlements: Entitlements | null | undefined,
  moduleId: keyof ModuleEntitlements,
): boolean {
  const parsed = entitlements || DEFAULT_ENTITLEMENTS;
  return parsed.modules[moduleId] ?? true;
}

/**
 * Check if organization is within storage limit
 */
export function isWithinStorageLimit(
  entitlements: Entitlements | null | undefined,
  usedBytes: number | bigint,
): boolean {
  const parsed = entitlements || DEFAULT_ENTITLEMENTS;
  const usedGB = Number(usedBytes) / (1024 * 1024 * 1024);
  return usedGB < parsed.limits.storageGB;
}

/**
 * Check if organization is within user limit
 */
export function isWithinUserLimit(
  entitlements: Entitlements | null | undefined,
  currentUsers: number,
): boolean {
  const parsed = entitlements || DEFAULT_ENTITLEMENTS;
  return currentUsers < parsed.limits.maxUsers;
}

/**
 * Check if organization is within project limit
 */
export function isWithinProjectLimit(
  entitlements: Entitlements | null | undefined,
  currentProjects: number,
): boolean {
  const parsed = entitlements || DEFAULT_ENTITLEMENTS;
  return currentProjects < parsed.limits.maxProjects;
}

/**
 * Get remaining storage in GB
 */
export function getRemainingStorageGB(
  entitlements: Entitlements | null | undefined,
  usedBytes: number | bigint,
): number {
  const parsed = entitlements || DEFAULT_ENTITLEMENTS;
  const usedGB = Number(usedBytes) / (1024 * 1024 * 1024);
  return Math.max(0, parsed.limits.storageGB - usedGB);
}

/**
 * Serialize entitlements for database storage
 */
export function serializeEntitlements(entitlements: Entitlements): string {
  return JSON.stringify(entitlements);
}
