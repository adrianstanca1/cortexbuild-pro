/**
 * Custom hook for entity realtime subscriptions
 * Consolidates duplicated realtime subscription patterns across components
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/components/realtime-provider';
import { REALTIME_EVENT_TYPES, RealtimeEvent, RealtimeEventType } from '@/lib/realtime';

const isRealtimeEventType = (eventType: string): eventType is RealtimeEventType =>
  REALTIME_EVENT_TYPES.includes(eventType as RealtimeEventType);

/**
 * Hook to subscribe to entity creation/update events and refresh the router
 * 
 * @param entityType - The entity type (e.g., 'project', 'document', 'task')
 * @param options - Optional configuration
 * @returns void
 * 
 * @example
 * // In a component
 * useEntitySubscription('project');
 * 
 * @example
 * // With custom callback
 * useEntitySubscription('task', {
 *   onEvent: (event) => {
 *     console.log('Event received:', event.type);
 *   }
 * });
 */
export function useEntitySubscription(
  entityType: string,
  options?: {
    onEvent?: (event: RealtimeEvent) => void;
    includeDeleted?: boolean;
  }
) {
  const router = useRouter();
  const { onEvent, includeDeleted = false } = options || {};

  const handleEvent = useCallback((event: RealtimeEvent) => {
    router.refresh();
    onEvent?.(event);
  }, [router, onEvent]);

  // Build event list based on entity type
  const rawEvents = [
    `${entityType}_created`,
    `${entityType}_updated`,
    ...(includeDeleted ? [`${entityType}_deleted`] : [])
  ];
  const events = rawEvents.filter(isRealtimeEventType);

  if (events.length !== rawEvents.length && process.env.NODE_ENV !== 'production') {
    const invalidEvents = rawEvents.filter(eventType => !isRealtimeEventType(eventType));
    console.warn('useEntitySubscription: Ignoring unsupported realtime events', {
      entityType,
      invalidEvents
    });
  }

  useRealtimeSubscription(events, handleEvent, []);
}

/**
 * Hook to subscribe to multiple entity types at once
 * 
 * @param entityTypes - Array of entity types to subscribe to
 * @param options - Optional configuration
 * 
 * @example
 * // Subscribe to multiple entities
 * useMultiEntitySubscription(['project', 'task', 'document']);
 */
export function useMultiEntitySubscription(
  entityTypes: string[],
  options?: {
    onEvent?: (event: RealtimeEvent) => void;
    includeDeleted?: boolean;
  }
) {
  const router = useRouter();
  const { onEvent, includeDeleted = false } = options || {};

  const handleEvent = useCallback((event: RealtimeEvent) => {
    router.refresh();
    onEvent?.(event);
  }, [router, onEvent]);

  // Build event list from all entity types
  const rawEvents = entityTypes.flatMap(entityType => [
    `${entityType}_created`,
    `${entityType}_updated`,
    ...(includeDeleted ? [`${entityType}_deleted`] : [])
  ]);
  const events = rawEvents.filter(isRealtimeEventType);

  if (events.length !== rawEvents.length && process.env.NODE_ENV !== 'production') {
    const invalidEvents = rawEvents.filter(eventType => !isRealtimeEventType(eventType));
    console.warn('useMultiEntitySubscription: Ignoring unsupported realtime events', {
      entityTypes,
      invalidEvents
    });
  }

  useRealtimeSubscription(events, handleEvent, []);
}
