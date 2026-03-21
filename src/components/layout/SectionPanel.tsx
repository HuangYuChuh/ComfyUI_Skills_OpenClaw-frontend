import type { ReactNode } from "react";

interface SectionPanelProps {
  title: ReactNode;
  titleId: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionPanel({
  title,
  titleId,
  meta,
  actions,
  children,
  className = "",
}: SectionPanelProps) {
  return (
    <section className={`card section-panel ${className}`.trim()} aria-labelledby={titleId}>
      <div className="section-header panel-toolbar">
        <div className="panel-title-wrap">
          <h2 id={titleId} className="card-title">{title}</h2>
        </div>
        {(meta || actions) ? <div className="panel-actions">{meta}{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
