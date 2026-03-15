// Simple Skeleton component as a replacement for @radix-ui/react-skeleton
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  variant?: "text" | "rect" | "circle";
  [key: string]: any;
}

export const Skeleton = ({
  className = "",
  height = 16,
  width = "100%",
  variant = "text",
  ...props
}: SkeletonProps) => {
  // Base styles for the skeleton
  const baseStyles = "animate-pulse bg-muted";

  // Variant-specific styles
  let variantStyles = "";
  if (variant === "text") {
    variantStyles = "h-4 rounded";
  } else if (variant === "rect") {
    variantStyles = "rounded";
  } else if (variant === "circle") {
    variantStyles = "h-[20px] w-[20px] rounded-full";
  }

  // Size styles
  let sizeStyles = "";
  if (typeof height === "number") {
    sizeStyles += `h-${height} `;
  } else {
    sizeStyles += `h-${height} `;
  }

  if (typeof width === "number") {
    sizeStyles += `w-${width}`;
  } else {
    sizeStyles += `w-${width}`;
  }

  return (
    <div
      className={cn(baseStyles, variantStyles, sizeStyles, className)}
      {...props}
    />
  );
};

interface SkeletonThemeProps {
  children: React.ReactNode;
  className?: string;
}

export const SkeletonTheme = ({
  children,
  className = "",
}: SkeletonThemeProps) => {
  return <div className={cn("space-y-4", className)}>{children}</div>;
};
