import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  fieldClassName?: string;
  inputClassName?: string;
  trailingAction?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { fieldClassName = "", inputClassName = "", trailingAction, disabled, type = "text", ...props },
  ref,
) {
  return (
    <div
      className={[
        "field-control",
        "text-field",
        trailingAction ? "has-trailing" : "",
        disabled ? "is-disabled" : "",
        fieldClassName,
      ].filter(Boolean).join(" ")}
    >
      <input
        {...props}
        ref={ref}
        disabled={disabled}
        type={type}
        className={["field-input", inputClassName].filter(Boolean).join(" ")}
      />
      {trailingAction ? <div className="field-control-trailing">{trailingAction}</div> : null}
    </div>
  );
});
