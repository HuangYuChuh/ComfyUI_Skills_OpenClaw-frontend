import { requestJson } from "./http";

export interface UpdateCheckResult {
  has_update: boolean;
  local_commit?: string;
  remote_commit?: string;
  remote_date?: string;
  error?: string;
}

export async function checkFrontendUpdate(): Promise<UpdateCheckResult> {
  return requestJson<UpdateCheckResult>("/api/frontend/check-update");
}
