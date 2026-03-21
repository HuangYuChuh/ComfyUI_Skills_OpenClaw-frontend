import { useEffect } from "react";
import {
  checkSystemUpdate,
  readStoredUpdateFeedback,
  type StoredUpdateFeedback,
  type UpdateCheckResult,
} from "../../services/update";

const UPDATE_CHECK_DELAY_MS = 3000;

interface UseUpdateBannerBootstrapArgs {
  setUpdateFeedback: (feedback: StoredUpdateFeedback | null) => void;
  setUpdateInfo: (info: UpdateCheckResult | null) => void;
}

export function useUpdateBannerBootstrap(args: UseUpdateBannerBootstrapArgs) {
  useEffect(() => {
    const feedback = readStoredUpdateFeedback();
    args.setUpdateFeedback(feedback);
    if (feedback || sessionStorage.getItem("update-banner-dismissed")) {
      return;
    }

    const timer = window.setTimeout(() => {
      checkSystemUpdate()
        .then((result) => {
          if (result.has_update) {
            args.setUpdateInfo(result);
          }
        })
        .catch(() => {});
    }, UPDATE_CHECK_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [args.setUpdateFeedback, args.setUpdateInfo]);
}
