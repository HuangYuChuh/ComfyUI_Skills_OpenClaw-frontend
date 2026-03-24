import { useCallback, useState, useRef } from "react";
import { normalizeLanguage, translate, type Language } from "../i18n";
import { safeReadLocalStorage } from "../lib/storage";
import type {
  TransferPlanItemDto,
  WorkflowDetailDto,
  WorkflowSummaryDto,
} from "../types/api";
import { buildEditorStateFromDetail } from "./editorUtils";
import { useAppEffects } from "./useAppEffects";
import { useAppDerivedState } from "./useAppDerivedState";
import { useConfirmState } from "./useConfirmState";
import { useServerManagement } from "./useServerManagement";
import { useToastState } from "./useToastState";
import { createEditorActions } from "./editorActions";
import { useBulkWorkflowImport } from "./useBulkWorkflowImport";
import { useRequestTracker } from "./hooks/useRequestTracker";
import {
  createFullExportSelection,
  getDefaultExpandedServerIds,
  getTransferValidationMessages,
  initialTransferState,
  type TransferState,
} from "./transferControllerUtils";
import {
  buildRunWorkflowDefaults,
  ensureWorkflowHasHistory,
  initialRunWorkflowState,
  initialWorkflowHistoryState,
  normalizeRunSchema,
  updateStateWorkflowHasHistory,
  type RunWorkflowState,
  type WorkflowHistoryState,
} from "./workflowControllerUtils";
import {
  defaultEditorFilters,
  defaultEditorState,
} from "./state";
import { createWorkflowActions } from "./workflowActions";
import {
  clearWorkflowHistory,
  deleteWorkflowHistoryEntry,
  getWorkflowDetail,
  getWorkflowHistoryEntry,
  listWorkflowHistory,
  listWorkflows,
  runWorkflow,
  uploadImageToComfyUI,
} from "../services/workflows";
import { buildTransferExport, importTransferBundle, previewTransferExport, previewTransferImport } from "../services/transfer";
import {
  clearStoredUpdateFeedback,
  type StoredUpdateFeedback,
  type UpdateCheckResult,
} from "../services/update";

export function useAppController({ isEditorRoute }: { isEditorRoute: boolean }) {
  const [language, setLanguage] = useState<Language>(() => normalizeLanguage(safeReadLocalStorage("ui-lang")));
  const [workflows, setWorkflows] = useState<WorkflowSummaryDto[]>([]);
  const [editorState, setEditorState] = useState(defaultEditorState());
  const [editorFilters, setEditorFilters] = useState(defaultEditorFilters());
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [expandedParamKeys, setExpandedParamKeys] = useState<Set<string>>(new Set());
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [workflowSort, setWorkflowSort] = useState("updated_desc");
  const [lastAutoWorkflowId, setLastAutoWorkflowId] = useState("");
  const [transferState, setTransferState] = useState<TransferState>(initialTransferState());
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [updateFeedback, setUpdateFeedback] = useState<StoredUpdateFeedback | null>(null);
  const [runModalState, setRunModalState] = useState<RunWorkflowState>(initialRunWorkflowState());
  const [executingWorkflows, setExecutingWorkflows] = useState<Record<string, { status: "running" | "success" | "error"; startedAt: number }>>({});
  const [historyState, setHistoryState] = useState<WorkflowHistoryState>(initialWorkflowHistoryState());

  const versionUploadRef = useRef<HTMLInputElement | null>(null);
  const transferImportRef = useRef<HTMLInputElement | null>(null);
  const pendingVersionTargetRef = useRef<WorkflowDetailDto | null>(null);
  const mappingSearchRef = useRef<HTMLInputElement | null>(null);
  const transferSession = useRequestTracker();
  const importPreviewRequest = useRequestTracker();
  const runModalRequest = useRequestTracker();
  const historyListRequest = useRequestTracker();
  const historyDetailRequest = useRequestTracker();
  const { toasts, dismissToast, pushToast } = useToastState();
  const { confirmState, setConfirmState, resolveConfirm, confirm } = useConfirmState();
  const t = (key: string, vars?: Record<string, string | number>) => translate(language, key, vars);
  const refreshWorkflows = useCallback(async () => {
    const data = await listWorkflows();
    setWorkflows(data.workflows || []);
  }, []);
  const serverManagement = useServerManagement({ t, pushToast, refreshWorkflows, setConfirmState });

  const derived = useAppDerivedState({
    currentServerId: serverManagement.currentServerId,
    defaultServerId: serverManagement.defaultServerId,
    servers: serverManagement.servers,
    workflows,
    workflowSearch,
    workflowSort,
    editorFilters,
    schemaParams: editorState.schemaParams,
    t,
  });
  const bulkWorkflowImport = useBulkWorkflowImport({
    currentServer: derived.currentServer,
    effectiveServerId: derived.effectiveServerId,
    refreshWorkflows,
    pushToast,
    t,
  });

  async function handleSubmitServerModal(importAfterCreate = false) {
    await serverManagement.handleSubmitServerModal(importAfterCreate, bulkWorkflowImport.handleImportAllFromComfyUI);
  }

  function resetEditorUiState() {
    setCollapsedNodeIds(new Set());
    setExpandedParamKeys(new Set());
    setEditorFilters(defaultEditorFilters());
    setLastAutoWorkflowId("");
  }

  function resetEditor() {
    setEditorState(defaultEditorState());
    resetEditorUiState();
  }

  async function openEditor(detail?: WorkflowDetailDto) {
    resetEditorUiState();
    setEditorState(detail ? buildEditorStateFromDetail(detail) : defaultEditorState());
  }

  function closeTransferModal() {
    transferSession.begin();
    setTransferState(initialTransferState());
  }

  function getTransferErrorMessage(error: unknown, fallbackKey: string) {
    if (error && typeof error === "object" && "detail" in error) {
      const messages = getTransferValidationMessages((error as { detail?: unknown }).detail);
      if (messages.length > 0) {
        return messages.join("; ");
      }
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return t(fallbackKey);
  }

  async function handleOpenTransferExport() {
    const sessionId = transferSession.begin();
    try {
      const preview = await previewTransferExport();
      if (!transferSession.isCurrent(sessionId)) {
        return;
      }
      setTransferState({
        open: true,
        mode: "export",
        exportPreview: preview,
        exportSelection: createFullExportSelection(preview),
        expandedServerIds: getDefaultExpandedServerIds(preview),
        importPreview: null,
        importBundle: null,
        applyEnvironment: false,
        loading: false,
      });
    } catch (error) {
      pushToast("error", getTransferErrorMessage(error, "err_transfer_export_preview"));
    }
  }

  function handleOpenTransferImport() {
    transferImportRef.current?.click();
  }

  function toggleTransferServerSelection(serverId: string, workflowIds: string[]) {
    setTransferState((current) => {
      const existing = current.exportSelection.servers.find((server) => server.server_id === serverId);
      const nextSelected = existing && existing.workflow_ids.length === workflowIds.length ? [] : workflowIds;
      return {
        ...current,
        exportSelection: {
          servers: current.exportSelection.servers.map((server) => (
            server.server_id === serverId
              ? { ...server, workflow_ids: nextSelected }
              : server
          )),
        },
      };
    });
  }

  function toggleTransferWorkflowSelection(serverId: string, workflowId: string) {
    setTransferState((current) => ({
      ...current,
      exportSelection: {
        servers: current.exportSelection.servers.map((server) => {
          if (server.server_id !== serverId) {
            return server;
          }
          const workflowIds = server.workflow_ids.includes(workflowId)
            ? server.workflow_ids.filter((id) => id !== workflowId)
            : [...server.workflow_ids, workflowId];
          return { ...server, workflow_ids: workflowIds };
        }),
      },
    }));
  }

  function toggleTransferServerExpanded(serverId: string) {
    setTransferState((current) => ({
      ...current,
      expandedServerIds: current.expandedServerIds.includes(serverId)
        ? current.expandedServerIds.filter((id) => id !== serverId)
        : [...current.expandedServerIds, serverId],
    }));
  }

  async function handleConfirmTransfer() {
    if (transferState.mode === "export") {
      const sessionId = transferSession.current();
      setTransferState((current) => ({ ...current, loading: true }));
      try {
        const response = await buildTransferExport(transferState.exportSelection);
        if (!transferSession.isCurrent(sessionId)) {
          return;
        }
        const payload = `${JSON.stringify(response.bundle, null, 2)}\n`;
        const blob = new Blob([payload], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "openclaw-skill-export.json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        pushToast("success", t("ok_transfer_export_started"));
        closeTransferModal();
      } catch (error) {
        if (!transferSession.isCurrent(sessionId)) {
          return;
        }
        setTransferState((current) => ({ ...current, loading: false }));
        pushToast("error", getTransferErrorMessage(error, "err_transfer_export"));
      }
      return;
    }

    if (!transferState.importBundle) {
      return;
    }

    const sessionId = transferSession.current();
    setTransferState((current) => ({ ...current, loading: true }));
    try {
      const report = await importTransferBundle(transferState.importBundle, transferState.applyEnvironment, true);
      if (!transferSession.isCurrent(sessionId)) {
        return;
      }
      await Promise.all([serverManagement.loadInitialServers(), refreshWorkflows()]);
      if (!transferSession.isCurrent(sessionId)) {
        return;
      }
      pushToast("success", t("ok_transfer_import", {
        servers: report.plan.summary.created_servers,
        created: report.plan.summary.created_workflows,
        overwritten: report.plan.summary.overwritten_workflows,
      }));
      closeTransferModal();
    } catch (error) {
      if (!transferSession.isCurrent(sessionId)) {
        return;
      }
      setTransferState((current) => ({ ...current, loading: false }));
      pushToast("error", getTransferErrorMessage(error, "err_transfer_import"));
    }
  }

  async function handleTransferImportFile(file: File | null) {
    if (!file) {
      return;
    }

    const requestId = importPreviewRequest.begin();

    try {
      const text = await file.text();
      if (!importPreviewRequest.isCurrent(requestId)) {
        return;
      }
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        throw new Error(t("err_transfer_invalid_bundle"));
      }

      const preview = await previewTransferImport(parsed, false, true);
      if (!importPreviewRequest.isCurrent(requestId)) {
        return;
      }
      transferSession.begin();
      setTransferState({
        open: true,
        mode: "import",
        exportPreview: null,
        exportSelection: { servers: [] },
        expandedServerIds: [],
        importPreview: preview,
        importBundle: parsed,
        applyEnvironment: false,
        loading: false,
      });
    } catch (error) {
      if (!importPreviewRequest.isCurrent(requestId)) {
        return;
      }
      if (error instanceof SyntaxError || (error instanceof Error && error.message === t("err_transfer_invalid_bundle"))) {
        pushToast("error", t("err_transfer_invalid_bundle"));
        return;
      }
      pushToast("error", getTransferErrorMessage(error, "err_transfer_preview"));
    }
  }

  const importSections: Array<{ title: string; items: TransferPlanItemDto[] }> = [
    {
      title: t("transfer_section_created_servers"),
      items: transferState.importPreview?.plan?.created_servers || [],
    },
    {
      title: t("transfer_section_updated_servers"),
      items: transferState.importPreview?.plan?.updated_servers || [],
    },
    {
      title: t("transfer_section_created_workflows"),
      items: transferState.importPreview?.plan?.created_workflows || [],
    },
    {
      title: t("transfer_section_overwritten_workflows"),
      items: transferState.importPreview?.plan?.overwritten_workflows || [],
    },
    {
      title: t("transfer_section_skipped_items"),
      items: transferState.importPreview?.plan?.skipped_items || [],
    },
  ];

  const importPreviewSummary = t("transfer_preview_summary", {
    servers: transferState.importPreview?.plan?.summary.created_servers || 0,
    updated_servers: transferState.importPreview?.plan?.summary.updated_servers || 0,
    created: transferState.importPreview?.plan?.summary.created_workflows || 0,
    overwritten: transferState.importPreview?.plan?.summary.overwritten_workflows || 0,
    skipped: transferState.importPreview?.plan?.summary.skipped_items || 0,
    warnings: transferState.importPreview?.plan?.summary.warnings || 0,
  });

  const editorActions = createEditorActions({
    editorState,
    setEditorState,
    expandedParamKeys,
    setExpandedParamKeys,
    groupedNodes: derived.groupedNodes,
    lastAutoWorkflowId,
    setLastAutoWorkflowId,
    currentServer: derived.currentServer,
    effectiveServerId: derived.effectiveServerId,
    confirm,
    refreshWorkflows,
    pushToast,
    resetEditor,
    resetEditorUiState,
    t,
    pendingVersionTargetRef,
  });

  const workflowActions = createWorkflowActions({
    workflows,
    setWorkflows,
    effectiveServerId: derived.effectiveServerId,
    refreshWorkflows,
    pushToast,
    t,
    confirm,
    openEditor,
    ensureCanLeaveEditor: editorActions.ensureCanLeaveEditor,
    pendingVersionTargetRef,
    versionUploadRef,
  });

  function dismissUpdate() {
    clearStoredUpdateFeedback();
    sessionStorage.setItem("update-banner-dismissed", "1");
    setUpdateInfo(null);
    setUpdateFeedback(null);
  }

  function markWorkflowHasHistory(workflow: WorkflowSummaryDto) {
    setWorkflows((current) => {
      let changed = false;
      const next = current.map((item) => {
        const updated = ensureWorkflowHasHistory(item, workflow) ?? item;
        changed = changed || updated !== item;
        return updated;
      });
      return changed ? next : current;
    });
    setRunModalState((current) => updateStateWorkflowHasHistory(current, workflow));
    setHistoryState((current) => updateStateWorkflowHasHistory(current, workflow));
  }

  async function handleOpenRunWorkflow(workflow: WorkflowSummaryDto) {
    const requestId = runModalRequest.begin();
    setRunModalState((current) => ({
      ...current,
      open: true,
      workflow,
      loading: true,
      result: null,
    }));
    try {
      const detail = await getWorkflowDetail(workflow.server_id, workflow.id);
      if (!runModalRequest.isCurrent(requestId)) {
        return;
      }
      const schema = normalizeRunSchema(detail);
      setRunModalState({
        open: true,
        workflow,
        schema,
        values: buildRunWorkflowDefaults(schema),
        loading: false,
        submitting: false,
        result: null,
      });
    } catch (error) {
      if (!runModalRequest.isCurrent(requestId)) {
        return;
      }
      setRunModalState(initialRunWorkflowState());
      pushToast("error", error instanceof Error ? error.message : t("err_load_saved_wf"));
    }
  }

  function closeRunWorkflowModal() {
    runModalRequest.invalidate();
    setRunModalState(initialRunWorkflowState());
  }

  function updateRunWorkflowValue(key: string, value: unknown) {
    setRunModalState((current) => ({
      ...current,
      values: {
        ...current.values,
        [key]: value,
      },
    }));
  }

  async function handleUploadImage(serverId: string, file: File): Promise<string> {
    const result = await uploadImageToComfyUI(serverId, file);
    return result.name;
  }

  async function handleRunWorkflow() {
    const workflow = runModalState.workflow;
    if (!workflow) {
      return;
    }

    const payload: Record<string, unknown> = {};
    Object.entries(runModalState.values).forEach(([key, value]) => {
      const param = runModalState.schema[key];
      if ((param?.type === "int" || param?.type === "float") && value === "") {
        return;
      }
      if (param?.type === "int") {
        payload[key] = parseInt(String(value), 10);
      } else if (param?.type === "float") {
        payload[key] = parseFloat(String(value));
      } else if (param?.type === "boolean") {
        payload[key] = value === true || value === "true";
      } else {
        payload[key] = value;
      }
    });

    const workflowKey = `${workflow.server_id}:${workflow.id}`;
    setExecutingWorkflows((current) => ({ ...current, [workflowKey]: { status: "running", startedAt: Date.now() } }));
    closeRunWorkflowModal();

    try {
      const response = await runWorkflow(workflow.server_id, workflow.id, payload);
      if (response.result.status === "success") {
        markWorkflowHasHistory(workflow);
        setExecutingWorkflows((current) => ({ ...current, [workflowKey]: { ...current[workflowKey], status: "success" } }));
        pushToast("success", t("run_workflow_success", { id: workflow.id }));
      } else {
        const errMsg = typeof response.result.error === "string"
          ? response.result.error
          : (response.result.error as Record<string, unknown>)?.message as string | undefined;
        setExecutingWorkflows((current) => ({ ...current, [workflowKey]: { ...current[workflowKey], status: "error" } }));
        pushToast("error", errMsg || t("run_workflow_error"));
      }
    } catch (error) {
      setExecutingWorkflows((current) => ({ ...current, [workflowKey]: { ...current[workflowKey], status: "error" } }));
      pushToast("error", error instanceof Error ? error.message : t("run_workflow_error"));
    }

    // Auto-clear status after 8 seconds
    setTimeout(() => {
      setExecutingWorkflows((current) => {
        const next = { ...current };
        delete next[workflowKey];
        return next;
      });
    }, 8000);
  }

  async function loadWorkflowHistory(workflow: WorkflowSummaryDto, selectedRunId?: string | null) {
    const listRequestId = historyListRequest.begin();
    historyDetailRequest.invalidate();
    setHistoryState((current) => ({
      ...current,
      open: true,
      workflow,
      loading: true,
      detailLoading: false,
      detail: selectedRunId ? current.detail : null,
    }));
    try {
      const response = await listWorkflowHistory(workflow.server_id, workflow.id);
      if (!historyListRequest.isCurrent(listRequestId)) {
        return;
      }
      const nextSelectedRunId = selectedRunId ?? response.history[0]?.run_id ?? null;
      setHistoryState({
        open: true,
        workflow,
        items: response.history,
        selectedRunId: nextSelectedRunId,
        detail: null,
        loading: false,
        detailLoading: Boolean(nextSelectedRunId),
      });
      if (nextSelectedRunId) {
        const detailRequestId = historyDetailRequest.begin();
        const detail = await getWorkflowHistoryEntry(workflow.server_id, workflow.id, nextSelectedRunId);
        if (!historyListRequest.isCurrent(listRequestId) || !historyDetailRequest.isCurrent(detailRequestId)) {
          return;
        }
        setHistoryState((current) => ({
          ...current,
          detail,
          detailLoading: false,
        }));
      }
    } catch (error) {
      if (!historyListRequest.isCurrent(listRequestId)) {
        return;
      }
      setHistoryState(initialWorkflowHistoryState());
      pushToast("error", error instanceof Error ? error.message : t("workflow_history_load_error"));
    }
  }

  async function handleOpenWorkflowHistory(workflow: WorkflowSummaryDto) {
    await loadWorkflowHistory(workflow);
  }

  function closeWorkflowHistoryModal() {
    historyListRequest.invalidate();
    historyDetailRequest.invalidate();
    setHistoryState(initialWorkflowHistoryState());
  }

  async function refreshWorkflowHistory() {
    if (!historyState.workflow) {
      return;
    }
    await loadWorkflowHistory(historyState.workflow, historyState.selectedRunId);
  }

  async function handleSelectWorkflowHistoryEntry(runId: string) {
    if (!historyState.workflow) {
      return;
    }
    const detailRequestId = historyDetailRequest.begin();
    setHistoryState((current) => ({ ...current, selectedRunId: runId, detailLoading: true }));
    try {
      const detail = await getWorkflowHistoryEntry(historyState.workflow.server_id, historyState.workflow.id, runId);
      if (!historyDetailRequest.isCurrent(detailRequestId)) {
        return;
      }
      setHistoryState((current) => ({ ...current, detail, detailLoading: false }));
    } catch (error) {
      if (!historyDetailRequest.isCurrent(detailRequestId)) {
        return;
      }
      setHistoryState((current) => ({ ...current, detail: null, detailLoading: false }));
      pushToast("error", error instanceof Error ? error.message : t("workflow_history_load_error"));
    }
  }

  async function handleDeleteWorkflowHistoryEntry(runId: string) {
    if (!historyState.workflow) {
      return;
    }
    if (!(await confirm({
      title: t("confirm_action_title"),
      message: t("workflow_history_delete_confirm"),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      tone: "danger",
    }))) {
      return;
    }
    try {
      await deleteWorkflowHistoryEntry(historyState.workflow.server_id, historyState.workflow.id, runId);
      await loadWorkflowHistory(historyState.workflow);
      pushToast("success", t("workflow_history_delete_success"));
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : t("workflow_history_delete_error"));
    }
  }

  async function handleClearWorkflowHistory() {
    if (!historyState.workflow) {
      return;
    }
    if (!(await confirm({
      title: t("confirm_action_title"),
      message: t("workflow_history_clear_confirm", { id: historyState.workflow.id }),
      confirmLabel: t("workflow_history_clear"),
      cancelLabel: t("cancel"),
      tone: "danger",
    }))) {
      return;
    }
    try {
      await clearWorkflowHistory(historyState.workflow.server_id, historyState.workflow.id);
      await loadWorkflowHistory(historyState.workflow, null);
      pushToast("success", t("workflow_history_clear_success"));
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : t("workflow_history_clear_error"));
    }
  }

  useAppEffects({
    language,
    toasts,
    dismissToast,
    loadInitialServers: serverManagement.loadInitialServers,
    refreshWorkflows,
    pushToast,
    setUpdateInfo,
    setUpdateFeedback,
    t,
    isEditorRoute,
    hasUnsavedChanges: editorState.hasUnsavedChanges,
    confirmOpen: confirmState.open,
    serverModalOpen: serverManagement.serverModalOpen,
    transferModalOpen: transferState.open,
    editorQuery: editorFilters.query,
    clearEditorQuery: () => setEditorFilters((current) => ({ ...current, query: "" })),
    mappingSearchRef,
    saveWorkflow: editorActions.handleSaveWorkflow,
  });

  return {
    language,
    setLanguage: (value: string) => setLanguage(normalizeLanguage(value)),
    t,
    toasts,
    dismissToast,
    confirmState,
    setConfirmState,
    resolveConfirm,
    versionUploadRef,
    transferImportRef,
    localImportFilesRef: bulkWorkflowImport.localImportFilesRef,
    localImportFolderRef: bulkWorkflowImport.localImportFolderRef,
    mappingSearchRef,
    editorState,
    editorFilters,
    collapsedNodeIds,
    expandedParamKeys,
    workflowSearch,
    workflowSort,
    servers: serverManagement.servers,
    ...derived,
    serverModalOpen: serverManagement.serverModalOpen,
    serverModalMode: serverManagement.serverModalMode,
    serverForm: serverManagement.serverForm,
    setCurrentServerId: serverManagement.setCurrentServerId,
    setServerForm: serverManagement.setServerForm,
    setWorkflowSearch,
    setWorkflowSort,
    setEditorFilters,
    setCollapsedNodeIds,
    setExpandedParamKeys,
    setEditorState,
    setServerModalOpen: serverManagement.setServerModalOpen,
    transferState,
    bulkImportState: bulkWorkflowImport.bulkImportState,
    importSections,
    importPreviewSummary,
    handleAddServer: serverManagement.handleAddServer,
    handleEditServer: serverManagement.handleEditServer,
    handleSubmitServerModal,
    handleToggleServer: serverManagement.handleToggleServer,
    requestDeleteServer: serverManagement.requestDeleteServer,
    handleOpenTransferExport,
    handleOpenTransferImport,
    handleTransferImportFile,
    handleConfirmTransfer,
    closeTransferModal,
    closeBulkImportModal: bulkWorkflowImport.closeBulkImportModal,
    closeComfyUiImportPreview: bulkWorkflowImport.closeComfyUiImportPreview,
    handlePreviewImportFromComfyUI: bulkWorkflowImport.handlePreviewImportFromComfyUI,
    handleImportAllFromComfyUI: bulkWorkflowImport.handleImportAllFromComfyUI,
    handleOpenLocalImportFiles: bulkWorkflowImport.handleOpenLocalImportFiles,
    handleOpenLocalImportFolder: bulkWorkflowImport.handleOpenLocalImportFolder,
    handleLocalImportFilesChange: bulkWorkflowImport.handleLocalImportFilesChange,
    toggleTransferServerSelection,
    toggleTransferWorkflowSelection,
    toggleTransferServerExpanded,
    setTransferState,
    runModalState,
    executingWorkflows,
    historyState,
    handleOpenRunWorkflow,
    closeRunWorkflowModal,
    updateRunWorkflowValue,
    handleRunWorkflow,
    handleUploadImage,
    handleOpenWorkflowHistory,
    closeWorkflowHistoryModal,
    refreshWorkflowHistory,
    handleSelectWorkflowHistoryEntry,
    handleDeleteWorkflowHistoryEntry,
    handleClearWorkflowHistory,
    handleBackFromEditor: editorActions.handleBackFromEditor,
    handleEditorUpload: editorActions.handleEditorUpload,
    createWorkflowFromFile: editorActions.createWorkflowFromFile,
    handleSaveWorkflow: editorActions.handleSaveWorkflow,
    handleWorkflowIdChange: editorActions.handleWorkflowIdChange,
    updateEditorParam: editorActions.updateEditorParam,
    applyRecommendedExposures: editorActions.applyRecommendedExposures,
    exposeVisible: editorActions.exposeVisible,
    handleEditWorkflow: workflowActions.handleEditWorkflow,
    handleDeleteWorkflow: workflowActions.handleDeleteWorkflow,
    handleBatchDeleteWorkflows: workflowActions.handleBatchDeleteWorkflows,
    handleToggleWorkflow: workflowActions.handleToggleWorkflow,
    handleUploadWorkflowVersion: workflowActions.handleUploadWorkflowVersion,
    handleVersionFileChange: editorActions.handleVersionFileChange,
    handleReorderWorkflows: workflowActions.handleReorderWorkflows,
    createWorkflow: editorActions.createWorkflow,
    updateInfo,
    updateFeedback,
    dismissUpdate,
    loadEditorWorkflowByRoute: async (serverId: string, workflowId: string) => {
      serverManagement.setCurrentServerId(serverId);
      if (editorState.editingWorkflowId === workflowId && editorState.workflowData) {
        return true;
      }
      try {
        await openEditor(await getWorkflowDetail(serverId, workflowId));
        return true;
      } catch (error) {
        pushToast("error", error instanceof Error ? error.message : t("err_load_saved_wf"));
        return false;
      }
    },
  };
}

export type AppController = ReturnType<typeof useAppController>;
