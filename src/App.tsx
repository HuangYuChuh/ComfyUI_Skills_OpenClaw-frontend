import { HashRouter, useInRouterContext, useLocation } from "react-router-dom";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { ToastViewport } from "./components/ui/ToastViewport";
import { UpdateBanner } from "./components/ui/UpdateBanner";
import { TransferModal } from "./features/transfer/TransferModal";
import { BulkImportReportModal } from "./features/workflows/BulkImportReportModal";
import { RunWorkflowModal } from "./features/workflows/RunWorkflowModal";
import { WorkflowHistoryModal } from "./features/workflows/WorkflowHistoryModal";
import { useAppController } from "./app/useAppController";
import { AppRoutes } from "./routes/AppRoutes";

function AppContent() {
  const location = useLocation();
  const controller = useAppController({ isEditorRoute: location.pathname.startsWith("/editor") });

  return (
    <>
      {controller.updateInfo?.has_update && (
        <UpdateBanner
          localCommit={controller.updateInfo.local_commit || ""}
          remoteCommit={controller.updateInfo.remote_commit || ""}
          onDismiss={controller.dismissUpdate}
          t={controller.t}
        />
      )}
      <ToastViewport toasts={controller.toasts} onDismiss={controller.dismissToast} />
      <AppRoutes controller={controller} />

      <ConfirmDialog
        open={controller.confirmState.open}
        title={controller.confirmState.title}
        message={controller.confirmState.message}
        confirmLabel={controller.confirmState.confirmLabel}
        cancelLabel={controller.confirmState.cancelLabel}
        tone={controller.confirmState.tone}
        checkboxLabel={controller.confirmState.checkboxLabel}
        checkboxChecked={controller.confirmState.checkboxChecked}
        onCheckboxChange={(checked) => controller.setConfirmState((current) => ({ ...current, checkboxChecked: checked }))}
        onCancel={() => controller.resolveConfirm(false)}
        onConfirm={() => controller.resolveConfirm(true)}
      />

      <TransferModal
        open={controller.transferState.open}
        mode={controller.transferState.mode}
        exportPreview={controller.transferState.exportPreview}
        exportSelection={controller.transferState.exportSelection}
        expandedServerIds={controller.transferState.expandedServerIds}
        importPreviewSummary={controller.importPreviewSummary}
        importSections={controller.importSections}
        importWarnings={(controller.transferState.importPreview?.plan?.warnings || []).map((warning) => warning.message)}
        applyEnvironment={controller.transferState.applyEnvironment}
        loading={controller.transferState.loading}
        onClose={controller.closeTransferModal}
        onConfirm={controller.handleConfirmTransfer}
        onToggleServerSelection={(server) => controller.toggleTransferServerSelection(
          server.server_id,
          server.workflows.map((workflow) => workflow.workflow_id),
        )}
        onToggleWorkflowSelection={controller.toggleTransferWorkflowSelection}
        onToggleServerExpanded={controller.toggleTransferServerExpanded}
        onApplyEnvironmentChange={(checked) => controller.setTransferState((current) => ({ ...current, applyEnvironment: checked }))}
        t={controller.t}
      />

      <BulkImportReportModal
        open={controller.bulkImportState.open}
        report={controller.bulkImportState.report}
        source={controller.bulkImportState.source}
        onClose={controller.closeBulkImportModal}
        t={controller.t}
      />

      <RunWorkflowModal
        open={controller.runModalState.open}
        workflowId={controller.runModalState.workflow?.id || ""}
        schema={controller.runModalState.schema}
        values={controller.runModalState.values}
        loading={controller.runModalState.loading}
        submitting={controller.runModalState.submitting}
        result={controller.runModalState.result}
        onClose={controller.closeRunWorkflowModal}
        onChange={controller.updateRunWorkflowValue}
        onSubmit={controller.handleRunWorkflow}
        t={controller.t}
      />

      <WorkflowHistoryModal
        open={controller.historyState.open}
        workflowId={controller.historyState.workflow?.id || ""}
        loading={controller.historyState.loading}
        detailLoading={controller.historyState.detailLoading}
        history={controller.historyState.items}
        selectedRunId={controller.historyState.selectedRunId}
        detail={controller.historyState.detail}
        onClose={controller.closeWorkflowHistoryModal}
        onRefresh={controller.refreshWorkflowHistory}
        onSelectRun={controller.handleSelectWorkflowHistoryEntry}
        onDeleteRun={controller.handleDeleteWorkflowHistoryEntry}
        onClear={controller.handleClearWorkflowHistory}
        t={controller.t}
      />

      <input
        ref={controller.versionUploadRef}
        type="file"
        accept=".json"
        className="sr-only"
        onChange={(event) => {
          controller.handleVersionFileChange(event.target.files?.[0] || null);
          event.currentTarget.value = "";
        }}
      />
      <input
        id="transfer-import-file"
        ref={controller.transferImportRef}
        type="file"
        accept=".json"
        className="sr-only"
        onChange={(event) => {
          controller.handleTransferImportFile(event.target.files?.[0] || null);
          event.currentTarget.value = "";
        }}
      />
      <input
        id="bulk-import-files"
        ref={controller.localImportFilesRef}
        type="file"
        accept=".json,application/json"
        multiple
        className="sr-only"
        onChange={(event) => {
          controller.handleLocalImportFilesChange(event.target.files);
          event.currentTarget.value = "";
        }}
      />
      <input
        id="bulk-import-folder"
        ref={controller.localImportFolderRef}
        type="file"
        accept=".json,application/json"
        multiple
        className="sr-only"
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        onChange={(event) => {
          controller.handleLocalImportFilesChange(event.target.files);
          event.currentTarget.value = "";
        }}
      />
    </>
  );
}

export default function App() {
  if (useInRouterContext()) {
    return <AppContent />;
  }

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </HashRouter>
  );
}
