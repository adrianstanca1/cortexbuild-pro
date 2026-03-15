import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 dark:from-blue-900/40 dark:to-cyan-900/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50",
        secondary:
          "bg-slate-100 text-slate-600 dark:bg-slate-700/80 dark:text-slate-300 border border-slate-200 dark:border-slate-600",
        destructive:
          "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 dark:from-red-900/40 dark:to-rose-900/40 dark:text-red-300 border border-red-200/50 dark:border-red-800/50",
        success:
          "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 dark:from-emerald-900/40 dark:to-green-900/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50",
        warning:
          "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50",
        info: "bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 dark:from-sky-900/40 dark:to-blue-900/40 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/50",
        outline:
          "border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800",
        purple:
          "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 dark:from-violet-900/40 dark:to-purple-900/40 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/50",
        orange:
          "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 dark:from-orange-900/40 dark:to-amber-900/40 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/50",
        premium:
          "bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 shadow-sm shadow-violet-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
