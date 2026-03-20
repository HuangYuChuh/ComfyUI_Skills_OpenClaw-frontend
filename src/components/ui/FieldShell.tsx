import type { ReactNode } from "react";

interface FieldShellProps {
  label?: ReactNode;
  htmlFor?: string;
  helpText?: ReactNode;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  noMargin?: boolean;
  children: ReactNode;
}

export function FieldShell({
  label,
  htmlFor,
  helpText,
  required = false,
  className = "",
  labelClassName = "",
  noMargin = false,
  children,
}: FieldShellProps) {
  return (
    <div className={`form-group field-shell ${noMargin ? "is-no-margin" : ""} ${className}`.trim()}>
      {label != null ? (
        <label htmlFor={htmlFor} className={`field-label ${labelClassName}`.trim()}>
          <span className="field-label-text">{label}</span>
          {required ? <span className="field-required" aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      {children}
      {helpText ? <p className="field-help">{helpText}</p> : null}
    </div>
  );
}
