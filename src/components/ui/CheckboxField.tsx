import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  description?: ReactNode;
  indeterminate?: boolean;
  className?: string;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(function CheckboxField(
  { id, label, description, indeterminate = false, className = "", disabled, ...props },
  ref,
) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  function setRef(node: HTMLInputElement | null) {
    inputRef.current = node;
    if (typeof ref === "function") {
      ref(node);
      return;
    }
    if (ref) {
      ref.current = node;
    }
  }

  return (
    <label htmlFor={inputId} className={["checkbox-field", disabled ? "is-disabled" : "", className].filter(Boolean).join(" ")}>
      <input
        {...props}
        ref={setRef}
        id={inputId}
        type="checkbox"
        disabled={disabled}
        className="checkbox-field-input"
      />
      <span className="checkbox-field-control" aria-hidden="true" />
      {label != null || description != null ? (
        <span className="checkbox-field-copy">
          {label != null ? <span className="checkbox-field-label">{label}</span> : null}
          {description != null ? <span className="checkbox-field-description">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
});
