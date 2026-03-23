import { ServerManager } from "../features/servers/ServerManager";
import { WorkflowManager } from "../features/workflows/WorkflowManager";
import type { SaveServerPayload, ServerDto, WorkflowSummaryDto } from "../types/api";
import type { ServerModalMode, TranslateFn } from "./state";

interface MainShellProps {
  servers: ServerDto[];
  currentServer: ServerDto | null;
  visibleWorkflows: WorkflowSummaryDto[];
  currentServerWorkflowsCount: number;
  serverModalOpen: boolean;
  serverModalMode: ServerModalMode;
  serverForm: SaveServerPayload;
  workflowSearch: string;
  workflowSort: string;
  onSelectServer: (serverId: string) => void;
  onToggleServer: (server: ServerDto, enabled: boolean) => void;
  onDeleteServer: (server: ServerDto) => void;
  onOpenCreateServer: () => void;
  onOpenEditServer: (server: ServerDto) => void;
  onServerFormChange: (next: SaveServerPayload) => void;
  onCloseServerModal: () => void;
  onSubmitServerModal: (importAfterCreate?: boolean) => void | Promise<void>;
  onWorkflowSearchChange: (value: string) => void;
  onWorkflowSortChange: (value: string) => void;
  onCreateWorkflow: () => void;
  onCreateWorkflowFromFile: (file: File | null) => void;
  onEditWorkflow: (workflow: WorkflowSummaryDto) => void;
  onRunWorkflow: (workflow: WorkflowSummaryDto) => void;
  onBatchDeleteWorkflows: (workflows: WorkflowSummaryDto[]) => void;
  onDeleteWorkflow: (workflow: WorkflowSummaryDto) => void;
  onToggleWorkflow: (workflow: WorkflowSummaryDto, enabled: boolean) => void;
  onUploadWorkflowVersion: (workflow: WorkflowSummaryDto) => void;
  onReorderWorkflows: (sourceWorkflowId: string, targetWorkflowId: string, placeAfter: boolean) => void;
  t: TranslateFn;
}

export function MainShell(props: MainShellProps) {
  return (
    <>
      <ServerManager
        servers={props.servers}
        currentServerId={props.currentServer?.id || null}
        onSelectServer={props.onSelectServer}
        onToggleServer={props.onToggleServer}
        onDeleteServer={props.onDeleteServer}
        onOpenCreate={props.onOpenCreateServer}
        onOpenEdit={props.onOpenEditServer}
        modalOpen={props.serverModalOpen}
        modalMode={props.serverModalMode}
        form={props.serverForm}
        onFormChange={props.onServerFormChange}
        onCloseModal={props.onCloseServerModal}
        onSubmitModal={props.onSubmitServerModal}
        t={props.t}
      />

      <WorkflowManager
        workflows={props.visibleWorkflows}
        allWorkflowsForCurrentServer={props.currentServerWorkflowsCount}
        search={props.workflowSearch}
        sort={props.workflowSort}
        onSearchChange={props.onWorkflowSearchChange}
        onSortChange={props.onWorkflowSortChange}
        onCreateWorkflow={props.onCreateWorkflow}
        onCreateWorkflowFromFile={props.onCreateWorkflowFromFile}
        onEditWorkflow={props.onEditWorkflow}
        onRunWorkflow={props.onRunWorkflow}
        onBatchDeleteWorkflows={props.onBatchDeleteWorkflows}
        onDeleteWorkflow={props.onDeleteWorkflow}
        onToggleWorkflow={props.onToggleWorkflow}
        onUploadWorkflowVersion={props.onUploadWorkflowVersion}
        onReorderWorkflows={props.onReorderWorkflows}
        t={props.t}
      />
    </>
  );
}
