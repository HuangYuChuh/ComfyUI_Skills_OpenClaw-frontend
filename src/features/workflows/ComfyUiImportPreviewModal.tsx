import { useRef } from "react";
import { Modal } from "../../components/ui/Modal";
import type { BulkImportPreviewItemDto, BulkImportPreviewReportDto } from "../../types/api";

interface ComfyUiImportPreviewModalProps {
  open: boolean;
  preview: BulkImportPreviewReportDto | null;
  currentServerLabel: string | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function renderPreviewItems(items: BulkImportPreviewItemDto[]) {
  return items.map((item, index) => (
    <li key={`${item.source_label}-${item.final_workflow_id || item.workflow_id || "item"}-${index}`} className="bulk-import-item">
      <div className="bulk-import-item-main">
        <div className="bulk-import-item-title-row">
          <span className="bulk-import-item-id">{item.final_workflow_id || item.workflow_id || "workflow"}</span>
          {item.workflow_id && item.final_workflow_id && item.workflow_id !== item.final_workflow_id ? (
            <span className="bulk-import-item-rename">{item.workflow_id} -&gt; {item.final_workflow_id}</span>
          ) : null}
        </div>
        {item.description ? <p className="bulk-import-item-description">{item.description}</p> : null}
        <p className="bulk-import-item-source">{item.source_label}</p>
        {item.reason ? <p className="bulk-import-item-reason">{item.reason}</p> : null}
      </div>
    </li>
  ));
}

export function ComfyUiImportPreviewModal(props: ComfyUiImportPreviewModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const importableItems = props.preview?.items.filter((item) => item.status === "ready" || item.status === "renamed") || [];
  const failedItems = props.preview?.items.filter((item) => item.status === "failed") || [];
  const hasImportableItems = importableItems.length > 0;

  return (
    <Modal
      open={props.open}
      title={props.t("editor_import_comfyui_preview_title")}
      onClose={props.onClose}
      width="wide"
      initialFocusRef={confirmButtonRef}
      actions={(
        <>
          <button type="button" className="btn btn-secondary" onClick={props.onClose}>
            {props.t("cancel")}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className="btn btn-primary"
            onClick={props.onConfirm}
            disabled={!hasImportableItems || props.loading}
          >
            {props.loading ? props.t("bulk_import_loading") : props.t("editor_import_comfyui_preview_confirm_action")}
          </button>
        </>
      )}
    >
      <p className="confirm-modal-message">
        {props.currentServerLabel
          ? props.t("editor_import_comfyui_preview_message_with_server", { server: props.currentServerLabel })
          : props.t("editor_import_comfyui_preview_message")}
      </p>

      <div className="bulk-import-summary">
        <span className="panel-meta">{props.t("editor_import_comfyui_preview_summary_total", { count: props.preview?.summary.total || 0 })}</span>
        <span className="panel-meta">{props.t("editor_import_comfyui_preview_summary_importable", { count: props.preview?.summary.importable || 0 })}</span>
        <span className="panel-meta">{props.t("editor_import_comfyui_preview_summary_renamed", { count: props.preview?.summary.renamed || 0 })}</span>
        <span className="panel-meta">{props.t("editor_import_comfyui_preview_summary_failed", { count: props.preview?.summary.failed || 0 })}</span>
      </div>

      {props.preview?.summary.total ? (
        <div className="bulk-import-sections">
          <section className="bulk-import-section" aria-labelledby="comfyui-preview-importable">
            <div className="section-header">
              <h4 id="comfyui-preview-importable" className="card-title">{props.t("editor_import_comfyui_preview_section_importable")}</h4>
              <span className="section-meta">{props.t("bulk_import_section_count", { count: importableItems.length })}</span>
            </div>
            {importableItems.length ? (
              <ul className="bulk-import-list">
                {renderPreviewItems(importableItems)}
              </ul>
            ) : (
              <div className="empty-state">{props.t("editor_import_comfyui_preview_empty")}</div>
            )}
          </section>

          {failedItems.length ? (
            <section className="bulk-import-section" aria-labelledby="comfyui-preview-failed">
              <div className="section-header">
                <h4 id="comfyui-preview-failed" className="card-title">{props.t("editor_import_comfyui_preview_section_failed")}</h4>
                <span className="section-meta">{props.t("bulk_import_section_count", { count: failedItems.length })}</span>
              </div>
              <ul className="bulk-import-list">
                {renderPreviewItems(failedItems)}
              </ul>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="empty-state">{props.t("editor_import_comfyui_preview_empty")}</div>
      )}
    </Modal>
  );
}
