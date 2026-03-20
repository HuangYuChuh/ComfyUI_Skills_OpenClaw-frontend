import { requestJson } from "./http";

const UPDATE_FEEDBACK_STORAGE_KEY = "update-banner-feedback";

export interface UpdateCheckResult {
  has_update: boolean;
  local_commit?: string;
  remote_commit?: string;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  component?: "system" | "frontend";
  message?: string;
  commit_before?: string;
  commit_after?: string;
}

export interface StoredUpdateFeedback {
  status: "success" | "error";
  component?: "system" | "frontend";
  message?: string;
  commit_before?: string;
  commit_after?: string;
}

export function checkSystemUpdate(): Promise<UpdateCheckResult> {
  return requestJson<UpdateCheckResult>("/api/system/check-update");
}

export function performSystemUpdate(): Promise<UpdateResult> {
  return requestJson<UpdateResult>("/api/system/update", { method: "POST" });
}

export function restartServer(): Promise<{ status: string }> {
  return requestJson<{ status: string }>("/api/system/restart", { method: "POST" });
}

export function persistUpdateFeedback(feedback: StoredUpdateFeedback) {
  sessionStorage.setItem(UPDATE_FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
}

export function readStoredUpdateFeedback(): StoredUpdateFeedback | null {
  const raw = sessionStorage.getItem(UPDATE_FEEDBACK_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredUpdateFeedback;
  } catch {
    sessionStorage.removeItem(UPDATE_FEEDBACK_STORAGE_KEY);
    return null;
  }
}

export function clearStoredUpdateFeedback() {
  sessionStorage.removeItem(UPDATE_FEEDBACK_STORAGE_KEY);
}
