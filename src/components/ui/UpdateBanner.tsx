import { useState } from "react";
import { performSystemUpdate, restartServer } from "../../services/update";

type Stage = "idle" | "updating" | "restarting" | "waiting" | "done" | "error";

interface UpdateBannerProps {
  localCommit: string;
  remoteCommit: string;
  onDismiss: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export function UpdateBanner({ localCommit, remoteCommit, onDismiss, t }: UpdateBannerProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");

  async function handleUpdate() {
    setStage("updating");
    try {
      const result = await performSystemUpdate();
      if (!result.success) {
        setError(result.message || "Unknown error");
        setStage("error");
        return;
      }
      setStage("restarting");
      await restartServer();
      setStage("waiting");
      // Poll until backend is back up
      const poll = setInterval(async () => {
        try {
          const res = await fetch("/api/servers");
          if (res.ok) {
            clearInterval(poll);
            setStage("done");
            setTimeout(() => window.location.reload(), 800);
          }
        } catch {
          // still restarting, keep polling
        }
      }, 1500);
    } catch (e) {
      setError(String(e));
      setStage("error");
    }
  }

  return (
    <div className="update-banner" role="status">
      <span className="update-banner-icon">↑</span>

      <div className="update-banner-body">
        {stage === "idle" && (
          <p className="update-banner-message">
            {t("update_available", { local: localCommit, remote: remoteCommit })}
          </p>
        )}
        {stage === "updating" && <p className="update-banner-message">{t("update_pulling")}</p>}
        {stage === "restarting" && <p className="update-banner-message">{t("update_restarting")}</p>}
        {stage === "waiting" && <p className="update-banner-message">{t("update_waiting")}</p>}
        {stage === "done" && <p className="update-banner-message">{t("update_done")}</p>}
        {stage === "error" && (
          <p className="update-banner-message update-banner-error">
            {t("update_failed")}: {error}
          </p>
        )}
      </div>

      <div className="update-banner-actions">
        {stage === "idle" && (
          <button className="btn btn-primary btn-sm" onClick={handleUpdate}>
            {t("update_now")}
          </button>
        )}
        {(stage === "idle" || stage === "error") && (
          <button className="update-banner-close" onClick={onDismiss} aria-label={t("update_dismiss")}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
