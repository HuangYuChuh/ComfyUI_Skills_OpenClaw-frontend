import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import type { ExecutionHistoryDetailDto, ExecutionHistorySummaryDto } from "../../types/api";
import { WorkflowHistoryArgumentPanel } from "./components/WorkflowHistoryArgumentPanel";
import {
  formatDuration,
  formatTimestamp,
  getImageUrls,
  getStatusClassName,
  shortenId,
} from "./utils/history";

interface WorkflowHistoryModalProps {
  open: boolean;
  workflowId: string;
  loading: boolean;
  detailLoading: boolean;
  history: ExecutionHistorySummaryDto[];
  selectedRunId: string | null;
  detail: ExecutionHistoryDetailDto | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onClose: () => void;
  onRefresh: () => void;
  onSelectRun: (runId: string) => void;
  onDeleteRun: (runId: string) => void;
  onClear: () => void;
}

export function WorkflowHistoryModal(props: WorkflowHistoryModalProps) {
  const refreshRef = useRef<HTMLButtonElement | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const selectedEntry = useMemo(
    () => props.history.find((item) => item.run_id === props.selectedRunId) || null,
    [props.history, props.selectedRunId],
  );
  const imageUrls = useMemo(() => getImageUrls(props.detail), [props.detail]);
  const activeImageUrl = imageUrls[activeImageIndex] ?? null;
  const activeImagePath = props.detail?.result?.images?.[activeImageIndex] ?? null;

  useEffect(() => {
    setActiveImageIndex(0);
  }, [props.selectedRunId]);

  useEffect(() => {
    if (activeImageIndex >= imageUrls.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, imageUrls.length]);

  return (
    <Modal
      open={props.open}
      title={props.t("workflow_history_title", { id: props.workflowId })}
      onClose={props.onClose}
      width="xwide"
      initialFocusRef={refreshRef}
      actions={(
        <>
          <button type="button" className="btn btn-secondary" onClick={props.onClose}>
            {props.t("close")}
          </button>
          <button ref={refreshRef} type="button" className="btn btn-secondary" onClick={props.onRefresh}>
            {props.t("refresh")}
          </button>
          <button
            type="button"
            className="btn btn-danger-soft"
            disabled={props.loading || props.history.length === 0}
            onClick={props.onClear}
          >
            {props.t("workflow_history_clear")}
          </button>
        </>
      )}
    >
      <div className="workflow-history-layout">
        <section className="workflow-history-list" aria-label={props.t("workflow_history_title", { id: props.workflowId })}>
          {props.loading ? (
            <div className="empty-state">{props.t("loading")}</div>
          ) : props.history.length === 0 ? (
            <div className="empty-state">{props.t("workflow_history_empty")}</div>
          ) : (
            props.history.map((entry, index) => (
              <button
                key={entry.run_id}
                type="button"
                className={`workflow-history-item${entry.run_id === props.selectedRunId ? " is-active" : ""}`}
                onClick={() => props.onSelectRun(entry.run_id)}
              >
                <div className="workflow-history-item-top">
                  <strong className="workflow-history-item-title">
                    {props.t("workflow_history_run_label", { index: index + 1 })}
                  </strong>
                  <span className={`status-badge ${getStatusClassName(entry.status)}`}>
                    {entry.status}
                  </span>
                </div>
                <p className="workflow-history-item-meta">{formatTimestamp(entry.created_at)}</p>
                <div className="workflow-history-item-tags">
                  <span className="workflow-meta-tag">{props.t("workflow_history_image_count", { count: entry.image_count })}</span>
                  <span className="workflow-meta-tag">{formatDuration(entry.duration_ms)}</span>
                  {entry.prompt_id ? <span className="workflow-meta-tag">#{shortenId(entry.prompt_id)}</span> : null}
                </div>
                <code className="workflow-history-item-code">{entry.run_id}</code>
                {entry.error_message ? <p className="workflow-history-item-error">{entry.error_message}</p> : null}
              </button>
            ))
          )}
        </section>

        <section className="workflow-history-detail">
          {props.detailLoading ? (
            <div className="empty-state">{props.t("loading")}</div>
          ) : !props.detail && !selectedEntry ? (
            <div className="empty-state">{props.t("workflow_history_select")}</div>
          ) : props.detail ? (
            <div className="workflow-history-detail-stack">
              <div className="workflow-history-summary-strip">
                <div className="workflow-history-stat">
                  <span>{props.t("workflow_history_status")}</span>
                  <strong>{props.detail.status}</strong>
                </div>
                <div className="workflow-history-stat">
                  <span>{props.t("workflow_history_generated_images")}</span>
                  <strong>{props.detail.result?.image_count ?? imageUrls.length}</strong>
                </div>
                <div className="workflow-history-stat">
                  <span>{props.t("workflow_history_duration_label")}</span>
                  <strong>{formatDuration(props.detail.duration_ms)}</strong>
                </div>
                <div className="workflow-history-stat">
                  <span>{props.t("workflow_history_prompt_id")}</span>
                  <strong>{shortenId(props.detail.prompt_id)}</strong>
                </div>
              </div>

              <div className="workflow-history-preview-panel">
                <div className="workflow-history-panel-header">
                  <div>
                    <p className="workflow-history-panel-eyebrow">{props.t("workflow_history_preview")}</p>
                    <h4>{props.t("workflow_history_images")}</h4>
                  </div>
                  {activeImageUrl ? (
                    <a className="btn btn-secondary workflow-history-open-image" href={activeImageUrl} target="_blank" rel="noreferrer">
                      {props.t("workflow_history_open_image")}
                    </a>
                  ) : null}
                </div>

                {activeImageUrl ? (
                  <a className="workflow-history-preview-frame is-large" href={activeImageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={activeImageUrl}
                      alt={props.t("workflow_history_image_alt", { index: activeImageIndex + 1 })}
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <div className="workflow-history-preview-frame is-empty is-large">
                    <p>{props.t("workflow_history_preview_empty")}</p>
                    {props.detail.error?.message ? <p className="workflow-history-item-error">{props.detail.error.message}</p> : null}
                  </div>
                )}

                {imageUrls.length > 0 ? (
                  <div className="workflow-history-gallery is-filmstrip">
                    {imageUrls.map((imageUrl, index) => (
                      <button
                        key={imageUrl}
                        type="button"
                        className={`workflow-history-thumb${index === activeImageIndex ? " is-active" : ""}`}
                        onClick={() => setActiveImageIndex(index)}
                      >
                        <img
                          src={imageUrl}
                          alt={props.t("workflow_history_image_alt", { index: index + 1 })}
                          loading="lazy"
                        />
                        <span>{index + 1}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="workflow-history-code-grid">
                <details className="workflow-history-code-block">
                  <summary>{props.t("workflow_history_run_summary")}</summary>
                  <div className="workflow-history-meta-card">
                    <div className="workflow-history-detail-row">
                      <span>{props.t("workflow_history_run_id")}</span>
                      <code>{props.detail.run_id}</code>
                    </div>
                    <div className="workflow-history-detail-row">
                      <span>{props.t("workflow_history_created_at")}</span>
                      <strong>{formatTimestamp(props.detail.created_at)}</strong>
                    </div>
                    <div className="workflow-history-detail-row">
                      <span>{props.t("workflow_history_started_at")}</span>
                      <strong>{formatTimestamp(props.detail.started_at)}</strong>
                    </div>
                    <div className="workflow-history-detail-row">
                      <span>{props.t("workflow_history_finished_at")}</span>
                      <strong>{formatTimestamp(props.detail.finished_at)}</strong>
                    </div>
                    {activeImagePath ? (
                      <div className="workflow-history-path">
                        <span>{props.t("workflow_history_image_path")}</span>
                        <code>{activeImagePath}</code>
                      </div>
                    ) : null}
                  </div>
                </details>
              </div>

              <WorkflowHistoryArgumentPanel
                title={props.t("workflow_history_resolved_args")}
                data={props.detail.resolved_args}
                t={props.t}
              />

              {props.detail.error?.message ? (
                <details className="workflow-history-code-block is-error" open>
                  <summary>{props.t("workflow_history_error")}</summary>
                  <pre>{props.detail.error.message}</pre>
                </details>
              ) : null}

              <div className="workflow-history-detail-actions">
                <button type="button" className="btn btn-danger-soft" onClick={() => props.onDeleteRun(props.detail.run_id)}>
                  {props.t("workflow_history_delete_entry")}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </Modal>
  );
}
