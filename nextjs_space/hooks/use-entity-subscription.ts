/**
 * Custom hook for entity realtime subscriptions
 * Consolidates duplicated realtime subscription patterns across components
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeSubscription } from '@/components/realtime-provider';

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
 *   onEvent: (eventType) => {
 *     console.log('Event received:', eventType);
 *   }
 * });
 */
export function useEntitySubscription(
  entityType: string,
  options?: {
    onEvent?: (eventType: string) => void;
    includeDeleted?: boolean;
  }
) {
  const router = useRouter();
  const { onEvent, includeDeleted = false } = options || {};

  const handleEvent = useCallback((eventType: string) => {
    router.refresh();
    onEvent?.(eventType);
  }, [router, onEvent]);

  // Build event list based on entity type
  const events = [
    `${entityType}_created`,
    `${entityType}_updated`,
    ...(includeDeleted ? [`${entityType}_deleted`] : [])
  ];

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
    onEvent?: (eventType: string) => void;
    includeDeleted?: boolean;
  }
) {
  const router = useRouter();
  const { onEvent, includeDeleted = false } = options || {};

  const handleEvent = useCallback((eventType: string) => {
    router.refresh();
    onEvent?.(eventType);
  }, [router, onEvent]);

  // Build event list from all entity types
  const events = entityTypes.flatMap(entityType => [
    `${entityType}_created`,
    `${entityType}_updated`,
    ...(includeDeleted ? [`${entityType}_deleted`] : [])
  ]);

  useRealtimeSubscription(events, handleEvent, []);
}
