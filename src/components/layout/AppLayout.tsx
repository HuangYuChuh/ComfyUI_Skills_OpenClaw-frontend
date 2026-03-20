import type { ReactNode } from "react";

interface AppLayoutProps {
  header: ReactNode;
  children: ReactNode;
}

export function AppLayout({ header, children }: AppLayoutProps) {
  return (
    <main className="page shell">
      {header}
      {children}
    </main>
  );
}
