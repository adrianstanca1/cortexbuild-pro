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

  const execute = useCallback(async () => {
    if (!isMounted.current) return;

    setState({ status: "pending", data: null, error: null });
    retryCountRef.current = retryCount;

    const attempt = async (): Promise<void> => {
      try {
        const data = await asyncFn();
        if (isMounted.current) {
          setState({ status: "success", data, error: null });
        }
      } catch (error) {
        if (!isMounted.current) return;

        if (retryCountRef.current > 0) {
          retryCountRef.current--;
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return attempt();
        }

        setState({
          status: "error",
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    };

    await attempt();
  }, [asyncFn, retryCount, retryDelay]);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      isMounted.current = false;
    };
  }, [immediate, execute]);

  return {
    ...state,
    isLoading: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    refetch: execute,
  };
}
