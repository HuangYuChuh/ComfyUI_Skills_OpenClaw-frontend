import { useState, type ChangeEvent } from "react";
import { FieldShell } from "../../components/ui/FieldShell";
import { TextField } from "../../components/ui/TextField";

interface EditorWorkflowInfoCardProps {
  workflowId: string;
  description: string;
  hasWorkflow: boolean;
  onWorkflowIdChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onUploadFile: (file: File | null) => void;
  t: (key: string) => string;
}

export function EditorWorkflowInfoCard(props: EditorWorkflowInfoCardProps) {
  const [uploadDragActive, setUploadDragActive] = useState(false);

  function onFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    props.onUploadFile(event.target.files?.[0] || null);
    event.target.value = "";
  }

  return (
    <section className="card" aria-labelledby="editor-info-title">
      <h2 id="editor-info-title" className="card-title">{props.t("wf_basic_info")}</h2>
      <div className="editor-info-grid">
        <FieldShell label={props.t("wf_id_label")} htmlFor="wf-id" className="editor-info-field no-margin" noMargin>
          <TextField
            id="wf-id"
            fieldClassName="editor-info-input"
            value={props.workflowId}
            onChange={(event) => props.onWorkflowIdChange(event.target.value)}
            placeholder={props.t("wf_id_placeholder")}
            autoComplete="off"
            spellCheck={false}
          />
        </FieldShell>
        <FieldShell label={props.t("wf_desc_label")} htmlFor="wf-desc" className="editor-info-field no-margin" noMargin>
          <TextField
            id="wf-desc"
            fieldClassName="editor-info-input"
            value={props.description}
            onChange={(event) => props.onDescriptionChange(event.target.value)}
            placeholder={props.t("wf_desc_placeholder")}
            autoComplete="off"
          />
        </FieldShell>
      </div>

      {!props.hasWorkflow ? (
        <label
          id="upload-zone"
          className={`upload-zone${uploadDragActive ? " is-dragging" : ""}`}
          htmlFor="file-upload"
          tabIndex={0}
          onDragEnter={(event) => {
            event.preventDefault();
            setUploadDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setUploadDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setUploadDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setUploadDragActive(false);
            props.onUploadFile(event.dataTransfer.files?.[0] || null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              const input = document.getElementById("file-upload");
              if (input instanceof HTMLInputElement) {
                input.click();
              }
            }
          }}
        >
          <input id="file-upload" type="file" accept=".json" onChange={onFileInputChange} />
          <span className="upload-title">{props.t("drag_upload")}</span>
          <span className="upload-subtitle">{props.t("after_upload")}</span>
        </label>
      ) : null}

      <aside className="upload-reminder" aria-live="polite">
        <h3 className="upload-reminder-title">{props.t("upload_reminder_title")}</h3>
        <ul className="upload-reminder-list">
          <li>{props.t("upload_reminder_api")}</li>
          <li>{props.t("upload_reminder_how")}</li>
        </ul>
      </aside>
    </section>
  );
}
