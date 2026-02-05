// Real-time event types
// All supported real-time event types for the construction management platform
export const REALTIME_EVENT_TYPES = [
  'connected',
  'heartbeat',
  // Tasks
  'task_created',
  'task_updated',
  'task_deleted',
  // Projects
  'project_created',
  'project_updated',
  'project_deleted',
  // Documents
  'document_uploaded',
  'document_deleted',
  // Team
  'team_member_added',
  'team_member_removed',
  // Comments & Activity
  'comment_added',
  'activity_logged',
  'notification',
  // RFIs
  'rfi_created',
  'rfi_updated',
  'rfi_deleted',
  'rfi_answered',
  // Daily Reports
  'daily_report_created',
  'daily_report_updated',
  'daily_report_deleted',
  // Safety
  'safety_incident_reported',
  'safety_incident_updated',
  'safety_incident_resolved',
  'safety_incident_deleted',
  // Submittals
  'submittal_created',
  'submittal_updated',
  'submittal_deleted',
  // Change Orders
  'change_order_created',
  'change_order_updated',
  'change_order_deleted',
  'change_order_approved',
  // Punch Lists
  'punch_list_created',
  'punch_list_updated',
  'punch_list_deleted',
  // Equipment
  'equipment_added',
  'equipment_updated',
  'equipment_deleted',
  // Inspections
  'inspection_scheduled',
  'inspection_updated',
  'inspection_passed',
  'inspection_failed',
  'inspection_deleted',
  // Meetings
  'meeting_recorded',
  'meeting_updated',
  'meeting_deleted',
  // Services & API Connections
  'service_status_changed',
  'service_configured',
  'service_disconnected',
  'api_connection_created',
  'api_connection_updated',
  'api_connection_deleted',
  // Budget & Cost Items
  'cost_item_created',
  'cost_item_updated',
  'cost_item_deleted',
  // Materials
  'material_created',
  'material_updated',
  'material_deleted',
  // Subcontractors
  'subcontractor_created',
  'subcontractor_updated',
  'subcontractor_deleted',
  // Milestones
  'milestone_created',
  'milestone_updated',
  'milestone_deleted',
  // Time Tracking
  'time_entry_created',
  'time_entry_updated',
  'time_entry_deleted',
  // Toolbox Talks
  'toolbox_talk_created',
  'toolbox_talk_updated',
  'toolbox_talk_deleted',
  'toolbox_talk_signed',
  'toolbox_talk_guest_signed',
  // MEWP Checks
  'mewp_check_completed',
  'mewp_check_updated',
  // Tool Checks
  'tool_check_completed',
  'tool_check_updated',
  // Risk Assessments / RAMS
  'risk_assessment_created',
  'risk_assessment_updated',
  'risk_assessment_deleted',
  'rams_acknowledged',
  // Hot Work Permits
  'hot_work_permit_created',
  'hot_work_permit_updated',
  // Confined Space Permits
  'confined_space_permit_created',
  'confined_space_permit_updated',
  // Lifting Operations
  'lifting_operation_created',
  'lifting_operation_updated',
  // Worker Certifications
  'certification_created',
  'certification_updated',
  'certification_deleted',
  // Site Access
  'site_entry',
  'site_exit',
  // Drawings & Annotations
  'drawing_created',
  'drawing_updated',
  'drawing_deleted',
  'annotation_added',
  'annotation_updated',
  'annotation_deleted',
  'user_viewing_drawing'
] as const;

export type RealtimeEventType = (typeof REALTIME_EVENT_TYPES)[number];

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: Record<string, unknown>;
  timestamp: string;
  userId?: string;
}

// Client-side hook for SSE connection
export function createRealtimeConnection(
  onMessage: (event: RealtimeEvent) => void,
  onError?: (error: Event) => void
): EventSource | null {
  if (typeof window === 'undefined') return null;
  
  const eventSource = new EventSource('/api/realtime');
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('Failed to parse SSE message:', e);
    }
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    onError?.(error);
  };
  
  return eventSource;
}
