import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface UseApiWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
}

interface UseApiWithRetryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

export function useApiWithRetry<T = any>(
  apiFn: (...args: any[]) => Promise<T>,
  options: UseApiWithRetryOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showToast = true
  } = options;

  const [state, setState] = useState<UseApiWithRetryState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
    isRetrying: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const { addToast } = useToast();

  const delay = useCallback((ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const isRetryableError = useCallback((error: any): boolean => {
    // Network errors
    if (!error.response && error.request) return true;
    
    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return true;
    
    // Server errors (5xx)
    if (error.response?.status >= 500 && error.response?.status < 600) return true;
    
    // Rate limiting (429)
    if (error.response?.status === 429) return true;
    
    return false;
  }, []);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      retryCount: 0,
      isRetrying: false 
    }));

    let lastError: Error | null = null;
    let currentRetry = 0;

    while (currentRetry <= maxRetries) {
      try {
        const result = await apiFn(...args);
        
        setState({
          data: result,
          loading: false,
          error: null,
          retryCount: currentRetry,
          isRetrying: false
        });

        if (showToast && successMessage) {
          addToast(successMessage, 'success');
        }

        onSuccess?.(result);
        return result;
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry
        if (currentRetry < maxRetries && isRetryableError(error)) {
          currentRetry++;
          const delayMs = exponentialBackoff 
            ? retryDelay * Math.pow(2, currentRetry - 1)
            : retryDelay;
          
          setState(prev => ({
            ...prev,
            isRetrying: true,
            retryCount: currentRetry
          }));
          
          if (showToast) {
            addToast(`Retrying... (${currentRetry}/${maxRetries})`, 'warning');
          }
          
          await delay(delayMs);
          continue;
        }
        
        // Don't retry - break the loop
        break;
      }
    }

    // All retries exhausted or non-retryable error
    setState({
      data: null,
      loading: false,
      error: lastError,
      retryCount: currentRetry,
      isRetrying: false
    });

    const finalMessage = errorMessage || lastError?.message || 'An error occurred';
    if (showToast) {
      addToast(finalMessage, 'error');
    }

    onError?.(lastError!);
    return null;
  }, [apiFn, maxRetries, retryDelay, exponentialBackoff, onSuccess, onError, successMessage, errorMessage, showToast, addToast, delay, isRetryableError]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0,
      isRetrying: false
    });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({
      ...prev,
      loading: false,
      isRetrying: false
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    cancel,
    retry: execute
  };
}

export default useApiWithRetry;
