import type { ReactNode } from "react";

interface AppHeaderProps {
  leading?: ReactNode;
  badge?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function AppHeader({
  leading,
  badge,
  title,
  subtitle,
  actions,
  trailing,
  className = "",
}: AppHeaderProps) {
  return (
    <header className={`app-header ${className}`.trim()}>
      <div className="app-header-main">
        {leading ? <div className="app-header-leading">{leading}</div> : null}
        <div className="app-header-copy">
          {badge ? <p className="app-header-badge">{badge}</p> : null}
          <h1>{title}</h1>
          {subtitle ? <p className="subtitle app-header-subtitle">{subtitle}</p> : null}
        </div>
      </div>

      {(actions || trailing) ? (
        <div className="app-header-controls">
          {actions ? <div className="app-header-actions">{actions}</div> : null}
          {trailing ? <div className="app-header-trailing">{trailing}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
