"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  RealtimeEvent,
  RealtimeEventType,
  createRealtimeConnection,
} from "@/lib/realtime";

export function useRealtimeSubscription(
  eventTypes: RealtimeEventType[],
  callback: () => void,
) {
  const { lastEvent } = useRealtime();
  useEffect(() => {
    if (lastEvent && eventTypes.includes(lastEvent.type as RealtimeEventType)) {
      callback();
    }
  }, [lastEvent, eventTypes, callback]);
}

export function useRealtime(onEvent?: (event: RealtimeEvent) => void) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const handleMessage = useCallback(
    (event: RealtimeEvent) => {
      setLastEvent(event);
      if (event.type === "connected") {
        setIsConnected(true);
      }
      onEvent?.(event);
    },
    [onEvent],
  );

  const handleError = useCallback(() => {
    setIsConnected(false);
    // Attempt reconnection after 5 seconds
    setTimeout(() => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = createRealtimeConnection(
          handleMessage,
          handleError,
        );
      }
    }, 5000);
  }, [handleMessage]);

  useEffect(() => {
    eventSourceRef.current = createRealtimeConnection(
      handleMessage,
      handleError,
    );

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [handleMessage, handleError]);

  return { isConnected, lastEvent };
}
