export interface ServerDto {
  id: string;
  name: string;
  url: string;
  auth?: string;
  enabled: boolean;
  output_dir: string;
  server_type?: string;
  unsupported?: boolean;
  unsupported_reason?: string;
}

export interface WorkflowSummaryDto {
  id: string;
  server_id: string;
  server_name: string;
  enabled: boolean;
  description: string;
  updated_at: number;
  origin?: string;
  source_label?: string;
  tags?: string[];
  has_history?: boolean;
}

export interface WorkflowDetailDto {
  workflow_id: string;
  server_id: string;
  description: string;
  enabled: boolean;
  workflow_data: Record<string, unknown>;
  schema_params: Record<string, unknown>;
  run_schema_params?: Record<string, unknown>;
  origin?: string;
  source_label?: string;
  tags?: string[];
}

export interface RunWorkflowResponseDto {
  status: string;
  result: {
    status?: string;
    server?: string;
    workflow_id?: string;
    run_id?: string;
    prompt_id?: string;
    images?: string[];
    error?: string;
  };
}

export interface ExecutionHistorySummaryDto {
  run_id: string;
  server_id: string;
  workflow_id: string;
  status: string;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  duration_ms?: number | null;
  prompt_id?: string | null;
  raw_args: Record<string, unknown>;
  resolved_args: Record<string, unknown>;
  image_count: number;
  images: string[];
  error_message?: string;
}

export interface ExecutionHistoryDetailDto {
  run_id: string;
  server_id: string;
  workflow_id: string;
  status: string;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  duration_ms?: number | null;
  prompt_id?: string | null;
  raw_args: Record<string, unknown>;
  resolved_args: Record<string, unknown>;
  workflow_snapshot?: Record<string, unknown>;
  schema_snapshot?: Record<string, unknown>;
  result?: {
    images?: string[];
    image_count?: number;
  } | null;
  error?: {
    message?: string;
  } | null;
}

export interface BulkImportItemDto {
  workflow_id: string;
  final_workflow_id: string;
  source_label: string;
  status: "created" | "renamed" | "skipped" | "failed";
  reason: string;
}

export interface BulkImportReportDto {
  summary: {
    created: number;
    renamed: number;
    skipped: number;
    failed: number;
    total: number;
  };
  items: BulkImportItemDto[];
}

export interface BulkImportPreviewItemDto {
  workflow_id: string;
  final_workflow_id: string;
  source_label: string;
  description: string;
  status: "ready" | "renamed" | "failed";
  reason: string;
}

export interface BulkImportPreviewReportDto {
  summary: {
    ready: number;
    renamed: number;
    failed: number;
    importable: number;
    total: number;
  };
  items: BulkImportPreviewItemDto[];
}

// ── Dependency Check ────────────────────────────────────────

export interface MissingNodeDto {
  class_type: string;
  source_repo: string | null;
  package_name: string | null;
  can_auto_install: boolean;
}

export interface MissingModelDto {
  filename: string;
  folder: string;
  loader_node: string;
  node_id: string;
}

export interface DependencyReportDto {
  is_ready: boolean;
  missing_nodes: MissingNodeDto[];
  missing_models: MissingModelDto[];
  total_nodes_required: number;
  total_models_required: number;
  summary: string;
}

export interface InstallResultDto {
  success: boolean;
  package_name: string;
  repo_url: string;
  message: string;
  method: string;
  needs_restart: boolean;
}

export interface InstallReportDto {
  results: InstallResultDto[];
  needs_restart: boolean;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

export interface TogglePayload {
  enabled: boolean;
}

export interface SaveWorkflowPayload {
  workflow_id: string;
  server_id: string;
  original_workflow_id: string | null;
  description: string;
  workflow_data: Record<string, unknown> | null;
  schema_params: Record<string, unknown>;
  ui_schema_params: Record<string, unknown>;
  overwrite_existing: boolean;
}

export interface SaveServerPayload {
  id?: string | null;
  name: string;
  url: string;
  auth?: string;
  enabled: boolean;
  output_dir: string;
}

export interface WorkflowIdsPayload {
  workflow_ids: string[];
}

export interface WorkflowOrderPayload extends WorkflowIdsPayload {}

export interface WorkflowBatchDeleteResponseDto {
  status: string;
  deleted: string[];
  missing: string[];
}

export interface LocalWorkflowImportFilePayload {
  file_name: string;
  content: string;
}

export interface ValidationIssueDto {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface TransferSelectionServerPayload {
  server_id: string;
  workflow_ids: string[];
}

export interface TransferSelectionPayload {
  servers: TransferSelectionServerPayload[];
}

export interface TransferExportPreviewWorkflowDto {
  workflow_id: string;
  enabled: boolean;
  description: string;
  selected: boolean;
}

export interface TransferExportPreviewServerDto {
  server_id: string;
  name: string;
  enabled: boolean;
  selected: boolean;
  workflow_count: number;
  workflows: TransferExportPreviewWorkflowDto[];
}

export interface TransferExportPreviewDto {
  portable_only: boolean;
  summary: {
    servers: number;
    workflows: number;
    warnings: number;
  };
  servers: TransferExportPreviewServerDto[];
  warnings: ValidationIssueDto[];
}

export interface TransferExportBuildResponseDto {
  bundle: Record<string, unknown>;
  preview: TransferExportPreviewDto;
}

export interface TransferPlanItemDto {
  server_id: string;
  workflow_id?: string | null;
  reason: string;
}

export interface TransferPlanDto {
  created_servers: TransferPlanItemDto[];
  updated_servers: TransferPlanItemDto[];
  created_workflows: TransferPlanItemDto[];
  overwritten_workflows: TransferPlanItemDto[];
  skipped_items: TransferPlanItemDto[];
  warnings: ValidationIssueDto[];
  apply_environment: boolean;
  overwrite_workflows: boolean;
  summary: {
    created_servers: number;
    updated_servers: number;
    created_workflows: number;
    overwritten_workflows: number;
    skipped_items: number;
    warnings: number;
  };
}

export interface TransferValidationDto {
  valid: boolean;
  errors: ValidationIssueDto[];
  warnings: ValidationIssueDto[];
}

export interface TransferImportPreviewDto {
  validation: TransferValidationDto;
  plan: TransferPlanDto | null;
}

export interface TransferImportResponseDto {
  status: string;
  validation: TransferValidationDto;
  plan: TransferPlanDto;
}
