import { EditorMappingSection } from "./EditorMappingSection";
import { EditorWorkflowInfoCard } from "./EditorWorkflowInfoCard";
import type { EditorViewProps } from "./types";

export function EditorView(props: EditorViewProps) {
  const editorStep = !props.workflowId ? 1 : (!props.hasWorkflow ? 2 : 3);

  return (
    <>
      <ol className="editor-stepper" aria-label="Workflow setup steps">
        <li className={`editor-step ${editorStep === 1 ? "is-active" : editorStep > 1 ? "is-done" : ""}`}>
          <span className="editor-step-index">1</span>
          <span className="editor-step-label">{props.t("editor_step_1")}</span>
        </li>
        <li className={`editor-step ${editorStep === 2 ? "is-active" : editorStep > 2 ? "is-done" : ""}`}>
          <span className="editor-step-index">2</span>
          <span className="editor-step-label">{props.t("editor_step_2")}</span>
        </li>
        <li className={`editor-step ${editorStep === 3 ? "is-active" : ""}`}>
          <span className="editor-step-index">3</span>
          <span className="editor-step-label">{props.t("editor_step_3")}</span>
        </li>
      </ol>

      <EditorWorkflowInfoCard
        workflowId={props.workflowId}
        description={props.description}
        hasWorkflow={props.hasWorkflow}
        onWorkflowIdChange={props.onWorkflowIdChange}
        onDescriptionChange={props.onDescriptionChange}
        onUploadFile={props.onUploadFile}
        t={props.t}
      />

      <EditorMappingSection {...props} />
    </>
  );
}
