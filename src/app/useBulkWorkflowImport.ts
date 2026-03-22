import { useRef, useState } from "react";
import { importLocalWorkflows, importWorkflowsFromComfyUI, previewWorkflowsFromComfyUI } from "../services/workflows";
import type { BulkImportPreviewReportDto, BulkImportReportDto, LocalWorkflowImportFilePayload, ServerDto } from "../types/api";

type BulkImportSource = "comfyui" | "local" | null;
type BulkImportLoadingStage = "preview" | "import" | null;

export interface BulkImportState {
  open: boolean;
  report: BulkImportReportDto | null;
  previewOpen: boolean;
  preview: BulkImportPreviewReportDto | null;
  source: BulkImportSource;
  loading: boolean;
  loadingStage: BulkImportLoadingStage;
}

function initialBulkImportState(): BulkImportState {
  return {
    open: false,
    report: null,
    previewOpen: false,
    preview: null,
    source: null,
    loading: false,
    loadingStage: null,
  };
}

interface UseBulkWorkflowImportArgs {
  currentServer: (ServerDto & { unsupported?: boolean; server_type?: string }) | null;
  effectiveServerId: string | null;
  refreshWorkflows: () => Promise<void>;
  pushToast: (type: "success" | "error" | "info", message: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function getFilePath(file: File) {
  return "webkitRelativePath" in file && typeof file.webkitRelativePath === "string"
    ? file.webkitRelativePath
    : "";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useBulkWorkflowImport(args: UseBulkWorkflowImportArgs) {
  const [bulkImportState, setBulkImportState] = useState<BulkImportState>(initialBulkImportState());
  const localImportFilesRef = useRef<HTMLInputElement | null>(null);
  const localImportFolderRef = useRef<HTMLInputElement | null>(null);
  const requestRef = useRef(0);

  function createRequest() {
    requestRef.current += 1;
    return requestRef.current;
  }

  function isCurrentRequest(requestId: number) {
    return requestRef.current === requestId;
  }

  function closeBulkImportModal() {
    createRequest();
    setBulkImportState(initialBulkImportState());
  }

  function closeComfyUiImportPreview() {
    setBulkImportState((current) => ({
      ...current,
      previewOpen: false,
      preview: null,
      loading: false,
      loadingStage: null,
      source: current.open ? current.source : null,
    }));
  }

  function ensureImportServerReady(explicitServerId?: string) {
    if (explicitServerId) {
      return explicitServerId;
    }
    if (args.currentServer?.unsupported) {
      args.pushToast("info", args.t("server_unsupported_reason", { type: args.currentServer.server_type || "unknown" }));
      return null;
    }
    if (!args.effectiveServerId) {
      args.pushToast("error", args.t("err_select_server_before_register"));
      return null;
    }
    return args.effectiveServerId;
  }

  function pushSummaryToast(report: BulkImportReportDto) {
    args.pushToast("success", args.t("ok_bulk_import_summary", {
      created: report.summary.created,
      renamed: report.summary.renamed,
      failed: report.summary.failed,
    }));
  }

  async function showReport(source: Exclude<BulkImportSource, null>, report: BulkImportReportDto, requestId: number) {
    try {
      await args.refreshWorkflows();
    } catch (error) {
      if (isCurrentRequest(requestId)) {
        args.pushToast("error", getErrorMessage(error, args.t("err_load_workflows")));
      }
    }
    if (!isCurrentRequest(requestId)) {
      return;
    }
    setBulkImportState({
      open: true,
      report,
      previewOpen: false,
      preview: null,
      source,
      loading: false,
      loadingStage: null,
    });
    pushSummaryToast(report);
  }

  function handleOpenLocalImportFiles() {
    localImportFilesRef.current?.click();
  }

  function handleOpenLocalImportFolder() {
    localImportFolderRef.current?.click();
  }

  async function handlePreviewImportFromComfyUI(explicitServerId?: string) {
    const serverId = ensureImportServerReady(explicitServerId);
    if (!serverId) {
      return;
    }

    const requestId = createRequest();
    setBulkImportState((current) => ({
      ...current,
      source: "comfyui",
      loading: true,
      loadingStage: "preview",
      previewOpen: false,
      preview: null,
    }));

    try {
      const response = await previewWorkflowsFromComfyUI(serverId);
      if (!isCurrentRequest(requestId)) {
        return;
      }
      setBulkImportState((current) => ({
        ...current,
        source: "comfyui",
        loading: false,
        loadingStage: null,
        previewOpen: true,
        preview: response.preview,
      }));
    } catch (error) {
      if (!isCurrentRequest(requestId)) {
        return;
      }
      setBulkImportState((current) => ({ ...current, loading: false, loadingStage: null }));
      args.pushToast("error", getErrorMessage(error, args.t("err_bulk_import_comfyui_preview")));
    }
  }

  async function handleImportAllFromComfyUI(explicitServerId?: string) {
    const serverId = ensureImportServerReady(explicitServerId);
    if (!serverId) {
      return;
    }

    const requestId = createRequest();
    setBulkImportState((current) => ({
      ...current,
      loading: true,
      loadingStage: "import",
      source: "comfyui",
      previewOpen: false,
    }));
    try {
      const response = await importWorkflowsFromComfyUI(serverId);
      if (!isCurrentRequest(requestId)) {
        return;
      }
      await showReport("comfyui", response.report, requestId);
    } catch (error) {
      if (!isCurrentRequest(requestId)) {
        return;
      }
      setBulkImportState((current) => ({ ...current, loading: false, loadingStage: null }));
      args.pushToast("error", getErrorMessage(error, args.t("err_bulk_import_comfyui")));
    }
  }

  async function importLocalWorkflowFiles(files: File[]) {
    const serverId = ensureImportServerReady();
    if (!serverId || !files.length) {
      return;
    }

    const requestId = createRequest();
    setBulkImportState((current) => ({ ...current, loading: true, loadingStage: "import", source: "local" }));
    try {
      const payload = await Promise.all(files.map(async (file) => ({
        file_name: getFilePath(file) || file.name,
        content: await file.text(),
      } satisfies LocalWorkflowImportFilePayload)));
      const response = await importLocalWorkflows(serverId, payload);
      if (!isCurrentRequest(requestId)) {
        return;
      }
      await showReport("local", response.report, requestId);
    } catch (error) {
      if (!isCurrentRequest(requestId)) {
        return;
      }
      setBulkImportState((current) => ({ ...current, loading: false, loadingStage: null }));
      args.pushToast("error", getErrorMessage(error, args.t("err_bulk_import_local")));
    }
  }

  async function handleLocalImportFilesChange(fileList: FileList | null) {
    await importLocalWorkflowFiles(Array.from(fileList || []));
  }

  return {
    bulkImportState,
    localImportFilesRef,
    localImportFolderRef,
    closeBulkImportModal,
    closeComfyUiImportPreview,
    handleOpenLocalImportFiles,
    handleOpenLocalImportFolder,
    handlePreviewImportFromComfyUI,
    handleImportAllFromComfyUI,
    handleLocalImportFilesChange,
  };
}
