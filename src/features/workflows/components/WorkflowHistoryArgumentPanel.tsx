import { memo, useMemo } from "react";
import {
  formatArgumentKey,
  getArgumentEntries,
  getArgumentTypeLabel,
  renderJson,
} from "../utils/history";

interface WorkflowHistoryArgumentPanelProps {
  title: string;
  data: Record<string, unknown>;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function renderArgumentValue(value: unknown) {
  if (typeof value === "string") {
    return <p className="workflow-history-arg-text">{value || "—"}</p>;
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return <code className="workflow-history-arg-inline">{String(value)}</code>;
  }
  return <pre className="workflow-history-arg-json">{renderJson(value)}</pre>;
}

export const WorkflowHistoryArgumentPanel = memo(function WorkflowHistoryArgumentPanel(
  props: WorkflowHistoryArgumentPanelProps,
) {
  const entries = useMemo(() => getArgumentEntries(props.data), [props.data]);

  return (
    <section className="workflow-history-args-panel">
      <div className="workflow-history-panel-header">
        <div>
          <p className="workflow-history-panel-eyebrow">{props.title}</p>
          <h4>{props.title}</h4>
        </div>
        <span className="workflow-meta-tag">{entries.length}</span>
      </div>

      {entries.length > 0 ? (
        <div className="workflow-history-arg-grid">
          {entries.map(([key, value]) => (
            <article key={key} className="workflow-history-arg-card">
              <div className="workflow-history-arg-card-top">
                <strong className="workflow-history-arg-key">{formatArgumentKey(key)}</strong>
                <span className="workflow-history-arg-type">{getArgumentTypeLabel(value)}</span>
              </div>
              <div className="workflow-history-arg-value">{renderArgumentValue(value)}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="workflow-history-empty-hint">{props.t("workflow_history_no_args")}</div>
      )}
    </section>
  );
});
