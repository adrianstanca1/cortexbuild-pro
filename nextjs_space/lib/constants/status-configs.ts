/**
 * Shared status and type configurations
 * Consolidates duplicated config objects across components
 */

import {
  FileText, Image, File, FileSpreadsheet, Ruler, ScrollText,
  FileSignature, CheckCircle2, Clock, AlertTriangle, XCircle,
  Package, Wrench, Truck
} from 'lucide-react';

// Document type configuration
export const DOCUMENT_TYPE_CONFIG = {
  PLANS: {
    label: 'Plans',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: FileText
  },
  DRAWINGS: {
    label: 'Drawings',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: Ruler
  },
  PERMITS: {
    label: 'Permits',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: FileSignature
  },
  PHOTOS: {
    label: 'Photos',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    icon: Image
  },
  REPORTS: {
    label: 'Reports',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    icon: FileSpreadsheet
  },
  SPECIFICATIONS: {
    label: 'Specs',
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-400',
    icon: ScrollText
  },
  CONTRACTS: {
    label: 'Contracts',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    icon: File
  },
  OTHER: {
    label: 'Other',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-400',
    icon: FileText
  }
} as const;

// Equipment status configuration
export const EQUIPMENT_STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    icon: CheckCircle2,
    dot: 'bg-green-500'
  },
  IN_USE: {
    label: 'In Use',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: Clock,
    dot: 'bg-blue-500'
  },
  MAINTENANCE: {
    label: 'Maintenance',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: Wrench,
    dot: 'bg-amber-500'
  },
  OUT_OF_SERVICE: {
    label: 'Out of Service',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    icon: XCircle,
    dot: 'bg-red-500'
  }
} as const;

// Material status configuration
export const MATERIAL_STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    icon: CheckCircle2,
    dot: 'bg-green-500'
  },
  IN_USE: {
    label: 'In Use',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: Package,
    dot: 'bg-blue-500'
  },
  LOW_STOCK: {
    label: 'Low Stock',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: AlertTriangle,
    dot: 'bg-amber-500'
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    icon: XCircle,
    dot: 'bg-red-500'
  },
  ORDERED: {
    label: 'Ordered',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    icon: Truck,
    dot: 'bg-purple-500'
  }
} as const;

// Project status configuration
export const PROJECT_STATUS_CONFIG = {
  PLANNING: {
    label: 'Planning',
    badge: 'info'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badge: 'default'
  },
  ON_HOLD: {
    label: 'On Hold',
    badge: 'warning'
  },
  COMPLETED: {
    label: 'Completed',
    badge: 'success'
  },
  ARCHIVED: {
    label: 'Archived',
    badge: 'secondary'
  }
} as const;

// Project health configuration
export const PROJECT_HEALTH_CONFIG = {
  excellent: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500'
  },
  'on-track': {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500'
  },
  'at-risk': {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  critical: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500'
  }
} as const;

// Task priority configuration
export const TASK_PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300'
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400'
  },
  HIGH: {
    label: 'High',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400'
  },
  CRITICAL: {
    label: 'Critical',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400'
  }
} as const;

// Task status configuration
export const TASK_STATUS_CONFIG = {
  TODO: {
    label: 'To Do',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400'
  },
  REVIEW: {
    label: 'Review',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400'
  },
  COMPLETE: {
    label: 'Complete',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400'
  }
} as const;

// Type definitions for better type safety
export type DocumentType = keyof typeof DOCUMENT_TYPE_CONFIG;
export type EquipmentStatus = keyof typeof EQUIPMENT_STATUS_CONFIG;
export type MaterialStatus = keyof typeof MATERIAL_STATUS_CONFIG;
export type ProjectStatus = keyof typeof PROJECT_STATUS_CONFIG;
export type ProjectHealth = keyof typeof PROJECT_HEALTH_CONFIG;
export type TaskPriority = keyof typeof TASK_PRIORITY_CONFIG;
export type TaskStatus = keyof typeof TASK_STATUS_CONFIG;

// Helper function to get config safely with fallback
export function getStatusConfig<T extends Record<string, any>>(
  config: T,
  status: keyof T | string,
  fallback?: T[keyof T]
): T[keyof T] {
  return (config[status as keyof T] || fallback || Object.values(config)[0]) as T[keyof T];
}
