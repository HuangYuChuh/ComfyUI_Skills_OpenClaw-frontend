import { useState } from "react";
import { checkWorkflowDependencies, checkSavedWorkflowDependencies, installDependencies } from "../services/workflows";
import type { DependencyReportDto, InstallReportDto } from "../types/api";

export interface DependencyCheckState {
  open: boolean;
  loading: boolean;
  installing: boolean;
  report: DependencyReportDto | null;
  installReport: InstallReportDto | null;
}

function initialState(): DependencyCheckState {
  return {
    open: false,
    loading: false,
    installing: false,
    report: null,
    installReport: null,
  };
}

interface UseDependencyCheckArgs {
  pushToast: (type: "success" | "error" | "info", message: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export function useDependencyCheck(args: UseDependencyCheckArgs) {
  const [depCheckState, setDepCheckState] = useState<DependencyCheckState>(initialState());

  function closeDependencyCheckModal() {
    setDepCheckState(initialState());
  }

  async function handleCheckDependencies(serverId: string, workflowData: Record<string, unknown>) {
    setDepCheckState({ open: true, loading: true, installing: false, report: null, installReport: null });
    try {
      const response = await checkWorkflowDependencies(serverId, workflowData);
      setDepCheckState((s) => ({ ...s, loading: false, report: response.report }));
    } catch (error) {
      setDepCheckState((s) => ({ ...s, loading: false, open: false }));
      args.pushToast("error", error instanceof Error ? error.message : args.t("err_dep_check"));
    }
  }

  async function handleCheckSavedWorkflow(serverId: string, workflowId: string) {
    setDepCheckState({ open: true, loading: true, installing: false, report: null, installReport: null });
    try {
      const response = await checkSavedWorkflowDependencies(serverId, workflowId);
      setDepCheckState((s) => ({ ...s, loading: false, report: response.report }));
    } catch (error) {
      setDepCheckState((s) => ({ ...s, loading: false, open: false }));
      args.pushToast("error", error instanceof Error ? error.message : args.t("err_dep_check"));
    }
  }

  async function handleInstallDependencies(serverId: string, repoUrls: string[]) {
    setDepCheckState((s) => ({ ...s, installing: true }));
    try {
      const response = await installDependencies(serverId, repoUrls);
      setDepCheckState((s) => ({ ...s, installing: false, installReport: response.report }));
      const { succeeded, failed } = response.report.summary;
      if (failed === 0) {
        args.pushToast("success", args.t("dep_check_install_results") + `: ${succeeded} OK`);
      } else {
        args.pushToast("error", `${succeeded} succeeded, ${failed} failed`);
      }
    } catch (error) {
      setDepCheckState((s) => ({ ...s, installing: false }));
      args.pushToast("error", error instanceof Error ? error.message : args.t("err_dep_install"));
    }
  }

  return {
    depCheckState,
    closeDependencyCheckModal,
    handleCheckDependencies,
    handleCheckSavedWorkflow,
    handleInstallDependencies,
  };
}
