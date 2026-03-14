import { useCallback, useEffect, useRef, useState } from "react";

type AsyncDataState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "pending"; data: T | null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: Error };

export function useAsyncData<T>(
  asyncFn: () => Promise<T>,
  options: {
    immediate?: boolean;
    retryCount?: number;
    retryDelay?: number;
  } = {}
) {
  const {
    immediate = true,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<AsyncDataState<T>>({
    status: "idle",
    data: null,
    error: null,
  });

  const retryCountRef = useRef(retryCount);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(
    async (attempt = 0) => {
      if (!isMounted.current) return;

      setState({ status: "pending", data: state.data, error: null });

      try {
        const data = await asyncFn();
        if (isMounted.current) {
          setState({ status: "success", data, error: null });
        }
      } catch (error) {
        if (isMounted.current) {
          if (attempt < retryCount) {
            // Retry after delay
            setTimeout(() => {
              execute(attempt + 1);
            }, retryDelay * Math.pow(2, attempt)); // Exponential backoff
          } else {
            // Max retries exceeded
            setState({
              status: "error",
              data: null,
              error: error instanceof Error ? error : new Error(String(error)),
            });
          }
        }
      }
    },
    [asyncFn, retryCount, retryDelay, state.data]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const retry = useCallback(() => {
    retryCountRef.current = retryCount;
    execute(0);
  }, [execute]);

  return {
    ...state,
    retry,
    isLoading: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
  };
}