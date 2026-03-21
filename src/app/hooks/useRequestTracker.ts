import { useCallback, useMemo, useRef } from "react";

interface RequestTracker {
  begin: () => number;
  current: () => number;
  invalidate: () => number;
  isCurrent: (requestId: number) => boolean;
}

export function useRequestTracker(): RequestTracker {
  const requestIdRef = useRef(0);

  const begin = useCallback(() => {
    requestIdRef.current += 1;
    return requestIdRef.current;
  }, []);

  const current = useCallback(() => requestIdRef.current, []);

  const invalidate = useCallback(() => {
    requestIdRef.current += 1;
    return requestIdRef.current;
  }, []);

  const isCurrent = useCallback((requestId: number) => requestIdRef.current === requestId, []);

  return useMemo(() => ({
    begin,
    current,
    invalidate,
    isCurrent,
  }), [begin, current, invalidate, isCurrent]);
}
