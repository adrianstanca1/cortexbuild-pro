"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  bgColor?: string;
  children?: React.ReactNode;
}

const colorClasses = {
  primary: "stroke-primary",
  success: "stroke-green-500",
  warning: "stroke-amber-500",
  danger: "stroke-red-500",
  info: "stroke-blue-500"
};

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  showLabel = true,
  color = "primary",
  bgColor = "stroke-muted",
  children
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={bgColor}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(colorClasses[color], "transition-all duration-500 ease-out")}
        />
      </svg>
      {(showLabel || children) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children || (
            <span className="text-2xl font-bold text-foreground">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Animated stats card with progress ring
interface StatsRingCardProps {
  label: string;
  value: number;
  total: number;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  icon?: React.ReactNode;
  suffix?: string;
}

export function StatsRingCard({
  label,
  value,
  total,
  color = "primary",
  icon,
  suffix = ""
}: StatsRingCardProps) {
  const progress = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
      <ProgressRing progress={progress} size={80} strokeWidth={6} color={color} showLabel={false}>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </ProgressRing>
      <div>
        <p className="text-2xl font-bold text-foreground">
          {value}{suffix} <span className="text-sm font-normal text-muted-foreground">/ {total}</span>
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% complete</p>
      </div>
    </div>
  );
}

// Mini progress indicator
export function MiniProgress({
  progress,
  color = "primary",
  className
}: {
  progress: number;
  color?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full bg-muted rounded-full overflow-hidden", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          color === "primary" && "bg-primary",
          color === "success" && "bg-green-500",
          color === "warning" && "bg-amber-500",
          color === "danger" && "bg-red-500",
          color === "info" && "bg-blue-500"
        )}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
