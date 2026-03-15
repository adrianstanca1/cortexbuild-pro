"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface KPICardProps {
  title: string;
  icon: ReactNode;
  metrics: {
    label: string;
    value: string | number;
    status?: "success" | "warning" | "danger" | "neutral" | "info";
  }[];
  link?: {
    href: string;
    label: string;
  };
  variant?: "default" | "alert" | "success";
  className?: string;
}

const statusIcons: Record<string, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4" />,
  warning: <Clock className="h-4 w-4" />,
  danger: <XCircle className="h-4 w-4" />,
  info: <AlertTriangle className="h-4 w-4" />,
  neutral: null,
};

const statusColors: Record<string, string> = {
  success:
    "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
  warning:
    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
  danger: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
  info: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  neutral: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800",
};

const cardVariants = {
  default: "border-slate-200 dark:border-slate-700",
  alert:
    "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10",
  success:
    "border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10",
};

export function KPICard({
  title,
  icon,
  metrics,
  link,
  variant = "default",
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white dark:bg-slate-800 p-6 transition-all duration-300 hover:shadow-md",
        cardVariants[variant],
        className,
      )}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {icon}
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {metric.label}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
                statusColors[metric.status || "neutral"],
              )}
            >
              {metric.status && statusIcons[metric.status]}
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      {link && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
          <Link
            href={link.href}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {link.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// Quick actions component
interface QuickActionProps {
  icon: ReactNode;
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}

export function QuickAction({
  icon,
  label,
  href,
  variant = "secondary",
}: QuickActionProps) {
  const variants = {
    primary:
      "bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
    secondary:
      "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50",
  };

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5",
        variants[variant],
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

// Alert banner for critical items
interface AlertBannerProps {
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

const alertStyles = {
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-amber-800 dark:text-amber-200",
  },
  danger: {
    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    text: "text-red-800 dark:text-red-200",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-800 dark:text-blue-200",
  },
};

export function AlertBanner({
  type,
  title,
  message,
  action,
  className,
}: AlertBannerProps) {
  const style = alertStyles[type];

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-xl border",
        style.bg,
        className,
      )}
    >
      <AlertTriangle
        className={cn("h-5 w-5 flex-shrink-0 mt-0.5", style.icon)}
      />
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", style.text)}>{title}</p>
        <p className={cn("text-sm mt-1 opacity-80", style.text)}>{message}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn(
            "text-sm font-medium hover:underline flex-shrink-0",
            style.text,
          )}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

// Progress ring component
interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  color = "stroke-primary",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100 dark:stroke-slate-700"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}%
        </span>
        {label && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
