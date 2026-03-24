import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { AppLayout } from "../components/layout/AppLayout";
import { LanguageSelect } from "../components/layout/LanguageSelect";
import { MainShell } from "../app/MainShell";
import type { AppController } from "../app/useAppController";
import type { WorkflowSummaryDto } from "../types/api";

interface DashboardPageProps {
  controller: AppController;
}

function buildEditorPath(workflow: WorkflowSummaryDto) {
  return `/editor/${encodeURIComponent(workflow.server_id)}/${encodeURIComponent(workflow.id)}`;
}

export function DashboardPage({ controller }: DashboardPageProps) {
  const navigate = useNavigate();

  async function handleCreateWorkflow() {
    if (controller.createWorkflow()) {
      navigate("/editor/new");
    }
  }

  async function handleCreateWorkflowFromFile(file: File | null) {
    if (await controller.createWorkflowFromFile(file)) {
      navigate("/editor/new");
    }
  }

  async function handleEditWorkflow(workflow: WorkflowSummaryDto) {
    controller.setCurrentServerId(workflow.server_id);
    if (await controller.handleEditWorkflow(workflow)) {
      navigate(buildEditorPath(workflow));
    }
  }

  return (
    <AppLayout
      header={(
        <AppHeader
          className="dashboard-header"
          leading={(
            <div className="logo-frame" aria-hidden="true">
              <img className="logo-image" src={`${import.meta.env.BASE_URL}logo.png`} alt="ComfyUI OpenClaw logo" />
            </div>
          )}
          title={controller.t("title")}
          subtitle={controller.t("subtitle")}
          actions={(
            <>
              <button type="button" className="btn btn-secondary panel-action-btn" onClick={controller.handleOpenTransferExport}>
                {controller.t("export_bundle")}
              </button>
              <button type="button" className="btn btn-secondary panel-action-btn" onClick={controller.handleOpenTransferImport}>
                {controller.t("import_bundle")}
              </button>
            </>
          )}
          trailing={<LanguageSelect value={controller.language} onChange={controller.setLanguage} />}
        />
      )}
    >
      <MainShell
        servers={controller.servers}
        currentServer={controller.currentServer}
        visibleWorkflows={controller.visibleWorkflows}
        currentServerWorkflowsCount={controller.currentServerWorkflows.length}
        serverModalOpen={controller.serverModalOpen}
        serverModalMode={controller.serverModalMode}
        serverForm={controller.serverForm}
        workflowSearch={controller.workflowSearch}
        workflowSort={controller.workflowSort}
        onSelectServer={controller.setCurrentServerId}
        onToggleServer={controller.handleToggleServer}
        onDeleteServer={controller.requestDeleteServer}
        onOpenCreateServer={controller.handleAddServer}
        onOpenEditServer={controller.handleEditServer}
        onServerFormChange={controller.setServerForm}
        onCloseServerModal={() => controller.setServerModalOpen(false)}
        onSubmitServerModal={controller.handleSubmitServerModal}
        onWorkflowSearchChange={controller.setWorkflowSearch}
        onWorkflowSortChange={controller.setWorkflowSort}
        onCreateWorkflow={handleCreateWorkflow}
        onCreateWorkflowFromFile={handleCreateWorkflowFromFile}
        onEditWorkflow={handleEditWorkflow}
        onRunWorkflow={controller.handleOpenRunWorkflow}
        onBatchDeleteWorkflows={controller.handleBatchDeleteWorkflows}
        onDeleteWorkflow={controller.handleDeleteWorkflow}
        onToggleWorkflow={controller.handleToggleWorkflow}
        onUploadWorkflowVersion={controller.handleUploadWorkflowVersion}
        onReorderWorkflows={controller.handleReorderWorkflows}
        executingWorkflows={controller.executingWorkflows}
        onViewHistory={controller.handleOpenWorkflowHistory}
        t={controller.t}
      />
    </AppLayout>
  );
}
