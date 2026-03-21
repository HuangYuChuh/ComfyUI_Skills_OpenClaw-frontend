import type {
  ExecutionHistoryDetailDto,
  ExecutionHistorySummaryDto,
  WorkflowDetailDto,
  WorkflowSummaryDto,
} from "../types/api";
import type { RunWorkflowParam } from "../features/workflows/types";

export interface RunWorkflowState {
  open: boolean;
  workflow: WorkflowSummaryDto | null;
  schema: Record<string, RunWorkflowParam>;
  values: Record<string, unknown>;
  loading: boolean;
  submitting: boolean;
  result: { status?: string; run_id?: string; prompt_id?: string; images?: string[]; error?: string } | null;
}

export interface WorkflowHistoryState {
  open: boolean;
  workflow: WorkflowSummaryDto | null;
  items: ExecutionHistorySummaryDto[];
  selectedRunId: string | null;
  detail: ExecutionHistoryDetailDto | null;
  loading: boolean;
  detailLoading: boolean;
}

export function initialRunWorkflowState(): RunWorkflowState {
  return {
    open: false,
    workflow: null,
    schema: {},
    values: {},
    loading: false,
    submitting: false,
    result: null,
  };
}

export function initialWorkflowHistoryState(): WorkflowHistoryState {
  return {
    open: false,
    workflow: null,
    items: [],
    selectedRunId: null,
    detail: null,
    loading: false,
    detailLoading: false,
  };
}

export function normalizeRunSchema(detail: WorkflowDetailDto): Record<string, RunWorkflowParam> {
  const raw = detail.run_schema_params && Object.keys(detail.run_schema_params).length > 0
    ? detail.run_schema_params
    : detail.schema_params;

  const entries = Object.entries(raw || {}).filter(([, value]) => value && typeof value === "object");
  return Object.fromEntries(entries.map(([key, value]) => [key, value as RunWorkflowParam]));
}

export function buildRunWorkflowDefaults(schema: Record<string, RunWorkflowParam>) {
  const values: Record<string, unknown> = {};

  Object.entries(schema).forEach(([key, param]) => {
    if (param.type === "boolean") {
      values[key] = Boolean(param.default ?? false);
      return;
    }
    values[key] = param.default ?? "";
  });

  return values;
}

function isSameWorkflow(candidate: WorkflowSummaryDto | null | undefined, target: WorkflowSummaryDto) {
  return candidate?.server_id === target.server_id && candidate.id === target.id;
}

export function ensureWorkflowHasHistory(workflow: WorkflowSummaryDto | null, target: WorkflowSummaryDto) {
  if (!workflow || workflow.has_history || !isSameWorkflow(workflow, target)) {
    return workflow;
  }
  return { ...workflow, has_history: true };
}

export function updateStateWorkflowHasHistory<T extends { workflow: WorkflowSummaryDto | null }>(state: T, target: WorkflowSummaryDto): T {
  const workflow = ensureWorkflowHasHistory(state.workflow, target);
  return workflow === state.workflow ? state : { ...state, workflow };
}
