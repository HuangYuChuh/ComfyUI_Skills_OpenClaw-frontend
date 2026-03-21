import type { ExecutionHistoryDetailDto } from "../../../types/api";

const historyTimestampFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function formatTimestamp(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return historyTimestampFormatter.format(date);
}

export function formatDuration(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  if (value < 1000) {
    return `${value} ms`;
  }
  if (value < 60_000) {
    return `${(value / 1000).toFixed(value < 10_000 ? 2 : 1)} s`;
  }
  return `${(value / 60_000).toFixed(1)} min`;
}

export function renderJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

export function getStatusClassName(status?: string | null) {
  if (status === "success") {
    return "status-on";
  }
  if (status === "running") {
    return "status-running";
  }
  if (status === "queued") {
    return "status-waiting";
  }
  return "status-off";
}

export function buildHistoryImageUrl(serverId: string, workflowId: string, runId: string, imageIndex: number) {
  return `/api/servers/${encodeURIComponent(serverId)}/workflow/${encodeURIComponent(workflowId)}/history/${encodeURIComponent(runId)}/images/${imageIndex}`;
}

export function getImageUrls(detail: ExecutionHistoryDetailDto | null) {
  if (!detail) {
    return [];
  }

  const images = Array.isArray(detail.result?.images) ? detail.result.images : [];
  return images.map((_, index) => buildHistoryImageUrl(detail.server_id, detail.workflow_id, detail.run_id, index));
}

export function shortenId(value?: string | null) {
  if (!value) {
    return "—";
  }
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

export function formatArgumentKey(key: string) {
  return key.replace(/^(seed|size|width|height|batch_size|num|num_images|max_images|filename_prefix)_\d+$/i, "$1");
}

export function getArgumentEntries(value: Record<string, unknown> | null | undefined) {
  return Object.entries(value || {}).sort(([left], [right]) => left.localeCompare(right));
}

export function getArgumentTypeLabel(value: unknown) {
  if (Array.isArray(value)) {
    return "array";
  }
  if (value === null) {
    return "null";
  }
  return typeof value;
}
