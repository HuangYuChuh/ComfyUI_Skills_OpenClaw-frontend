import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { SectionPanel } from "../../components/layout/SectionPanel";
import { CheckboxField } from "../../components/ui/CheckboxField";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { FieldShell } from "../../components/ui/FieldShell";
import { Modal } from "../../components/ui/Modal";
import { SwitchField } from "../../components/ui/SwitchField";
import { TextField } from "../../components/ui/TextField";
import { getServerStatus, testServerConnection } from "../../services/servers";
import type { SaveServerPayload, ServerDto } from "../../types/api";
import { EditIcon, StatusDot, TrashIcon } from "./components/ServerManagerParts";
import {
  DEFAULT_COMFYUI_URL,
  buildServerOptions,
  getCurrentServerWarning,
  getSelectedServerLabel,
  getServerStatusLabel,
  type ServerRunStatus,
} from "./utils/serverManager";

interface ServerManagerProps {
  title?: string;
  subtitle?: string;
  servers: ServerDto[];
  currentServerId: string | null;
  onSelectServer: (serverId: string) => void;
  onToggleServer: (server: ServerDto, enabled: boolean) => void;
  onDeleteServer: (server: ServerDto) => void;
  onOpenCreate: () => void;
  onOpenEdit: (server: ServerDto) => void;
  modalOpen: boolean;
  modalMode: "add" | "edit";
  form: SaveServerPayload;
  onFormChange: (next: SaveServerPayload) => void;
  onCloseModal: () => void;
  onSubmitModal: (importAfterCreate?: boolean) => void | Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export function ServerManager(props: ServerManagerProps) {
  const currentServer = props.servers.find((server) => server.id === props.currentServerId) || null;
  const currentServerWarning = getCurrentServerWarning(currentServer, props.t);
  const selectedServerLabel = getSelectedServerLabel(currentServer);
  const serverOptions = buildServerOptions(props.servers, props.t);
  const serverIdInputRef = useRef<HTMLInputElement | null>(null);
  const serverNameInputRef = useRef<HTMLInputElement | null>(null);
  const hasSeededDefaultUrlRef = useRef(false);

  const [serverStatus, setServerStatus] = useState<ServerRunStatus>("checking");
  const [showAuth, setShowAuth] = useState(false);
  const [showComfyApiKey, setShowComfyApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ state: "idle" | "testing" | "online" | "offline"; message?: string }>({ state: "idle" });
  const [importAfterCreate, setImportAfterCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      if (!props.currentServerId) return;
      try {
        const result = await getServerStatus(props.currentServerId);
        if (!cancelled) setServerStatus(result.status);
      } catch {
        if (!cancelled) setServerStatus("offline");
      }
    }

    setServerStatus("checking");
    checkStatus();

    return () => {
      cancelled = true;
    };
  }, [props.currentServerId]);

  useEffect(() => {
    if (!props.modalOpen) {
      hasSeededDefaultUrlRef.current = false;
      setShowAuth(false);
      setTestResult({ state: "idle" });
      return;
    }
    if (hasSeededDefaultUrlRef.current) {
      return;
    }
    hasSeededDefaultUrlRef.current = true;
    if (props.modalMode === "add" && !props.form.url) {
      props.onFormChange({ ...props.form, url: DEFAULT_COMFYUI_URL });
    }
  }, [props.form, props.modalMode, props.modalOpen, props.onFormChange]);

  useEffect(() => {
    if (!props.modalOpen || props.modalMode !== "add") {
      setImportAfterCreate(false);
    }
  }, [props.modalMode, props.modalOpen]);

  function update<K extends keyof SaveServerPayload>(key: K, value: SaveServerPayload[K]) {
    props.onFormChange({ ...props.form, [key]: value });
  }

  function onInputChange<K extends keyof SaveServerPayload>(key: K) {
    return (event: ChangeEvent<HTMLInputElement>) => update(key, event.target.value as SaveServerPayload[K]);
  }

  const statusLabel = getServerStatusLabel(serverStatus, props.t);

  async function handleTestConnection() {
    const url = (props.form.url || "").trim();
    if (!url) {
      return;
    }
    setTestResult({ state: "testing" });
    try {
      const result = await testServerConnection(url, props.form.auth ?? "");
      setTestResult({ state: result.status, message: result.message });
    } catch {
      setTestResult({ state: "offline", message: "Request failed" });
    }
  }

  return (
    <SectionPanel
      title={props.t("server_manager")}
      titleId="server-manager-title"
      actions={(
        <button type="button" className="btn btn-secondary panel-action-btn" onClick={props.onOpenCreate}>
          {props.t("add_server_toggle")}
        </button>
      )}
    >
      {props.servers.length === 0 ? (
        <div className="server-empty-state">
          <p className="section-meta">{props.t("no_servers")}</p>
          <button type="button" className="btn btn-secondary" onClick={props.onOpenCreate}>
            {props.t("create_first_server")}
          </button>
        </div>
      ) : (
        <div className="server-config-container card card-nested">
          <div className="server-main-row">
            <div className="server-main-left">
              <div className="server-current-meta">
                <span className="section-meta server-current-badge">
                  <StatusDot status={serverStatus} />
                  {props.t("current_server_title")}
                  <span className="server-current-status">({statusLabel})</span>
                </span>
              </div>
              <div className="server-selector-wrapper">
                {props.servers.length === 1 ? (
                  <div className="server-selector-static" aria-label={props.t("select_server")}>
                    {selectedServerLabel}{currentServer?.unsupported ? ` ${props.t("server_unsupported_short")}` : ""}
                  </div>
                ) : (
                  <CustomSelect
                    value={props.currentServerId || ""}
                    options={serverOptions}
                    ariaLabel={props.t("select_server")}
                    className="is-server-select"
                    onChange={props.onSelectServer}
                  />
                )}
              </div>
              {currentServerWarning ? <p className="form-help">{currentServerWarning}</p> : null}
            </div>

            {currentServer ? (
              <div id="current-server-actions" className="server-header-controls">
                <div className="server-status-toggle server-visibility-group">
                  <SwitchField
                    checked={currentServer.enabled}
                    className="server-toggle-field"
                    onChange={(event) => props.onToggleServer(currentServer, event.target.checked)}
                    title={props.t("server_agent_visibility_hint")}
                    label={(
                      <span className={currentServer.enabled ? "status-on" : "status-off"}>
                        {currentServer.enabled ? props.t("server_agent_visible") : props.t("server_agent_hidden")}
                      </span>
                    )}
                  />
                </div>
                <div className="server-action-group">
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon server-action-btn"
                    aria-label={props.t("edit")}
                    onClick={() => props.onOpenEdit(currentServer)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon server-action-btn server-delete-btn"
                    aria-label={props.t("delete")}
                    onClick={() => props.onDeleteServer(currentServer)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <Modal
        open={props.modalOpen}
        title={props.modalMode === "edit" ? props.t("edit_server_modal_title") : props.t("add_server_modal_title")}
        onClose={props.onCloseModal}
        initialFocusRef={props.modalMode === "edit" ? serverNameInputRef : serverIdInputRef}
        footerStart={props.modalMode === "add" ? (
          <CheckboxField
            checked={importAfterCreate}
            onChange={(event) => setImportAfterCreate(event.target.checked)}
            className="server-modal-import-checkbox"
            label={props.t("server_import_after_create")}
          />
        ) : null}
        actions={(
          <>
            <button type="button" className="btn btn-secondary" onClick={props.onCloseModal}>{props.t("cancel")}</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void props.onSubmitModal(props.modalMode === "add" ? importAfterCreate : false);
              }}
            >
              {props.modalMode === "edit" ? props.t("save_server_changes") : props.t("save_and_connect")}
            </button>
          </>
        )}
      >
        <div className="modal-grid">
          <FieldShell
            label={props.t("server_id_label")}
            htmlFor="modal-server-id"
            helpText={props.t("server_id_help")}
            className="form-group-half"
          >
            <TextField
              ref={serverIdInputRef}
              id="modal-server-id"
              fieldClassName="modal-text-field"
              value={props.form.id ?? ""}
              disabled={props.modalMode === "edit"}
              onChange={onInputChange("id")}
              placeholder={props.t("new_server_id_placeholder")}
              autoComplete="off"
            />
          </FieldShell>
          <FieldShell
            label={props.t("server_name")}
            htmlFor="modal-server-name"
            helpText={props.t("server_name_help")}
            className="form-group-half"
          >
            <TextField
              ref={serverNameInputRef}
              id="modal-server-name"
              fieldClassName="modal-text-field"
              value={props.form.name}
              onChange={onInputChange("name")}
              placeholder={props.t("new_server_name_placeholder")}
              maxLength={32}
              autoComplete="off"
            />
          </FieldShell>
          <FieldShell
            label={props.t("server_url_label")}
            htmlFor="modal-server-url"
            helpText={props.t("server_url_help_comfyui")}
            className="form-group-full"
          >
            <TextField
              id="modal-server-url"
              fieldClassName="modal-text-field"
              value={props.form.url}
              onChange={onInputChange("url")}
              placeholder={props.t("new_server_url_placeholder")}
              autoComplete="off"
            />
          </FieldShell>
          <FieldShell
            label={props.t("server_auth_label")}
            htmlFor="modal-server-auth"
            helpText={props.t("server_auth_help")}
            className="form-group-full"
          >
            <TextField
                id="modal-server-auth"
                type={showAuth ? "text" : "password"}
                fieldClassName="modal-text-field"
                value={props.form.auth ?? ""}
                onChange={onInputChange("auth")}
                placeholder={props.t("server_auth_placeholder")}
                autoComplete="off"
                trailingAction={(
                  <button
                    type="button"
                    className="btn-icon input-toggle-btn"
                    onClick={() => setShowAuth((value) => !value)}
                    aria-label={showAuth ? "Hide token" : "Show token"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                      {!showAuth && <line x1="1" y1="1" x2="23" y2="23" />}
                    </svg>
                  </button>
                )}
              />
            <div className="form-test-connection">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleTestConnection}
                disabled={!props.form.url?.trim() || testResult.state === "testing"}
              >
                {testResult.state === "testing" ? props.t("server_test_testing") : props.t("server_test_connection")}
              </button>
              {testResult.state === "online" && (
                <span className="test-result test-result-ok">
                  <StatusDot status="online" />
                  {props.t("server_test_ok")}
                </span>
              )}
              {testResult.state === "offline" && (
                <span className="test-result test-result-fail">
                  <StatusDot status="offline" />
                  {props.t("server_test_fail")}{testResult.message ? ` - ${testResult.message}` : ""}
                </span>
              )}
            </div>
          </FieldShell>
          <FieldShell
            label={props.t("comfy_api_key_label")}
            htmlFor="modal-server-comfy-api-key"
            helpText={<>{props.t("comfy_api_key_help_prefix")}<a href="https://platform.comfy.org/login" target="_blank" rel="noopener noreferrer">{props.t("comfy_api_key_help_link")}</a>{props.t("comfy_api_key_help_suffix")}</>}
            className="form-group-full"
          >
            <TextField
                id="modal-server-comfy-api-key"
                type={showComfyApiKey ? "text" : "password"}
                fieldClassName="modal-text-field"
                value={props.form.comfy_api_key ?? ""}
                onChange={onInputChange("comfy_api_key")}
                placeholder={props.t("comfy_api_key_placeholder")}
                autoComplete="off"
                trailingAction={(
                  <button
                    type="button"
                    className="btn-icon input-toggle-btn"
                    onClick={() => setShowComfyApiKey((value) => !value)}
                    aria-label={showComfyApiKey ? "Hide API key" : "Show API key"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                      {!showComfyApiKey && <line x1="1" y1="1" x2="23" y2="23" />}
                    </svg>
                  </button>
                )}
              />
          </FieldShell>
          <FieldShell
            label={props.t("server_output_dir")}
            htmlFor="modal-server-output"
            className="form-group-full"
          >
            <TextField
              id="modal-server-output"
              fieldClassName="modal-text-field"
              value={props.form.output_dir}
              onChange={onInputChange("output_dir")}
              placeholder="./outputs"
              autoComplete="off"
            />
          </FieldShell>
        </div>
      </Modal>
    </SectionPanel>
  );
}
