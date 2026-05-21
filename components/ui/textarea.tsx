import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, maxLength, id, value, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide"
            >
              {label}
            </label>
            {maxLength && (
              <span className="text-xs tabular text-[var(--color-muted-foreground)]">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        <textarea
          id={inputId}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/50 transition-colors resize-none",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/50 focus:border-[var(--color-ring)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/50",
            className
          )}
          ref={ref}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-[var(--color-destructive)]">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
