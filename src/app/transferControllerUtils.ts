import type {
  TransferExportPreviewDto,
  TransferImportPreviewDto,
  TransferSelectionPayload,
} from "../types/api";

export interface TransferState {
  open: boolean;
  mode: "export" | "import" | null;
  exportPreview: TransferExportPreviewDto | null;
  exportSelection: TransferSelectionPayload;
  expandedServerIds: string[];
  importPreview: TransferImportPreviewDto | null;
  importBundle: Record<string, unknown> | null;
  applyEnvironment: boolean;
  loading: boolean;
}

export function initialTransferState(): TransferState {
  return {
    open: false,
    mode: null,
    exportPreview: null,
    exportSelection: { servers: [] },
    expandedServerIds: [],
    importPreview: null,
    importBundle: null,
    applyEnvironment: false,
    loading: false,
  };
}

export function createFullExportSelection(preview: TransferExportPreviewDto): TransferSelectionPayload {
  return {
    servers: preview.servers.map((server) => ({
      server_id: server.server_id,
      workflow_ids: server.workflows.map((workflow) => workflow.workflow_id),
    })),
  };
}

export function getDefaultExpandedServerIds(preview: TransferExportPreviewDto): string[] {
  return preview.servers.length === 1 ? [preview.servers[0].server_id] : [];
}

export function getTransferValidationMessages(detail: unknown): string[] {
  if (!detail || typeof detail !== "object") {
    return [];
  }

  const detailRecord = detail as Record<string, unknown>;
  const errors = Array.isArray(detailRecord.errors)
    ? detailRecord.errors
    : detailRecord.validation && typeof detailRecord.validation === "object" && Array.isArray((detailRecord.validation as Record<string, unknown>).errors)
      ? (detailRecord.validation as Record<string, unknown>).errors as unknown[]
      : [];

  return errors
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>).message : ""))
    .filter((item): item is string => typeof item === "string" && Boolean(item));
}
