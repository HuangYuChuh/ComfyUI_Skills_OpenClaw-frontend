import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { EditorPage } from "./EditorPage";
import type { AppController } from "../app/useAppController";

interface AppRoutesProps {
  controller: AppController;
}

export function AppRoutes({ controller }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage controller={controller} />} />
      <Route path="/editor/new" element={<EditorPage controller={controller} />} />
      <Route path="/editor/:serverId/:workflowId" element={<EditorPage controller={controller} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
