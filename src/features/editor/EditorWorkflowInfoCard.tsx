import { useState, type ChangeEvent } from "react";
import { FieldShell } from "../../components/ui/FieldShell";
import { TextField } from "../../components/ui/TextField";

interface EditorWorkflowInfoCardProps {
  workflowId: string;
  description: string;
  hasWorkflow: boolean;
  currentServerLabel: string | null;
  bulkImportBusy: boolean;
  bulkImportStage: "preview" | "import" | null;
  onWorkflowIdChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onUploadFile: (file: File | null) => void;
  onOpenFolderImport: () => void;
  onPreviewImportFromComfyUI: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export function EditorWorkflowInfoCard(props: EditorWorkflowInfoCardProps) {
  const [uploadDragActive, setUploadDragActive] = useState(false);

  function onFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    props.onUploadFile(event.target.files?.[0] || null);
    event.target.value = "";
  }

  function openSingleUpload() {
    const input = document.getElementById("file-upload");
    if (input instanceof HTMLInputElement) {
      input.click();
    }
  }

  return (
    <>
      {!props.hasWorkflow ? (
        <section className="card editor-upload-card" aria-labelledby="editor-upload-title">
          <div className="editor-section-heading">
            <h2 id="editor-upload-title" className="card-title">{props.t("editor_step_1")}</h2>
            <p className="subtitle editor-section-hint">{props.t("editor_step_1_hint")}</p>
          </div>

          <div
            id="upload-zone"
            className="editor-upload-selector"
          >
            <input id="file-upload" type="file" accept=".json" onChange={onFileInputChange} />
            <div className="editor-upload-selector-copy">
              <span className="upload-title">{props.t("drag_upload")}</span>
              <span className="upload-subtitle">{props.t("after_upload")}</span>
            </div>

            <div className="editor-upload-grid" aria-label={props.t("editor_import_source_label")}>
              <article
                className={`editor-upload-option is-primary${uploadDragActive ? " is-dragging" : ""}`}
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
              >
                <div className="editor-upload-option-copy">
                  <h3 className="editor-upload-option-title">{props.t("editor_import_source_single")}</h3>
                  <p className="editor-upload-option-text">{props.t("editor_upload_option_single_help")}</p>
                </div>
                <button type="button" className="editor-upload-card-button is-primary" onClick={openSingleUpload}>
                  {props.t("editor_import_action_single")}
                </button>
              </article>

              <article className="editor-upload-option">
                <div className="editor-upload-option-copy">
                  <h3 className="editor-upload-option-title">{props.t("editor_import_source_folder")}</h3>
                  <p className="editor-upload-option-text">{props.t("editor_upload_option_folder_help")}</p>
                </div>
                <button
                  type="button"
                  className="editor-upload-card-button"
                  onClick={props.onOpenFolderImport}
                  disabled={props.bulkImportBusy}
                >
                  {props.t("editor_import_action_folder")}
                </button>
              </article>

              <article className="editor-upload-option is-caution">
                <div className="editor-upload-option-copy">
                  <h3 className="editor-upload-option-title">{props.t("editor_import_source_comfyui")}</h3>
                  <p className="editor-upload-option-text">
                    {props.currentServerLabel
                      ? props.t("editor_upload_option_comfyui_help_with_server", { server: props.currentServerLabel })
                      : props.t("editor_upload_option_comfyui_help")}
                  </p>
                </div>
                <button
                  type="button"
                  className="editor-upload-card-button"
                  onClick={props.onPreviewImportFromComfyUI}
                  disabled={props.bulkImportBusy}
                >
                  {props.bulkImportBusy
                    ? props.t(props.bulkImportStage === "preview" ? "editor_import_action_comfyui_scanning" : "bulk_import_loading")
                    : props.t("editor_import_action_comfyui")}
                </button>
              </article>
            </div>
          </div>

          <aside className="upload-note" aria-live="polite">
            <h3 className="upload-note-title">{props.t("upload_reminder_title")}</h3>
            <ul className="upload-note-list">
              <li>{props.t("upload_reminder_api")}</li>
              <li>{props.t("upload_reminder_how")}</li>
            </ul>
          </aside>
        </section>
      ) : null}

      {props.hasWorkflow ? (
        <section className="card" aria-labelledby="editor-info-title">
          <div className="editor-section-heading">
            <h2 id="editor-info-title" className="card-title">{props.t("editor_step_2")}</h2>
            <p className="subtitle editor-section-hint">{props.t("editor_step_2_hint")}</p>
          </div>
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
        </section>
      ) : null}
    </>
  );
}
