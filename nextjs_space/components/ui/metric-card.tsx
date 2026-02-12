"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variants = {
  default: {
    bg: "bg-white dark:bg-slate-800",
    iconBg: "bg-slate-100 dark:bg-slate-700",
    iconColor: "text-slate-600 dark:text-slate-300",
    accent: "from-slate-500 to-slate-600"
  },
  primary: {
    bg: "bg-white dark:bg-slate-800",
    iconBg: "bg-primary/10 dark:bg-primary/20",
    iconColor: "text-primary",
    accent: "from-primary to-purple-600"
  },
  success: {
    bg: "bg-white dark:bg-slate-800",
    iconBg: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
    accent: "from-green-500 to-emerald-600"
  },
  warning: {
    bg: "bg-white dark:bg-slate-800",
    iconBg: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    accent: "from-amber-500 to-orange-600"
  },
  danger: {
    bg: "bg-white dark:bg-slate-800",
    iconBg: "bg-red-50 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    accent: "from-red-500 to-rose-600"
  },
  info: {
    bg: "bg-white dark:bg-slate-800",
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    accent: "from-blue-500 to-cyan-600"
  }
};

const sizes = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8"
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  size = "md",
  className
}: MetricCardProps) {
  const style = variants[variant];
  
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-4 w-4" />;
    if (trend.value < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };
  
  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
    if (trend.value < 0) return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
    return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800";
  };
  
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
        style.bg,
        sizes[size],
        className
      )}
    >
      {/* Gradient accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", style.accent)} />
      
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
          {trend && (
            <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", getTrendColor())}>
              {getTrendIcon()}
              <span>{trend.value > 0 ? "+" : ""}{trend.value}%</span>
              {trend.label && <span className="text-slate-500 dark:text-slate-400 ml-1">{trend.label}</span>}
            </div>
          )}
        </div>
        
        {icon && (
          <div className={cn("p-3 rounded-xl", style.iconBg)}>
            <div className={style.iconColor}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact metric for KPI grids
interface CompactMetricProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  status?: "success" | "warning" | "danger" | "info" | "neutral";
  className?: string;
}

const statusColors = {
  success: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
  neutral: "text-slate-600 dark:text-slate-400"
};

export function CompactMetric({ label, value, icon, status = "neutral", className }: CompactMetricProps) {
  return (
    <div className={cn("flex items-center justify-between py-3", className)}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <span className={cn("font-semibold", statusColors[status])}>{value}</span>
    </div>
  );
}

// Section header for metric groups
interface MetricSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MetricSection({ title, description, action, children, className }: MetricSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
