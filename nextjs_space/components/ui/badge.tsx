import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#5f46e5] text-[#ffffff]",
        secondary: "bg-[#e2e8f0] text-[#1e293b]",
        destructive: "bg-[#fee2e2] text-[#991b1b]",
        success: "bg-[#dcfce7] text-[#166534]",
        warning: "bg-[#fef3c7] text-[#92400e]",
        info: "bg-[#dbeafe] text-[#1e40af]",
        outline: "border border-[#94a3b8] text-[#334155] bg-[#ffffff]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
