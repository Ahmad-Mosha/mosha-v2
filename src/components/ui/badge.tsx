import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-800 text-zinc-300 border border-zinc-700/50",
        secondary:
          "bg-zinc-900 text-zinc-400 border border-zinc-800",
        outline:
          "text-zinc-400 border border-zinc-800 bg-transparent",
        accent:
          "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20",
        success:
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        warning:
          "bg-amber-500/10 text-amber-300 border border-amber-500/20",
        danger:
          "bg-rose-500/10 text-rose-400 border border-rose-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
