import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

interface SwitchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export const SwitchField = forwardRef<HTMLInputElement, SwitchFieldProps>(function SwitchField(
  { id, label, description, className = "", disabled, ariaLabel, ...props },
  ref,
) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  return (
    <label htmlFor={inputId} className={["switch-field", disabled ? "is-disabled" : "", className].filter(Boolean).join(" ")}>
      {label != null || description != null ? (
        <span className="switch-field-copy">
          {label != null ? <span className="switch-field-label">{label}</span> : null}
          {description != null ? <span className="switch-field-description">{description}</span> : null}
        </span>
      ) : null}
      <span className="switch-field-control">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          aria-label={ariaLabel}
          className="switch-input"
        />
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
      </span>
    </label>
  );
});
