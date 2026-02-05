'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import { RealtimeEvent, RealtimeEventType } from '@/lib/realtime';
import { toast } from 'sonner';

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  connectedClients: number;
  subscribe: (eventType: RealtimeEventType | RealtimeEventType[], handler: (event: RealtimeEvent) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}

// Helper to extract field from payload
function getField(p: Record<string, unknown>, field: string): string {
  if (p[field]) return String(p[field]);
  // Check if it's directly in payload (new format)
  if (p.title) return String(p.title);
  if (p.name) return String(p.name);
  if (p.subject) return String(p.subject);
  return 'Unknown';
}

// Event type to human-readable message mapping
const eventMessages: Partial<Record<RealtimeEventType, (payload: Record<string, unknown>) => string>> = {
  // Tasks
  task_created: (p) => `New task: ${getField(p, 'title')}`,
  task_updated: (p) => `Task updated: ${getField(p, 'title')}`,
  task_deleted: (p) => `Task deleted: ${p.title || p.taskTitle || 'Unknown'}`,
  // Projects
  project_created: (p) => `New project: ${getField(p, 'name')}`,
  project_updated: (p) => `Project updated: ${getField(p, 'name')}`,
  project_deleted: (p) => `Project deleted: ${p.name || p.projectName || 'Unknown'}`,
  // Documents
  document_uploaded: (p) => `Document uploaded: ${getField(p, 'name')}`,
  document_deleted: (p) => `Document deleted: ${p.name || 'Unknown'}`,
  // Team
  team_member_added: (p) => `Team member joined: ${p.userName || getField(p, 'name')}`,
  team_member_removed: (p) => `Team member removed: ${p.userName || 'Unknown'}`,
  // RFIs
  rfi_created: (p) => `New RFI: ${getField(p, 'subject')}`,
  rfi_updated: (p) => `RFI updated: ${getField(p, 'subject')}`,
  rfi_deleted: (p) => `RFI deleted: ${p.subject || 'Unknown'}`,
  rfi_answered: (p) => `RFI answered: ${getField(p, 'subject')}`,
  // Daily Reports
  daily_report_created: (p) => {
    const project = p.project as { name?: string } | undefined;
    return `Daily report submitted${project?.name ? ` for ${project.name}` : ''}`;
  },
  daily_report_updated: (p) => `Daily report updated${p.projectName ? ` for ${p.projectName}` : ''}`,
  daily_report_deleted: (p) => `Daily report deleted`,
  // Safety
  safety_incident_reported: (p) => `⚠️ Safety incident reported${p.severity ? ` (${p.severity})` : ''}`,
  safety_incident_updated: (p) => `Safety incident updated${p.projectName ? ` for ${p.projectName}` : ''}`,
  safety_incident_resolved: (p) => `✓ Safety incident resolved${p.projectName ? ` for ${p.projectName}` : ''}`,
  safety_incident_deleted: (p) => `Safety incident deleted`,
  // Submittals
  submittal_created: (p) => `New submittal: ${getField(p, 'title')}`,
  submittal_updated: (p) => `Submittal updated: ${getField(p, 'title')}`,
  submittal_deleted: (p) => `Submittal deleted: ${p.title || 'Unknown'}`,
  // Change Orders
  change_order_created: (p) => `New change order: ${getField(p, 'title')}`,
  change_order_updated: (p) => `Change order updated: ${getField(p, 'title')}`,
  change_order_deleted: (p) => `Change order deleted: ${p.title || 'Unknown'}`,
  change_order_approved: (p) => `✓ Change order approved: ${getField(p, 'title')}`,
  // Punch Lists
  punch_list_created: (p) => `New punch list item: ${getField(p, 'title')}`,
  punch_list_updated: (p) => `Punch list updated: ${getField(p, 'title')}`,
  punch_list_deleted: (p) => `Punch list item deleted`,
  // Equipment
  equipment_added: (p) => `Equipment added: ${getField(p, 'name')}`,
  equipment_updated: (p) => `Equipment updated: ${getField(p, 'name')}`,
  equipment_deleted: (p) => `Equipment removed: ${p.name || 'Unknown'}`,
  // Inspections
  inspection_scheduled: (p) => `Inspection scheduled: ${getField(p, 'title')}`,
  inspection_updated: (p) => `Inspection updated: ${getField(p, 'title')}`,
  inspection_passed: (p) => `✓ Inspection passed: ${getField(p, 'title')}`,
  inspection_failed: (p) => `✗ Inspection failed: ${getField(p, 'title')}`,
  inspection_deleted: (p) => `Inspection deleted`,
  // Meetings
  meeting_recorded: (p) => `Meeting minutes recorded: ${getField(p, 'title')}`,
  meeting_updated: (p) => `Meeting updated: ${getField(p, 'title')}`,
  meeting_deleted: (p) => `Meeting deleted`,
  // Activity
  activity_logged: (p) => `${p.userName || 'Someone'} ${p.action || 'performed an action'}${p.entityName ? ` on ${p.entityName}` : ''}`,
};

interface RealtimeProviderProps {
  children: React.ReactNode;
  showToasts?: boolean;
}

export function RealtimeProvider({ children, showToasts = true }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [connectedClients, setConnectedClients] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const subscribersRef = useRef<Map<RealtimeEventType, Set<(event: RealtimeEvent) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    const eventSource = new EventSource('/api/realtime');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEvent;
        setLastEvent(data);

        if (data.type === 'connected') {
          const payload = data.payload as { connectedClients?: number };
          if (payload.connectedClients !== undefined) {
            setConnectedClients(payload.connectedClients);
          }
          return;
        }

        // Notify subscribers
        const subscribers = subscribersRef.current.get(data.type);
        if (subscribers) {
          subscribers.forEach(handler => handler(data));
        }

        // Show toast notification for relevant events
        if (showToasts && eventMessages[data.type]) {
          const message = eventMessages[data.type]!(data.payload);
          toast.info(message, {
            duration: 4000,
            position: 'bottom-right',
          });
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      eventSourceRef.current = null;

      // Exponential backoff reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };
  }, [showToasts]);

  const subscribe = useCallback((eventType: RealtimeEventType | RealtimeEventType[], handler: (event: RealtimeEvent) => void) => {
    const types = Array.isArray(eventType) ? eventType : [eventType];

    types.forEach(type => {
      if (!subscribersRef.current.has(type)) {
        subscribersRef.current.set(type, new Set());
      }
      subscribersRef.current.get(type)!.add(handler);
    });

    // Return unsubscribe function
    return () => {
      types.forEach(type => {
        subscribersRef.current.get(type)?.delete(handler);
      });
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, connectedClients, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

// Hook for subscribing to specific event types
export function useRealtimeSubscription(
  eventType: RealtimeEventType | RealtimeEventType[],
  handler: (event: RealtimeEvent) => void,
  deps: React.DependencyList = []
) {
  const { subscribe } = useRealtimeContext();

  useEffect(() => {
    const unsubscribe = subscribe(eventType, handler);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, ...(Array.isArray(eventType) ? eventType : [eventType]), ...deps]);
}
