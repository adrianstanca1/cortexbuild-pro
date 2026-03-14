import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const LoadingSkeleton = ({
  className = "",
  height = 16,
  width = "100%",
  variant = "text",
  ...props
}: {
  className?: string;
  height?: number | string;
  width?: number | string;
  variant?: "text" | "rect" | "circle";
}) => {
  // Convert height/width/variant to appropriate className additions
  const sizeClass = 
    typeof height === "number" ? `h-${height}` : 
    typeof height === "string" ? `h-${height}` : 
    typeof width === "number" ? `w-${width}` : 
    typeof width === "string" ? `w-${width}` : 
    "";
  
  // Handle variant styling
  const variantClass =
    variant === "circle" ? "rounded-full" :
    variant === "rect" ? "rounded-md" :
    "rounded-md"; // default for text variant
    
  return (
    <Skeleton
      className={cn(
        "animate-pulse",
        sizeClass,
        variantClass,
        className
      )}
      {...props}
    />
  );
};

export const LoadingGrid = ({
  className = "",
  cols = 4,
  gap = 4,
  rows = 3,
}: {
  className?: string;
  cols?: number;
  gap?: number;
  rows?: number;
}) => {
  return (
    <div
      className={cn(
        "grid",
        `grid-cols-${cols}`,
        `gap-${gap}`,
        className
      )}
    >
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex flex-col">
          {[...Array(cols)].map((_, colIndex) => (
            <LoadingSkeleton
              key={`${rowIndex}-${colIndex}`}
              className="mb-2"
              height={12}
              width="100%"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const LoadingCard = ({
  className = "",
  title = true,
  content = true,
  actions = false,
}: {
  className?: string;
  title?: boolean;
  content?: boolean;
  actions?: boolean;
}) => {
  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      {title && (
        <div className="mb-4">
          <LoadingSkeleton className="w-32 h-4" />
          <LoadingSkeleton className="w-48 h-4 mt-2" />
        </div>
      )}
      {content && (
        <div className="space-y-3">
          <LoadingSkeleton className="w-64 h-4" />
          <LoadingSkeleton className="w-96 h-4" />
          <LoadingSkeleton className="w-80 h-4 mt-2" />
          <LoadingGrid cols={2} rows={2} className="mt-4" />
        </div>
      )}
      {actions && (
        <div className="mt-4 flex items-center gap-3">
          <LoadingSkeleton className="w-24 h-8" />
          <LoadingSkeleton className="w-32 h-8" />
        </div>
      )}
    </div>
  );
};
