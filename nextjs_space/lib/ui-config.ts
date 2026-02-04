// =====================================================
// SHARED UI CONFIGURATION
// Common status, priority, and color constants for UI components
// =====================================================

// Task status colors for badges and indicators
export const taskStatusColors = {
  TODO: { 
    bg: "bg-slate-100 dark:bg-slate-800", 
    text: "text-slate-700 dark:text-slate-300", 
    dot: "bg-slate-400" 
  },
  IN_PROGRESS: { 
    bg: "bg-blue-100 dark:bg-blue-900/30", 
    text: "text-blue-700 dark:text-blue-300", 
    dot: "bg-blue-500" 
  },
  REVIEW: { 
    bg: "bg-amber-100 dark:bg-amber-900/30", 
    text: "text-amber-700 dark:text-amber-300", 
    dot: "bg-amber-500" 
  },
  COMPLETE: { 
    bg: "bg-green-100 dark:bg-green-900/30", 
    text: "text-green-700 dark:text-green-300", 
    dot: "bg-green-500" 
  }
} as const;

// Task priority configuration
export const taskPriorityConfig = {
  LOW: { 
    bg: "bg-slate-100", 
    text: "text-slate-600", 
    border: "border-slate-200" 
  },
  MEDIUM: { 
    bg: "bg-blue-100", 
    text: "text-blue-700", 
    border: "border-blue-200" 
  },
  HIGH: { 
    bg: "bg-orange-100", 
    text: "text-orange-700", 
    border: "border-orange-200" 
  },
  CRITICAL: { 
    bg: "bg-red-100", 
    text: "text-red-700", 
    border: "border-red-200" 
  }
} as const;

// Project status colors
export const projectStatusColors: Record<string, string> = {
  PLANNING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  IN_PROGRESS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  ON_HOLD: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  CANCELLED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
};

// System health status colors
export const healthStatusColors = {
  healthy: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  unknown: "bg-gray-100 text-gray-700"
};

// Document type colors
export const documentTypeColors: Record<string, string> = {
  BLUEPRINT: "bg-blue-100 text-blue-700",
  PERMIT: "bg-purple-100 text-purple-700",
  CONTRACT: "bg-green-100 text-green-700",
  REPORT: "bg-amber-100 text-amber-700",
  INVOICE: "bg-red-100 text-red-700",
  OTHER: "bg-gray-100 text-gray-700"
};

// Safety alert severity colors
export const alertSeverityColors = {
  INFO: "bg-blue-100 text-blue-700 border-blue-200",
  WARNING: "bg-amber-100 text-amber-700 border-amber-200",
  CRITICAL: "bg-red-100 text-red-700 border-red-200"
};

// User role badge colors
export const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  COMPANY_OWNER: "bg-indigo-100 text-indigo-700",
  ADMIN: "bg-blue-100 text-blue-700",
  PROJECT_MANAGER: "bg-green-100 text-green-700",
  FIELD_WORKER: "bg-slate-100 text-slate-700"
};

// Helper function to get status color class
export function getStatusColor(status: string, type: 'task' | 'project' | 'health' = 'task'): string {
  if (type === 'task') {
    return taskStatusColors[status as keyof typeof taskStatusColors]?.bg || "bg-gray-100";
  }
  if (type === 'project') {
    return projectStatusColors[status] || "bg-gray-100";
  }
  if (type === 'health') {
    return healthStatusColors[status as keyof typeof healthStatusColors] || healthStatusColors.unknown;
  }
  return "bg-gray-100";
}

// Helper function to get priority color class
export function getPriorityColor(priority: string): string {
  return taskPriorityConfig[priority as keyof typeof taskPriorityConfig]?.bg || "bg-gray-100";
}

// Helper function to get role color class
export function getRoleColor(role: string): string {
  return roleColors[role] || "bg-gray-100 text-gray-700";
}
