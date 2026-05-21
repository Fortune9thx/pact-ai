import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
        secondary:
          "border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-muted-foreground)]",
        funded:
          "border-[var(--color-status-funded)]/30 bg-[var(--color-status-funded)]/10 text-[var(--color-status-funded)]",
        disputed:
          "border-[var(--color-status-disputed)]/30 bg-[var(--color-status-disputed)]/10 text-[var(--color-status-disputed)]",
        resolved:
          "border-[var(--color-status-resolved)]/30 bg-[var(--color-status-resolved)]/10 text-[var(--color-status-resolved)]",
        destructive:
          "border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]",
        outline: "border-[var(--color-border)] text-[var(--color-foreground)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
