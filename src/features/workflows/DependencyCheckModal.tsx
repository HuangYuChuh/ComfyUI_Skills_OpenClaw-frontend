import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import type { DependencyReportDto, InstallReportDto } from "../../types/api";

interface DependencyCheckModalProps {
  open: boolean;
  report: DependencyReportDto | null;
  loading: boolean;
  installing: boolean;
  installReport: InstallReportDto | null;
  onClose: () => void;
  onInstall: (repoUrls: string[]) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export function DependencyCheckModal(props: DependencyCheckModalProps) {
  const { report, installReport } = props;
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());

  // Auto-select all installable repos when report changes
  const installableRepos = report?.missing_nodes
    .filter((n) => n.can_auto_install && n.source_repo)
    .map((n) => n.source_repo!) || [];
  const uniqueRepos = [...new Set(installableRepos)];

  // Initialize selection if empty
  if (selectedRepos.size === 0 && uniqueRepos.length > 0 && !installReport) {
    const initial = new Set(uniqueRepos);
    if (initial.size !== selectedRepos.size) {
      setSelectedRepos(initial);
    }
  }

  function toggleRepo(repo: string) {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repo)) {
        next.delete(repo);
      } else {
        next.add(repo);
      }
      return next;
    });
  }

  function handleInstall() {
    props.onInstall([...selectedRepos]);
  }

  if (!report) return null;

  const hasInstallResults = installReport !== null;
  const unresolvableNodes = report.missing_nodes.filter((n) => !n.can_auto_install);

  // Group missing nodes by repo for cleaner display
  const repoNodeMap = new Map<string, string[]>();
  for (const node of report.missing_nodes) {
    if (node.source_repo) {
      const existing = repoNodeMap.get(node.source_repo) || [];
      existing.push(node.class_type);
      repoNodeMap.set(node.source_repo, existing);
    }
  }

  return (
    <Modal
      open={props.open}
      title={props.t("dep_check_title")}
      onClose={props.onClose}
      width="wide"
      actions={
        hasInstallResults ? (
          <button type="button" className="btn btn-primary" onClick={props.onClose}>
            {props.t("confirm")}
          </button>
        ) : report.is_ready ? (
          <button type="button" className="btn btn-primary" onClick={props.onClose}>
            {props.t("confirm")}
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={props.onClose}>
              {props.t("dep_check_skip")}
            </button>
            {uniqueRepos.length > 0 && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={props.installing || selectedRepos.size === 0}
                onClick={handleInstall}
              >
                {props.installing ? props.t("dep_check_installing") : props.t("dep_check_install_selected")}
              </button>
            )}
          </>
        )
      }
    >
      {/* Summary */}
      <div className="dep-check-summary">
        {report.is_ready ? (
          <div className="dep-check-ready">
            <span className="dep-check-icon">✅</span>
            <span>{props.t("dep_check_all_ready")}</span>
          </div>
        ) : (
          <p className="dep-check-warning">{report.summary}</p>
        )}
      </div>

      {/* Install Results */}
      {hasInstallResults && (
        <section className="dep-check-section">
          <div className="section-header">
            <h4 className="card-title">{props.t("dep_check_install_results")}</h4>
          </div>
          <ul className="dep-check-list">
            {installReport.results.map((r) => (
              <li key={r.repo_url} className={`dep-check-item ${r.success ? "dep-check-item-ok" : "dep-check-item-fail"}`}>
                <span className="dep-check-item-icon">{r.success ? "✅" : "❌"}</span>
                <div className="dep-check-item-detail">
                  <span className="dep-check-item-name">{r.package_name}</span>
                  <span className="dep-check-item-msg">{r.message}</span>
                </div>
              </li>
            ))}
          </ul>
          {installReport.needs_restart && (
            <p className="dep-check-restart-hint">{props.t("dep_check_needs_restart")}</p>
          )}
        </section>
      )}

      {/* Missing Nodes (installable) */}
      {!hasInstallResults && uniqueRepos.length > 0 && (
        <section className="dep-check-section">
          <div className="section-header">
            <h4 className="card-title">{props.t("dep_check_missing_nodes")}</h4>
            <span className="section-meta">
              {props.t("dep_check_packages_count", { count: uniqueRepos.length })}
            </span>
          </div>
          <ul className="dep-check-list">
            {uniqueRepos.map((repo) => {
              const nodes = repoNodeMap.get(repo) || [];
              const node = report.missing_nodes.find((n) => n.source_repo === repo);
              return (
                <li key={repo} className="dep-check-item dep-check-item-installable">
                  <label className="dep-check-item-label">
                    <input
                      type="checkbox"
                      checked={selectedRepos.has(repo)}
                      onChange={() => toggleRepo(repo)}
                      disabled={props.installing}
                    />
                    <div className="dep-check-item-detail">
                      <span className="dep-check-item-name">{node?.package_name || repo.split("/").pop()}</span>
                      <span className="dep-check-item-nodes">
                        {nodes.length <= 3 ? nodes.join(", ") : `${nodes.slice(0, 3).join(", ")} +${nodes.length - 3}`}
                      </span>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Unresolvable Nodes */}
      {!hasInstallResults && unresolvableNodes.length > 0 && (
        <section className="dep-check-section">
          <div className="section-header">
            <h4 className="card-title">{props.t("dep_check_unknown_nodes")}</h4>
          </div>
          <ul className="dep-check-list">
            {unresolvableNodes.map((node) => (
              <li key={node.class_type} className="dep-check-item dep-check-item-unknown">
                <span className="dep-check-item-icon">⚠️</span>
                <span className="dep-check-item-name">{node.class_type}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Missing Models */}
      {!hasInstallResults && report.missing_models.length > 0 && (
        <section className="dep-check-section">
          <div className="section-header">
            <h4 className="card-title">{props.t("dep_check_missing_models")}</h4>
          </div>
          <ul className="dep-check-list">
            {report.missing_models.map((model) => (
              <li key={`${model.folder}-${model.filename}`} className="dep-check-item dep-check-item-model">
                <span className="dep-check-item-icon">📦</span>
                <div className="dep-check-item-detail">
                  <span className="dep-check-item-name">{model.filename}</span>
                  <span className="dep-check-item-msg">
                    {props.t("dep_check_model_folder", { folder: model.folder })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Modal>
  );
}
