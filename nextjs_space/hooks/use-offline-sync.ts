"use client";

import { useState, useEffect, useCallback } from "react";
import {
  processQueuedRequests,
  getQueueLength,
  getSyncStatus,
  manualSync
} from "@/lib/offline/sync-queue";

export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());

  // Update sync status periodically
  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(getSyncStatus());
    };

    const intervalId = setInterval(updateSyncStatus, 10000); // Update every 10 seconds
    return () => clearInterval(intervalId);
  }, []);

  // Update queue length periodically when online
  useEffect(() => {
    if (!syncStatus.isOnline) return;

    const updateQueueLength = async () => {
      try {
        const length = await getQueueLength();
        setQueueLength(length);
      } catch (error) {
        console.error("Error getting queue length:", error);
      }
    };

    const intervalId = setInterval(updateQueueLength, 5000); // Update every 5 seconds
    return () => clearInterval(intervalId);
  }, [syncStatus.isOnline]);

  // Manual sync function
  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await manualSync();
      setLastSync(new Date());
      return result;
    } catch (error) {
      console.error("Manual sync failed:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    const handleOnline = async () => {
      await processQueuedRequests();
      setLastSync(new Date());
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      return () => window.removeEventListener("online", handleOnline);
    }
  }, []);

  return {
    isSyncing,
    queueLength,
    lastSync,
    syncStatus,
    manualSync: handleManualSync,
    // Expose individual functions for advanced usage
    processQueuedRequests,
    getQueueLength
  };
}

// Simple version for components that just need basic sync status
export function useOfflineStatus() {
  const [status, setStatus] = useState(getSyncStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(getSyncStatus());
    };

    const intervalId = setInterval(updateStatus, 15000);
    return () => clearInterval(intervalId);
  }, []);

  return status;
}