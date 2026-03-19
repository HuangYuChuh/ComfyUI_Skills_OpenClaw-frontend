import { useMemo, useRef } from "react";
import { Modal } from "../../components/ui/Modal";
import type { RunWorkflowResponseDto } from "../../types/api";

export interface RunWorkflowParam {
  field?: string;
  type?: string;
  required?: boolean;
  description?: string;
  default?: unknown;
  choices?: unknown[];
}

interface RunWorkflowModalProps {
  open: boolean;
  workflowId: string;
  schema: Record<string, RunWorkflowParam>;
  values: Record<string, unknown>;
  loading: boolean;
  submitting: boolean;
  result: RunWorkflowResponseDto["result"] | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onClose: () => void;
  onChange: (key: string, value: unknown) => void;
  onSubmit: () => void;
}

function isPromptLike(key: string, param: RunWorkflowParam, value: unknown) {
  const haystack = [key, param.field, param.description].join(" ").toLowerCase();
  return haystack.includes("prompt") || (typeof value === "string" && value.length > 120);
}

export function RunWorkflowModal(props: RunWorkflowModalProps) {
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const entries = useMemo(() => Object.entries(props.schema), [props.schema]);

  return (
    <Modal
      open={props.open}
      title={props.t("run_workflow_title", { id: props.workflowId })}
      onClose={props.onClose}
      width="wide"
      initialFocusRef={submitRef}
      actions={(
        <>
          <button type="button" className="btn btn-secondary" onClick={props.onClose}>
            {props.t("close")}
          </button>
          <button
            ref={submitRef}
            type="button"
            className="btn btn-primary"
            disabled={props.loading || props.submitting || entries.length === 0}
            onClick={props.onSubmit}
          >
            {props.submitting ? props.t("run_workflow_running") : props.t("run_workflow_submit")}
          </button>
        </>
      )}
    >
      {props.loading ? (
        <div className="empty-state">{props.t("loading")}</div>
      ) : entries.length === 0 ? (
        <div className="empty-state">{props.t("run_workflow_no_params")}</div>
      ) : (
        <div className="run-workflow-form">
          {entries.map(([key, param]) => {
            const value = props.values[key];
            const type = param.type || "string";
            const choices = Array.isArray(param.choices) ? param.choices : [];
            const showTextarea = type === "string" && isPromptLike(key, param, value);

            return (
              <div key={key} className="form-group run-workflow-field">
                <label htmlFor={`run-param-${key}`}>
                  {key}
                  {param.required ? <span className="run-workflow-required">*</span> : null}
                </label>
                {param.description ? <p className="run-workflow-help">{param.description}</p> : null}
                {choices.length > 0 ? (
                  <select
                    id={`run-param-${key}`}
                    className="input-field"
                    value={String(value ?? "")}
                    onChange={(event) => props.onChange(key, event.target.value)}
                  >
                    {!param.required ? <option value="">{props.t("run_workflow_optional_empty")}</option> : null}
                    {choices.map((choice) => (
                      <option key={`${key}-${String(choice)}`} value={String(choice)}>
                        {String(choice)}
                      </option>
                    ))}
                  </select>
                ) : type === "boolean" ? (
                  <label className="checkbox-inline">
                    <input
                      id={`run-param-${key}`}
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) => props.onChange(key, event.target.checked)}
                    />
                    <span>{props.t("run_workflow_boolean_true")}</span>
                  </label>
                ) : showTextarea ? (
                  <textarea
                    id={`run-param-${key}`}
                    className="input-field run-workflow-textarea"
                    value={String(value ?? "")}
                    onChange={(event) => props.onChange(key, event.target.value)}
                    rows={5}
                  />
                ) : (
                  <input
                    id={`run-param-${key}`}
                    className="input-field"
                    type={type === "int" || type === "float" ? "number" : "text"}
                    step={type === "float" ? "any" : undefined}
                    value={String(value ?? "")}
                    onChange={(event) => props.onChange(key, event.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {props.result ? (
        <section className={`run-workflow-result ${props.result.status === "success" ? "is-success" : "is-error"}`}>
          <div className="run-workflow-result-header">
            <h4>{props.t("run_workflow_last_result")}</h4>
            <span className={`status-badge ${props.result.status === "success" ? "status-on" : "status-off"}`}>
              {props.result.status === "success" ? props.t("run_workflow_status_success") : props.t("run_workflow_status_error")}
            </span>
          </div>
          {props.result.run_id ? <p className="run-workflow-meta">run_id: {props.result.run_id}</p> : null}
          {props.result.prompt_id ? <p className="run-workflow-meta">prompt_id: {props.result.prompt_id}</p> : null}
          {props.result.error ? <p className="run-workflow-error">{props.result.error}</p> : null}
          {Array.isArray(props.result.images) && props.result.images.length > 0 ? (
            <ul className="run-workflow-paths">
              {props.result.images.map((image) => (
                <li key={image}>
                  <code>{image}</code>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </Modal>
  );
}
