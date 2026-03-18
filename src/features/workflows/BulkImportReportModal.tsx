import { Modal } from "../../components/ui/Modal";
import type { BulkImportItemDto, BulkImportReportDto } from "../../types/api";

interface BulkImportReportModalProps {
  open: boolean;
  report: BulkImportReportDto | null;
  source: "comfyui" | "local" | null;
  onClose: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function renderSectionItems(items: BulkImportItemDto[]) {
  return items.map((item, index) => (
    <li key={`${item.source_label}-${item.final_workflow_id || item.workflow_id || "item"}-${index}`} className="bulk-import-item">
      <div className="bulk-import-item-main">
        <div className="bulk-import-item-title-row">
          <span className="bulk-import-item-id">{item.final_workflow_id || item.workflow_id || "workflow"}</span>
          {item.workflow_id && item.final_workflow_id && item.workflow_id !== item.final_workflow_id ? (
            <span className="bulk-import-item-rename">{item.workflow_id} -&gt; {item.final_workflow_id}</span>
          ) : null}
        </div>
        <p className="bulk-import-item-source">{item.source_label}</p>
        {item.reason ? <p className="bulk-import-item-reason">{item.reason}</p> : null}
      </div>
    </li>
  ));
}

export function BulkImportReportModal(props: BulkImportReportModalProps) {
  const report = props.report;
  const sections: Array<{ title: string; items: BulkImportItemDto[] }> = [
    {
      title: props.t("bulk_import_section_created"),
      items: report?.items.filter((item) => item.status === "created") || [],
    },
    {
      title: props.t("bulk_import_section_renamed"),
      items: report?.items.filter((item) => item.status === "renamed") || [],
    },
    {
      title: props.t("bulk_import_section_skipped"),
      items: report?.items.filter((item) => item.status === "skipped") || [],
    },
    {
      title: props.t("bulk_import_section_failed"),
      items: report?.items.filter((item) => item.status === "failed") || [],
    },
  ];

  return (
    <Modal
      open={props.open}
      title={props.t(props.source === "comfyui" ? "bulk_import_report_title_comfyui" : "bulk_import_report_title_local")}
      onClose={props.onClose}
      width="wide"
      actions={(
        <button type="button" className="btn btn-primary" onClick={props.onClose}>
          {props.t("confirm")}
        </button>
      )}
    >
      <div className="bulk-import-summary">
        <span className="panel-meta">{props.t("bulk_import_summary_created", { count: report?.summary.created || 0 })}</span>
        <span className="panel-meta">{props.t("bulk_import_summary_renamed", { count: report?.summary.renamed || 0 })}</span>
        <span className="panel-meta">{props.t("bulk_import_summary_skipped", { count: report?.summary.skipped || 0 })}</span>
        <span className="panel-meta">{props.t("bulk_import_summary_failed", { count: report?.summary.failed || 0 })}</span>
      </div>

      <div className="bulk-import-sections">
        {sections.map((section) => (
          <section key={section.title} className="bulk-import-section" aria-labelledby={`bulk-import-${section.title}`}>
            <div className="section-header">
              <h4 id={`bulk-import-${section.title}`} className="card-title">{section.title}</h4>
              <span className="section-meta">{props.t("bulk_import_section_count", { count: section.items.length })}</span>
            </div>
            {section.items.length ? (
              <ul className="bulk-import-list">
                {renderSectionItems(section.items)}
              </ul>
            ) : (
              <div className="empty-state">{props.t("bulk_import_section_empty")}</div>
            )}
          </section>
        ))}
      </div>
    </Modal>
  );
}
