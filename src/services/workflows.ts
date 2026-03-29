import type {
  BulkImportPreviewReportDto,
  BulkImportReportDto,
  DependencyReportDto,
  ExecutionHistoryDetailDto,
  ExecutionHistorySummaryDto,
  InstallReportDto,
  LocalWorkflowImportFilePayload,
  RunWorkflowResponseDto,
  SaveWorkflowPayload,
  TogglePayload,
  WorkflowBatchDeleteResponseDto,
  WorkflowDetailDto,
  WorkflowIdsPayload,
  WorkflowOrderPayload,
  WorkflowSummaryDto,
} from "../types/api";
import { requestJson } from "./http";

export function listWorkflows() {
  return requestJson<{ workflows: WorkflowSummaryDto[] }>("/api/workflows");
}

export function getWorkflowDetail(serverId: string, workflowId: string) {
  return requestJson<WorkflowDetailDto>(`/api/servers/${encodeURIComponent(serverId)}/workflow/${encodeURIComponent(workflowId)}`);
}

export function saveWorkflow(serverId: string, payload: SaveWorkflowPayload) {
  return requestJson<{ status: string; workflow_id: string }>(`/api/servers/${encodeURIComponent(serverId)}/workflow/save`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function toggleWorkflow(serverId: string, workflowId: string, payload: TogglePayload) {
  return requestJson<{ status: string; enabled: boolean }>(`/api/servers/${encodeURIComponent(serverId)}/workflow/${encodeURIComponent(workflowId)}/toggle`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteWorkflow(serverId: string, workflowId: string) {
  return requestJson<{ status: string }>(`/api/servers/${encodeURIComponent(serverId)}/workflow/${encodeURIComponent(workflowId)}`, {
    method: "DELETE",
  });
}

export function batchDeleteWorkflows(serverId: string, payload: WorkflowIdsPayload) {
  return requestJson<WorkflowBatchDeleteResponseDto>(`/api/servers/${encodeURIComponent(serverId)}/workflows/batch-delete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reorderWorkflows(serverId: string, payload: WorkflowOrderPayload) {
  return requestJson<{ status: string; workflow_order: string[] }>(`/api/servers/${encodeURIComponent(serverId)}/workflows/reorder`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function runWorkflow(serverId: string, workflowId: string, args: Record<string, unknown>) {
  return requestJson<RunWorkflowResponseDto>(`/api/servers/${encodeURIComponent(serverId)}/workflow/${encodeURIComponent(workflowId)}/run`, {
    method: "POST",
    body: JSON.stringify({ args }),
  });
}

export function listWorkflowHistory(serverId: string, workflowId: string) {
  return requestJson<{ history: ExecutionHistorySummaryDto[] }>(
    `/api/servers/${encodeURIComponent(serverId)}/workflow/${encodeURIComponent(workflowId)}/history`,
  );
}

export function getWorkflowHistoryEntry(serverId: string, workflowId: string, runId: string) {
  return requestJson<ExecutionHistoryDetailDto>(
    `/api/servers/${encodeURIComponent(serverId)}/workflow/${encodeURIComponent(workflowId)}/history/${encodeURIComponent(runId)}`,
  );
}

export function deleteWorkflowHistoryEntry(serverId: string, workflowId: string, runId: string) {
  return requestJson<{ status: string }>(
    `/api/servers/${encodeURIComponent(serverId)}/workflow/${encodeURIComponent(workflowId)}/history/${encodeURIComponent(runId)}`,
    { method: "DELETE" },
  );
}

export function clearWorkflowHistory(serverId: string, workflowId: string) {
  return requestJson<{ status: string; deleted: number }>(
    `/api/servers/${encodeURIComponent(serverId)}/workflow/${encodeURIComponent(workflowId)}/history`,
    { method: "DELETE" },
  );
}

export function importWorkflowsFromComfyUI(serverId: string) {
  return requestJson<{ status: string; report: BulkImportReportDto }>(`/api/servers/${encodeURIComponent(serverId)}/workflows/import/comfyui`, {
    method: "POST",
  });
}

export function previewWorkflowsFromComfyUI(serverId: string) {
  return requestJson<{ status: string; preview: BulkImportPreviewReportDto }>(
    `/api/servers/${encodeURIComponent(serverId)}/workflows/import/comfyui/preview`,
  );
}

export async function uploadImageToComfyUI(
  serverId: string,
  file: File,
): Promise<{ name: string; subfolder: string; type: string }> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch(
    `/api/servers/${encodeURIComponent(serverId)}/upload/image`,
    { method: "POST", body: formData },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Upload failed");
  }
  return response.json();
}

export function importLocalWorkflows(serverId: string, files: LocalWorkflowImportFilePayload[]) {
  return requestJson<{ status: string; report: BulkImportReportDto }>(`/api/servers/${encodeURIComponent(serverId)}/workflows/import/local`, {
    method: "POST",
    body: JSON.stringify({ files }),
  });
}

// ── Dependency Check ────────────────────────────────────────

export function checkWorkflowDependencies(serverId: string, workflowData: Record<string, unknown>) {
  return requestJson<{ status: string; report: DependencyReportDto }>(
    `/api/servers/${encodeURIComponent(serverId)}/workflows/check-dependencies`,
    { method: "POST", body: JSON.stringify({ workflow_data: workflowData }) },
  );
}

export function checkSavedWorkflowDependencies(serverId: string, workflowId: string) {
  return requestJson<{ status: string; report: DependencyReportDto }>(
    `/api/servers/${encodeURIComponent(serverId)}/workflows/${encodeURIComponent(workflowId)}/check-dependencies`,
    { method: "POST" },
  );
}

export function installDependencies(serverId: string, repoUrls: string[]) {
  return requestJson<{ status: string; report: InstallReportDto }>(
    `/api/servers/${encodeURIComponent(serverId)}/install-dependencies`,
    { method: "POST", body: JSON.stringify({ repo_urls: repoUrls }) },
  );
}
