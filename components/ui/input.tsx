import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, prefix, suffix, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-[var(--color-muted-foreground)] pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            id={inputId}
            className={cn(
              "flex h-9 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/50 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/50 focus:border-[var(--color-ring)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              prefix && "pl-9",
              suffix && "pr-9",
              error && "border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/50",
              className
            )}
            ref={ref}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-[var(--color-muted-foreground)] pointer-events-none text-xs">
              {suffix}
            </div>
          )}
        </div>
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
Input.displayName = "Input";

export { Input };
