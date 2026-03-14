import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  offlineSince: Date | null;
  connectionType: string;
  effectiveType: string;
  downlink: number | null;
  rtt: number | null;
}

export function useOfflineDetection() {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    wasOffline: false,
    offlineSince: null,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: null,
    rtt: null
  });

  const { addToast } = useToast();

  const updateConnectionInfo = useCallback(() => {
    const connection = (navigator as any).connection;
    
    if (connection) {
      setState(prev => ({
        ...prev,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || null,
        rtt: connection.rtt || null
      }));
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => {
        const wasOffline = !prev.isOnline;
        if (wasOffline) {
          addToast('You are back online!', 'success');
        }
        return {
          ...prev,
          isOnline: true,
          wasOffline: wasOffline,
          offlineSince: null
        };
      });
    };

    const handleOffline = () => {
      setState(prev => {
        addToast('You are offline. Some features may be limited.', 'warning');
        return {
          ...prev,
          isOnline: false,
          wasOffline: false,
          offlineSince: new Date()
        };
      });
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [addToast, updateConnectionInfo]);

  const getOfflineDuration = useCallback(() => {
    if (!state.offlineSince) return null;
    return Date.now() - state.offlineSince.getTime();
  }, [state.offlineSince]);

  const formatOfflineDuration = useCallback(() => {
    const duration = getOfflineDuration();
    if (!duration) return '';
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }, [getOfflineDuration]);

  return {
    ...state,
    getOfflineDuration,
    formatOfflineDuration,
    isSlowConnection: state.effectiveType === '2g' || state.effectiveType === 'slow-2g'
  };
}

export default useOfflineDetection;
