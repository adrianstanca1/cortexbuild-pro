"use client";

import { ReactNode } from "react";
import { Sparkles, Clock, ArrowLeft } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
  features?: string[];
  backHref?: string;
  className?: string;
}

export function ComingSoon({
  title,
  description,
  icon,
  badge,
  features = [],
  backHref = "/dashboard",
  className,
}: ComingSoonProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[60vh] px-4 text-center",
        className,
      )}
    >
      {/* Icon bubble */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
          <div className="text-indigo-600 dark:text-indigo-400 w-9 h-9">
            {icon}
          </div>
        </div>
        {badge && (
          <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            <Sparkles className="h-2.5 w-2.5" />
            {badge}
          </span>
        )}
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h1>

      {/* Status pill */}
      <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
        <Clock className="h-3 w-3" />
        Coming Soon
      </div>

      {/* Description */}
      <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed mb-8">
        {description}
      </p>

      {/* Feature preview list */}
      {features.length > 0 && (
        <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-8 text-left">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            What&apos;s included
          </p>
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button variant="outline" asChild>
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
