import { requestJson } from "./http";

export interface UpdateCheckResult {
  has_update: boolean;
  local_commit?: string;
  remote_commit?: string;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
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
