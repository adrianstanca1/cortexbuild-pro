"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { AnimatedCounter } from "./animated-counter";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  iconBgColor?: string;
  trend?: {
    value: number;
    label?: string;
  };
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  iconBgColor = "bg-primary",
  trend,
  suffix = "",
  prefix = "",
  className,
}: StatsCardProps) {
  const trendDirection = trend?.value
    ? trend.value > 0
      ? "up"
      : trend.value < 0
        ? "down"
        : "neutral"
    : "neutral";

  return (
    <Card className={cn("card-hover overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">
                {prefix}
                <AnimatedCounter value={value} />
                {suffix}
              </span>
            </div>
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trendDirection === "up" && "text-green-500",
                  trendDirection === "down" && "text-red-500",
                  trendDirection === "neutral" && "text-muted-foreground",
                )}
              >
                {trendDirection === "up" && <TrendingUp className="h-3 w-3" />}
                {trendDirection === "down" && (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trendDirection === "neutral" && <Minus className="h-3 w-3" />}
                <span>
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", iconBgColor)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact stats for inline display
export function CompactStat({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: number | string;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantClasses = {
    default: "bg-muted text-foreground",
    success: "bg-green-500/10 text-green-500",
    warning: "bg-amber-500/10 text-amber-500",
    danger: "bg-red-500/10 text-red-500",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        variantClasses[variant],
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="text-sm font-medium">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}

// Stats grid for multiple stats
export function StatsGrid({
  children,
  columns = 4,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}) {
  const colClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", colClasses[columns])}>{children}</div>
  );
}
