import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white [&]:text-white hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-red-500 via-red-500 to-rose-500 text-white [&]:text-white hover:from-red-600 hover:via-red-600 hover:to-rose-600 shadow-lg shadow-red-500/25 hover:shadow-xl",
        outline:
          "border-2 border-blue-500/50 text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-500",
        secondary:
          "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700",
        ghost:
          "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100",
        link: "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline p-0 h-auto",
        accent:
          "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white [&]:text-white hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:-translate-y-0.5",
        success:
          "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white [&]:text-white hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5",
        premium:
          "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white [&]:text-white hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:-translate-y-0.5",
        subtle:
          "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 text-xs rounded-lg",
        lg: "h-13 px-8 text-base rounded-xl",
        xl: "h-14 px-10 text-lg rounded-xl",
        icon: "h-11 w-11 rounded-xl",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-lg": "h-13 w-13 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
