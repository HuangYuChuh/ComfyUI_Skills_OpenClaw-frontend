import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldClassName?: string;
  textareaClassName?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { fieldClassName = "", textareaClassName = "", disabled, rows = 5, ...props },
  ref,
) {
  return (
    <div className={["field-control", "textarea-field", disabled ? "is-disabled" : "", fieldClassName].filter(Boolean).join(" ")}>
      <textarea
        {...props}
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={["field-textarea", textareaClassName].filter(Boolean).join(" ")}
      />
    </div>
  );
});
