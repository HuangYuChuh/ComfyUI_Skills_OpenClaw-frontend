import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { SectionPanel } from "../../components/layout/SectionPanel";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { SwitchField } from "../../components/ui/SwitchField";
import { TextField } from "../../components/ui/TextField";
import type { WorkflowSummaryDto } from "../../types/api";
import { EditIcon, MoreIcon, TrashIcon, UploadIcon } from "./components/WorkflowIcons";

interface WorkflowManagerProps {
  workflows: WorkflowSummaryDto[];
  allWorkflowsForCurrentServer: number;
  search: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onCreateWorkflow: () => void;
  onCreateWorkflowFromFile: (file: File | null) => void;
  onEditWorkflow: (workflow: WorkflowSummaryDto) => void;
  onRunWorkflow: (workflow: WorkflowSummaryDto) => void;
  onOpenWorkflowHistory: (workflow: WorkflowSummaryDto) => void;
  onDeleteWorkflow: (workflow: WorkflowSummaryDto) => void;
  onToggleWorkflow: (workflow: WorkflowSummaryDto, enabled: boolean) => void;
  onUploadWorkflowVersion: (workflow: WorkflowSummaryDto) => void;
  onReorderWorkflows: (sourceWorkflowId: string, targetWorkflowId: string, placeAfter: boolean) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export function WorkflowManager(props: WorkflowManagerProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [emptyUploadDragActive, setEmptyUploadDragActive] = useState(false);
  const dragEnabled = props.sort === "custom" && !props.search.trim();

  function onEmptyUploadInputChange(event: ChangeEvent<HTMLInputElement>) {
    props.onCreateWorkflowFromFile(event.target.files?.[0] || null);
    event.target.value = "";
  }

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".workflow-more")) {
        setOpenMenuId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const summary = props.allWorkflowsForCurrentServer === props.workflows.length
    ? props.t(props.workflows.length === 1 ? "workflow_count_one" : "workflow_count", { count: props.workflows.length })
    : props.t(props.allWorkflowsForCurrentServer === 1 ? "workflow_count_filtered_one" : "workflow_count_filtered", {
      visible: props.workflows.length,
      total: props.allWorkflowsForCurrentServer,
    });

  const sortOptions = useMemo(() => [
    { value: "custom", label: props.t("workflow_sort_custom") },
    { value: "updated_desc", label: props.t("workflow_sort_recent") },
    { value: "name_asc", label: props.t("workflow_sort_name_asc") },
    { value: "name_desc", label: props.t("workflow_sort_name_desc") },
    { value: "enabled_first", label: props.t("workflow_sort_enabled") },
  ], [props.t]);

  return (
    <SectionPanel
      title={props.t("workflow_manager")}
      titleId="workflow-manager-title"
      actions={(
        <button type="button" className="btn btn-secondary panel-action-btn" onClick={props.onCreateWorkflow}>
          {props.t("register_new_short")}
        </button>
      )}
    >

      <div className="workflow-toolbar">
        <TextField
          id="workflow-search"
          fieldClassName="workflow-search-field"
          value={props.search}
          onChange={(event) => props.onSearchChange(event.target.value)}
          placeholder={props.t("workflow_search_placeholder")}
        />
        <div className="workflow-toolbar-side">
          {props.allWorkflowsForCurrentServer ? <p className="section-meta panel-meta workflow-summary-chip">{summary}</p> : null}
          <CustomSelect
            value={props.sort}
            options={sortOptions}
            ariaLabel={props.t("workflow_sort_custom")}
            className="is-server-select"
            onChange={props.onSortChange}
          />
        </div>
      </div>

      <div className="workflow-list" aria-live="polite">
        {props.workflows.length === 0 ? (
          props.allWorkflowsForCurrentServer ? (
            <div className="empty-state">{props.t("no_workflows_match")}</div>
          ) : (
            <label
              className={`upload-zone workflow-empty-upload${emptyUploadDragActive ? " is-dragging" : ""}`}
              htmlFor="workflow-empty-upload"
              tabIndex={0}
              onDragEnter={(event) => {
                event.preventDefault();
                setEmptyUploadDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setEmptyUploadDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setEmptyUploadDragActive(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setEmptyUploadDragActive(false);
                props.onCreateWorkflowFromFile(event.dataTransfer.files?.[0] || null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  const input = document.getElementById("workflow-empty-upload");
                  if (input instanceof HTMLInputElement) {
                    input.click();
                  }
                }
              }}
            >
              <input id="workflow-empty-upload" type="file" accept=".json" onChange={onEmptyUploadInputChange} />
              <span className="upload-title">{props.t("drag_upload")}</span>
              <span className="upload-subtitle">{props.t("after_upload")}</span>
            </label>
          )
        ) : props.workflows.map((workflow) => (
          <article
            key={`${workflow.server_id}-${workflow.id}`}
            className={`workflow-item ${dragEnabled ? "is-reorderable" : ""}`}
            data-workflow-id={workflow.id}
            data-server-id={workflow.server_id}
            onDragOver={(event) => {
              if (!dragEnabled) {
                return;
              }
              event.preventDefault();
              (event.currentTarget as HTMLElement).classList.add("is-drop-target");
            }}
            onDragLeave={(event) => {
              (event.currentTarget as HTMLElement).classList.remove("is-drop-target");
            }}
            onDrop={(event) => {
              if (!dragEnabled) {
                return;
              }
              event.preventDefault();
              const target = event.currentTarget as HTMLElement;
              target.classList.remove("is-drop-target");
              const sourceWorkflowId = event.dataTransfer.getData("text/plain");
              if (!sourceWorkflowId || sourceWorkflowId === workflow.id) {
                return;
              }
              const rect = target.getBoundingClientRect();
              props.onReorderWorkflows(sourceWorkflowId, workflow.id, event.clientY > rect.top + rect.height / 2);
            }}
          >
            <div className="workflow-main">
              <div className="workflow-name-row">
                <span className={`status-dot ${workflow.enabled ? "" : "is-disabled"}`} aria-hidden="true">&#x25CF;</span>
                <span className="workflow-name">{workflow.id}</span>
                <span className="workflow-server-tag">{workflow.server_name || workflow.server_id}</span>
              </div>
              {workflow.description ? <p className="workflow-desc">{workflow.description}</p> : null}
            </div>

            <div className="workflow-actions">
              {props.sort === "custom" ? (
                <button
                  type="button"
                  className={`btn btn-secondary btn-icon workflow-drag-handle ${dragEnabled ? "" : "is-disabled"}`}
                  draggable={dragEnabled}
                  aria-label={props.t("workflow_drag_handle", { id: workflow.id })}
                  title={props.t("workflow_drag_handle", { id: workflow.id })}
                  tabIndex={-1}
                  onDragStart={(event) => {
                    if (!dragEnabled) {
                      event.preventDefault();
                      return;
                    }
                    event.currentTarget.closest(".workflow-item")?.classList.add("is-dragging");
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", workflow.id);
                  }}
                  onDragEnd={(event) => {
                    event.currentTarget.closest(".workflow-item")?.classList.remove("is-dragging");
                    document.querySelectorAll(".workflow-item.is-drop-target").forEach((item) => item.classList.remove("is-drop-target"));
                  }}
                >
                  <span aria-hidden="true">&#x2261;</span>
                </button>
              ) : null}

              <div className="workflow-status-toggle">
                <SwitchField
                  ariaLabel={props.t("toggle_workflow", { id: workflow.id })}
                  checked={workflow.enabled}
                  className="workflow-toggle-field"
                  label={(
                    <span className={`workflow-enabled-label ${workflow.enabled ? "status-on" : "status-off"}`}>
                      {workflow.enabled ? props.t("wf_enabled") : props.t("wf_disabled")}
                    </span>
                  )}
                  onChange={(event) => {
                    setOpenMenuId(null);
                    props.onToggleWorkflow(workflow, event.target.checked);
                  }}
                />
              </div>

              <div className="workflow-primary-actions">
                <button
                  type="button"
                  className="btn btn-secondary workflow-inline-btn workflow-run-btn"
                  onClick={() => {
                    setOpenMenuId(null);
                    props.onRunWorkflow(workflow);
                  }}
                >
                  {props.t("run_workflow_short")}
                </button>
              </div>

              <div className="workflow-secondary-actions">
                {workflow.has_history ? (
                  <button
                    type="button"
                    className="btn btn-secondary workflow-inline-btn workflow-secondary-btn"
                    onClick={() => {
                      setOpenMenuId(null);
                      props.onOpenWorkflowHistory(workflow);
                    }}
                  >
                    {props.t("workflow_history_short")}
                  </button>
                ) : null}

                <button
                  type="button"
                  className="btn btn-secondary btn-icon workflow-action-btn workflow-action-edit"
                  aria-label={props.t("edit_workflow", { id: workflow.id })}
                  onClick={() => {
                    setOpenMenuId(null);
                    props.onEditWorkflow(workflow);
                  }}
                >
                  <EditIcon />
                </button>

                <div className={`workflow-more ${openMenuId === workflow.id ? "is-open" : ""}`}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon workflow-action-btn workflow-more-trigger"
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === workflow.id}
                    aria-label={props.t("workflow_more_actions", { id: workflow.id })}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId((current) => current === workflow.id ? null : workflow.id);
                    }}
                  >
                    <MoreIcon />
                  </button>
                  <div className={`workflow-more-menu ${openMenuId === workflow.id ? "" : "hidden"}`} role="menu">
                    <button
                      type="button"
                      className="workflow-more-item"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenuId(null);
                        props.onUploadWorkflowVersion(workflow);
                      }}
                    >
                      <UploadIcon />
                      <span>{props.t("upload_new_version")}</span>
                    </button>
                    <button
                      type="button"
                      className="workflow-more-item workflow-more-item-danger"
                      role="menuitem"
                      onClick={() => {
                        setOpenMenuId(null);
                        props.onDeleteWorkflow(workflow);
                      }}
                    >
                      <TrashIcon />
                      <span>{props.t("delete")}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionPanel>
  );
}
