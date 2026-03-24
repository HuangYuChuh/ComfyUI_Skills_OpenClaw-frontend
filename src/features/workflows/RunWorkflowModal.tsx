import { useEffect, useMemo, useRef, useState } from "react";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { FieldShell } from "../../components/ui/FieldShell";
import { Modal } from "../../components/ui/Modal";
import { SwitchField } from "../../components/ui/SwitchField";
import { TextAreaField } from "../../components/ui/TextAreaField";
import { TextField } from "../../components/ui/TextField";
import type { RunWorkflowResponseDto } from "../../types/api";
import type { RunWorkflowParam } from "./types";

interface RunWorkflowModalProps {
  open: boolean;
  workflowId: string;
  serverId: string;
  schema: Record<string, RunWorkflowParam>;
  values: Record<string, unknown>;
  loading: boolean;
  submitting: boolean;
  result: RunWorkflowResponseDto["result"] | null;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onClose: () => void;
  onChange: (key: string, value: unknown) => void;
  onSubmit: () => void;
  onUploadImage: (serverId: string, file: File) => Promise<string>;
}

function ImageUploadField(props: {
  id: string;
  serverId: string;
  value: string;
  onUploadImage: (serverId: string, file: File) => Promise<string>;
  onChange: (filename: string) => void;
  t: (key: string) => string;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const filename = await props.onUploadImage(props.serverId, file);
      props.onChange(filename);
    } catch {
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="run-workflow-image-upload">
      <div className="run-workflow-image-controls">
        <button
          type="button"
          className="btn btn-secondary run-workflow-image-choose-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? props.t("run_workflow_image_uploading") : props.t("run_workflow_image_choose")}
        </button>
        {props.value && <span className="run-workflow-image-filename">{props.value}</span>}
      </div>
      <input
        ref={fileInputRef}
        id={props.id}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
      />
      {previewUrl && (
        <img src={previewUrl} alt="preview" className="run-workflow-image-preview" />
      )}
    </div>
  );
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
              <FieldShell
                key={key}
                label={key}
                htmlFor={`run-param-${key}`}
                helpText={param.description}
                required={param.required}
                className="run-workflow-field"
              >
                {type === "image" ? (
                  <ImageUploadField
                    id={`run-param-${key}`}
                    serverId={props.serverId}
                    value={String(value ?? "")}
                    onUploadImage={props.onUploadImage}
                    onChange={(filename) => props.onChange(key, filename)}
                    t={props.t}
                  />
                ) : choices.length > 0 ? (
                  <CustomSelect
                    id={`run-param-${key}`}
                    value={String(value ?? "")}
                    className="is-run-workflow-select"
                    ariaLabel={key}
                    onChange={(nextValue) => props.onChange(key, nextValue)}
                    options={[
                      ...(!param.required ? [{ value: "", label: props.t("run_workflow_optional_empty") }] : []),
                      ...choices.map((choice) => ({
                        value: String(choice),
                        label: String(choice),
                      })),
                    ]}
                  />
                ) : type === "boolean" ? (
                  <SwitchField
                    id={`run-param-${key}`}
                    className="run-workflow-switch"
                    checked={Boolean(value)}
                    onChange={(event) => props.onChange(key, event.target.checked)}
                    label={props.t("run_workflow_boolean_true")}
                  />
                ) : showTextarea ? (
                  <TextAreaField
                    id={`run-param-${key}`}
                    fieldClassName="run-workflow-textarea"
                    value={String(value ?? "")}
                    onChange={(event) => props.onChange(key, event.target.value)}
                    rows={5}
                  />
                ) : (
                  <TextField
                    id={`run-param-${key}`}
                    fieldClassName="run-workflow-input"
                    type={type === "int" || type === "float" ? "number" : "text"}
                    step={type === "float" ? "any" : undefined}
                    value={String(value ?? "")}
                    onChange={(event) => props.onChange(key, event.target.value)}
                  />
                )}
              </FieldShell>
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
          {props.result.error ? (
            <p className="run-workflow-error">
              <strong>{props.t("run_workflow_comfyui_error_prefix")}</strong>{" "}
              {typeof props.result.error === "string"
                ? props.result.error
                : (props.result.error as Record<string, unknown>)?.message as string ?? JSON.stringify(props.result.error)}
            </p>
          ) : null}
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
