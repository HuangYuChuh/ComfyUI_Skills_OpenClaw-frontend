import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { AppLayout } from "../components/layout/AppLayout";
import { EditorView } from "../features/editor/EditorView";
import type { AppController } from "../app/useAppController";

interface EditorPageProps {
  controller: AppController;
}

export function EditorPage({ controller }: EditorPageProps) {
  const navigate = useNavigate();
  const params = useParams<{ serverId?: string; workflowId?: string }>();
  const [routeLoading, setRouteLoading] = useState(false);
  const isEditRoute = Boolean(params.serverId && params.workflowId);
  const routeServerId = params.serverId ? decodeURIComponent(params.serverId) : null;
  const routeWorkflowId = params.workflowId ? decodeURIComponent(params.workflowId) : null;
  const hasWorkflowId = Boolean(controller.editorState.workflowId.trim());
  const editorStep = !controller.editorState.workflowData ? 1 : (!hasWorkflowId ? 2 : 3);

  useEffect(() => {
    if (!isEditRoute || !routeServerId || !routeWorkflowId) {
      setRouteLoading(false);
      return;
    }
    let cancelled = false;

    if (controller.editorState.editingWorkflowId === routeWorkflowId && controller.editorState.workflowData) {
      setRouteLoading(false);
      controller.setCurrentServerId(routeServerId);
      return;
    }

    setRouteLoading(true);
    void controller.loadEditorWorkflowByRoute(routeServerId, routeWorkflowId).then((loaded) => {
      if (cancelled) {
        return;
      }
      setRouteLoading(false);
      if (!loaded) {
        navigate("/", { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    controller.editorState.editingWorkflowId,
    controller.editorState.workflowData,
    isEditRoute,
    navigate,
    routeServerId,
    routeWorkflowId,
  ]);

  async function handleBack() {
    if (await controller.handleBackFromEditor()) {
      navigate("/");
    }
  }

  const headerTitle = controller.editorState.editingWorkflowId
    ? `${controller.t("editor_mode_editing")}: ${controller.editorState.editingWorkflowId || controller.editorState.workflowId}`
    : controller.t("editor_mode_create");

  const headerSubtitle = editorStep === 1
    ? controller.t("editor_step_1_hint")
    : editorStep === 2
      ? controller.t("editor_step_2_hint")
      : controller.t("editor_step_3_hint");

  return (
    <AppLayout
      header={(
        <AppHeader
          leading={(
            <button type="button" className="btn btn-secondary editor-back-btn" onClick={handleBack}>
              <span aria-hidden="true">&larr;</span> <span>{controller.t("back")}</span>
            </button>
          )}
          title={headerTitle}
          subtitle={headerSubtitle}
        />
      )}
    >
      {routeLoading ? (
        <section className="card" aria-live="polite">
          <p className="section-meta">{controller.t("loading")}</p>
        </section>
      ) : (
        <EditorView
          workflowId={controller.editorState.workflowId}
          description={controller.editorState.description}
          schemaParams={controller.editorState.schemaParams}
          hasWorkflow={Boolean(controller.editorState.workflowData)}
          currentServerLabel={controller.currentServer?.name?.trim() || controller.currentServer?.id || null}
          bulkImportBusy={controller.bulkImportState.loading}
          emptyStateMessageKey={controller.editorEmptyStateMessageKey}
          mode={controller.editorState.editingWorkflowId ? "edit" : "create"}
          editingWorkflowId={controller.editorState.editingWorkflowId}
          upgradeSummary={controller.editorState.upgradeSummary}
          filters={controller.editorFilters}
          collapsedNodeIds={controller.collapsedNodeIds}
          expandedParamKeys={controller.expandedParamKeys}
          groupedNodes={controller.groupedNodes}
          summaryText={controller.mappingSummaryText}
          searchInputRef={controller.mappingSearchRef}
          onBack={handleBack}
          onWorkflowIdChange={controller.handleWorkflowIdChange}
          onDescriptionChange={(value) => controller.setEditorState((current) => ({ ...current, description: value, hasUnsavedChanges: true }))}
          onUploadFile={controller.handleEditorUpload}
          onOpenFolderImport={controller.handleOpenLocalImportFolder}
          onImportAllFromComfyUI={() => void controller.handleImportAllFromComfyUI()}
          onSave={controller.handleSaveWorkflow}
          onFilterChange={(next) => controller.setEditorFilters((current) => ({ ...current, ...next }))}
          onResetFilters={() => controller.setEditorFilters({
            query: "",
            exposedOnly: false,
            requiredOnly: false,
            nodeSort: "node_id_asc",
            paramSort: "default",
          })}
          onToggleNode={(nodeId) => controller.setCollapsedNodeIds((current) => {
            const next = new Set(current);
            if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId);
            return next;
          })}
          onToggleParamConfig={(key) => controller.setExpandedParamKeys((current) => {
            const next = new Set(current);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
          })}
          onUpdateParam={controller.updateEditorParam}
          onApplyRecommended={controller.applyRecommendedExposures}
          onExposeVisible={controller.exposeVisible}
          onCollapseAll={(collapsed) => {
            if (collapsed) {
              controller.setCollapsedNodeIds(new Set(controller.groupedNodes.map(([nodeId]) => nodeId)));
            } else {
              controller.setCollapsedNodeIds(new Set());
            }
          }}
          t={controller.t}
        />
      )}
    </AppLayout>
  );
}
