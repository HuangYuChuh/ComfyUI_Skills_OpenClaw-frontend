import { useState } from "react";
import {
  clearStoredUpdateFeedback,
  performSystemUpdate,
  persistUpdateFeedback,
  restartServer,
  type StoredUpdateFeedback,
  type UpdateResult,
} from "../../services/update";

type Stage = "idle" | "updating" | "restarting" | "waiting" | "done" | "error";
const RESTART_WAIT_TIMEOUT_MS = 45000;

interface UpdateBannerProps {
  localCommit: string;
  remoteCommit: string;
  feedback?: StoredUpdateFeedback | null;
  onDismiss: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function buildSuccessSummary(result: Pick<UpdateResult, "component" | "commit_before" | "commit_after" | "message">, t: UpdateBannerProps["t"]) {
  if (result.component === "system" && result.commit_before && result.commit_after) {
    return t("update_result_system", { before: result.commit_before, after: result.commit_after });
  }
  if (result.component === "frontend" && result.commit_before && result.commit_after) {
    return t("update_result_frontend", { before: result.commit_before, after: result.commit_after });
  }
  return result.message || t("update_result_generic");
}

function buildFeedbackMessage(feedback: StoredUpdateFeedback, t: UpdateBannerProps["t"]) {
  if (feedback.status === "success") {
    return buildSuccessSummary(feedback, t);
  }
  return feedback.message || t("update_failed");
}

export function buildCacheBustedReloadUrl(location: Location, timestamp = Date.now()) {
  const url = new URL(location.href);
  url.searchParams.set("__ui_reload", String(timestamp));
  return url.toString();
}

export function replaceWindowLocation(url: string) {
  window.location.replace(url);
}

export function UpdateBanner({ localCommit, remoteCommit, feedback, onDismiss, t }: UpdateBannerProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");

  async function handleUpdate() {
    setStage("updating");
    setError("");
    sessionStorage.removeItem("update-banner-dismissed");
    clearStoredUpdateFeedback();
    try {
      const result = await performSystemUpdate();
      if (!result.success) {
        setError(result.message || "Unknown error");
        setStage("error");
        return;
      }
      persistUpdateFeedback({
        status: "success",
        component: result.component,
        message: result.message,
        commit_before: result.commit_before,
        commit_after: result.commit_after,
      });
      setStage("restarting");
      await restartServer();
      setStage("waiting");
      const startedAt = Date.now();
      const poll = window.setInterval(async () => {
        try {
          const res = await fetch("/api/servers");
          if (res.ok) {
            window.clearInterval(poll);
            setStage("done");
            setTimeout(() => {
              replaceWindowLocation(buildCacheBustedReloadUrl(window.location));
            }, 800);
            return;
          }
        } catch {
          // still restarting, keep polling
        }
        if (Date.now() - startedAt >= RESTART_WAIT_TIMEOUT_MS) {
          window.clearInterval(poll);
          clearStoredUpdateFeedback();
          setError(t("update_wait_timeout"));
          setStage("error");
        }
      }, 1500);
    } catch (e) {
      clearStoredUpdateFeedback();
      setError(e instanceof Error ? e.message : String(e));
      setStage("error");
    }
  }

  const bannerTone =
    stage === "error" || feedback?.status === "error"
      ? "is-error"
      : feedback?.status === "success"
        ? "is-success"
        : "is-info";

  const settledFeedback = stage === "idle" ? feedback : null;

  return (
    <div className={`update-banner ${bannerTone}`} role="status">
      <span className="update-banner-icon">↑</span>

      <div className="update-banner-body">
        {stage === "idle" && !settledFeedback && (
          <p className="update-banner-message">
            {t("update_available", { local: localCommit, remote: remoteCommit })}
          </p>
        )}
        {stage === "idle" && settledFeedback?.status === "success" && (
          <>
            <p className="update-banner-message">{t("update_success")}</p>
            <p className="update-banner-detail">{buildFeedbackMessage(settledFeedback, t)}</p>
          </>
        )}
        {stage === "idle" && settledFeedback?.status === "error" && (
          <>
            <p className="update-banner-message update-banner-error">{t("update_failed")}</p>
            <p className="update-banner-detail update-banner-error">{buildFeedbackMessage(settledFeedback, t)}</p>
          </>
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
        {stage === "idle" && !settledFeedback && (
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
