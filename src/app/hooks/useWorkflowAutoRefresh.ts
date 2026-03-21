import { useEffect, useRef } from "react";

const WORKFLOW_REFRESH_INTERVAL_MS = 5000;

function useLatestValue<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

interface UseWorkflowAutoRefreshArgs {
  enabled: boolean;
  refreshWorkflows: () => Promise<void>;
}

export function useWorkflowAutoRefresh(args: UseWorkflowAutoRefreshArgs) {
  const refreshWorkflowsRef = useLatestValue(args.refreshWorkflows);

  useEffect(() => {
    if (!args.enabled) {
      return;
    }

    let disposed = false;
    let refreshTimer: number | null = null;
    let refreshInFlight = false;
    let rerunRequested = false;

    const clearRefreshTimer = () => {
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    };

    const scheduleRefresh = () => {
      clearRefreshTimer();
      if (disposed || document.visibilityState !== "visible") {
        return;
      }
      refreshTimer = window.setTimeout(() => {
        void runRefresh();
      }, WORKFLOW_REFRESH_INTERVAL_MS);
    };

    const runRefresh = () => {
      clearRefreshTimer();
      if (disposed || document.visibilityState !== "visible") {
        return;
      }
      if (refreshInFlight) {
        rerunRequested = true;
        return;
      }

      refreshInFlight = true;
      void refreshWorkflowsRef.current()
        .catch(() => {})
        .finally(() => {
          refreshInFlight = false;
          if (disposed) {
            return;
          }
          if (rerunRequested) {
            rerunRequested = false;
            void runRefresh();
            return;
          }
          scheduleRefresh();
        });
    };

    const handlePageActivity = () => {
      if (document.visibilityState !== "visible") {
        rerunRequested = false;
        clearRefreshTimer();
        return;
      }
      void runRefresh();
    };

    scheduleRefresh();
    window.addEventListener("focus", handlePageActivity);
    document.addEventListener("visibilitychange", handlePageActivity);

    return () => {
      disposed = true;
      rerunRequested = false;
      clearRefreshTimer();
      window.removeEventListener("focus", handlePageActivity);
      document.removeEventListener("visibilitychange", handlePageActivity);
    };
  }, [args.enabled, refreshWorkflowsRef]);
}
