import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WorkflowManager } from "../../../src/features/workflows/WorkflowManager";
import type { WorkflowSummaryDto } from "../../../src/types/api";

const messages: Record<string, string> = {
  workflow_manager: "Workflow Manager",
  workflow_count: "{count} workflows",
  workflow_count_filtered: "{visible} of {total} workflows",
  workflow_sort_custom: "Custom",
  workflow_sort_recent: "Recently updated",
  workflow_sort_name: "Name",
  workflow_sort_name_asc: "Name A-Z",
  workflow_sort_name_desc: "Name Z-A",
  workflow_sort_enabled: "Enabled first",
  workflow_search_placeholder: "Search workflows",
  register_new_short: "+ New Workflow",
  workflow_batch_actions: "Batch workflow actions",
  workflow_selected_count: "{count} selected",
  workflow_selection_mode: "Management mode",
  workflow_enter_batch_mode: "Manage",
  workflow_management_active: "Managing",
  workflow_exit_batch_mode: "Done",
  workflow_select_all: "Select all in view",
  workflow_clear_selection: "Clear selection",
  workflow_delete_selected: "Delete selected",
  delete: "Delete",
  workflow_select_workflow: "Select workflow {id}",
  drag_upload: "Drag or click to upload ComfyUI workflow_api.json",
  after_upload: "After upload, you can remap parameters by node.",
  workflow_more_actions: "More actions for workflow {id}",
  run_workflow_short: "Run",
  upload_new_version: "Upload New Version",
  edit_workflow: "Edit workflow {id}",
  toggle_workflow: "Toggle workflow {id}",
  wf_enabled: "Enabled",
  wf_disabled: "Disabled",
  workflow_drag_handle: "Drag to reorder workflow {id}",
  workflow_status_running: "Running...",
  workflow_status_success: "Success",
  workflow_status_error: "Failed",
  workflow_status_view_history: "Click to view details",
};

function t(key: string, vars?: Record<string, string | number>) {
  return (messages[key] ?? key).replace(/\{(\w+)\}/g, (_, token) => String(vars?.[token] ?? ""));
}

const workflows: WorkflowSummaryDto[] = [
  {
    id: "wf-a",
    server_id: "server-1",
    server_name: "Remote",
    enabled: true,
    description: "First workflow",
    updated_at: 10,
  },
  {
    id: "wf-b",
    server_id: "server-1",
    server_name: "Remote",
    enabled: true,
    description: "Second workflow",
    updated_at: 20,
  },
];

function renderWorkflowManager(overrides: Partial<ComponentProps<typeof WorkflowManager>> = {}) {
  const props: ComponentProps<typeof WorkflowManager> = {
    workflows,
    allWorkflowsForCurrentServer: workflows.length,
    search: "",
    sort: "custom",
    onSearchChange: vi.fn(),
    onSortChange: vi.fn(),
    onCreateWorkflow: vi.fn(),
    onCreateWorkflowFromFile: vi.fn(),
    onEditWorkflow: vi.fn(),
    onRunWorkflow: vi.fn(),
    onBatchDeleteWorkflows: vi.fn(),
    onDeleteWorkflow: vi.fn(),
    onToggleWorkflow: vi.fn(),
    onUploadWorkflowVersion: vi.fn(),
    onReorderWorkflows: vi.fn(),
    executingWorkflows: {},
    onViewHistory: vi.fn(),
    t,
    ...overrides,
  };

  return {
    ...render(<WorkflowManager {...props} />),
    props,
  };
}

describe("WorkflowManager", () => {
  it("opens the more menu, closes it on outside click, and triggers upload action", async () => {
    const user = userEvent.setup();
    const { props } = renderWorkflowManager();

    const trigger = screen.getByRole("button", { name: "More actions for workflow wf-a" });
    const menu = trigger.closest(".workflow-more")?.querySelector(".workflow-more-menu") as HTMLElement;

    expect(menu).toHaveClass("hidden");

    await user.click(trigger);
    expect(menu).not.toHaveClass("hidden");

    fireEvent.click(document.body);
    expect(menu).toHaveClass("hidden");

    await user.click(trigger);
    const menuItems = trigger
      .closest(".workflow-more")
      ?.querySelectorAll('.workflow-more-item[role="menuitem"]') as NodeListOf<HTMLElement>;
    // menu order: Run, Check Dependencies, Upload New Version, Delete
    await user.click(menuItems[2]);

    expect(props.onUploadWorkflowVersion).toHaveBeenCalledWith(workflows[0]);
    expect(menu).toHaveClass("hidden");
  });

  it("renders sortable items with grip handle when sort is custom", () => {
    const { container } = renderWorkflowManager({ sort: "custom" });
    const sortableItems = container.querySelectorAll(".workflow-item.is-sortable");
    expect(sortableItems.length).toBe(2);

    const grips = container.querySelectorAll(".workflow-grip");
    expect(grips.length).toBe(2);
  });

  it("does not render grip handle or sortable class when sort is not custom", () => {
    const { container } = renderWorkflowManager({ sort: "updated_desc" });
    const sortableItems = container.querySelectorAll(".workflow-item.is-sortable");
    expect(sortableItems.length).toBe(0);

    const grips = container.querySelectorAll(".workflow-grip");
    expect(grips.length).toBe(0);
  });

  it("does not render an empty workflow summary pill when there are no workflows", () => {
    renderWorkflowManager({
      workflows: [],
      allWorkflowsForCurrentServer: 0,
    });

    expect(document.querySelector(".panel-meta")).toBeNull();
  });

  it("uploads a workflow file from the empty state dropzone", async () => {
    const { props } = renderWorkflowManager({
      workflows: [],
      allWorkflowsForCurrentServer: 0,
    });

    const dropzone = screen.getByText("Drag or click to upload ComfyUI workflow_api.json").closest("label") as HTMLElement;
    const file = new File(['{"1":{"class_type":"CLIPTextEncode","inputs":{"text":"hello"}}}'], "workflow_api.json", {
      type: "application/json",
    });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });

    expect(props.onCreateWorkflowFromFile).toHaveBeenCalledWith(file);
  });

  it("selects workflows and triggers batch delete for the current view", async () => {
    const user = userEvent.setup();
    const { props } = renderWorkflowManager();

    expect(screen.queryByRole("checkbox", { name: "Select workflow wf-a" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Manage" }));
    await user.click(screen.getByRole("checkbox", { name: "Select workflow wf-a" }));
    await user.click(screen.getByRole("button", { name: "Delete selected" }));

    expect(props.onBatchDeleteWorkflows).toHaveBeenCalledWith([workflows[0]]);
  });

  it("toggles workflow selection when the main content area is clicked in management mode", async () => {
    const user = userEvent.setup();
    renderWorkflowManager();

    await user.click(screen.getByRole("button", { name: "Manage" }));

    const workflowMainGroup = screen.getByText("wf-a").closest(".workflow-main-group");
    expect(workflowMainGroup).not.toBeNull();

    await user.click(workflowMainGroup as HTMLElement);
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    await user.click(workflowMainGroup as HTMLElement);
    expect(screen.queryByText("1 selected")).toBeNull();
  });

  it("exits batch mode and clears the current selection", async () => {
    const user = userEvent.setup();
    renderWorkflowManager();

    await user.click(screen.getByRole("button", { name: "Manage" }));
    await user.click(screen.getByRole("checkbox", { name: "Select workflow wf-a" }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("checkbox", { name: "Select workflow wf-a" })).toBeNull();
    expect(screen.queryByText("1 selected")).toBeNull();
  });

  it("does not render the history shortcut even when a workflow has history", () => {
    renderWorkflowManager({
      workflows: [{ ...workflows[0], has_history: true }],
      allWorkflowsForCurrentServer: 1,
    });

    expect(screen.queryByRole("button", { name: "History" })).toBeNull();
  });
});
