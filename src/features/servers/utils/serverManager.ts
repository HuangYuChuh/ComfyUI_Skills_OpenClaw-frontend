import type { ServerDto } from "../../../types/api";

export type ServerRunStatus = "online" | "offline" | "checking";

export const DEFAULT_COMFYUI_URL = "http://127.0.0.1:8188";

export function buildServerOptions(
  servers: ServerDto[],
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  return servers.map((server) => ({
    value: server.id,
    label: `${server.name || server.id}${server.unsupported ? ` ${t("server_unsupported_short")}` : ""}`,
  }));
}

export function getCurrentServerWarning(
  server: ServerDto | null,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (!server?.unsupported) {
    return "";
  }
  return t("server_unsupported_reason", { type: server.server_type || "unknown" });
}

export function getSelectedServerLabel(server: ServerDto | null) {
  return server?.name || server?.id || "";
}

export function getServerStatusLabel(
  status: ServerRunStatus,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (status === "checking") {
    return "...";
  }
  return t(status === "online" ? "server_status_online" : "server_status_offline");
}
