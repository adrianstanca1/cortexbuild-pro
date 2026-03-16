"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  FolderKanban, ListTodo, Users, FileText, 
  FileQuestion, Shield, 
  Clock, Search, Plus
} from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "py-8 px-4",
    icon: "h-10 w-10",
    title: "text-base",
    description: "text-sm"
  },
  md: {
    container: "py-12 px-6",
    icon: "h-14 w-14",
    title: "text-lg",
    description: "text-sm"
  },
  lg: {
    container: "py-16 px-8",
    icon: "h-20 w-20",
    title: "text-xl",
    description: "text-base"
  }
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
    >
      {/* Decorative background circles */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl scale-150" />
        <div className="relative p-4 bg-muted/50 rounded-full">
          <div className="p-3 bg-background rounded-full shadow-sm border border-border">
            {icon || <FolderKanban className={cn(sizes.icon, "text-muted-foreground")} />}
          </div>
        </div>
      </div>

      <h3 className={cn("font-semibold text-foreground mb-2", sizes.title)}>
        {title}
      </h3>
      <p className={cn("text-muted-foreground max-w-md mb-6", sizes.description)}>
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button onClick={action.onClick} variant="accent">
              {action.icon || <Plus className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="ghost">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common modules
export function NoProjectsEmpty({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <EmptyState
      icon={<FolderKanban className="h-14 w-14 text-primary" />}
      title="No projects yet"
      description="Create your first project to start managing construction tasks, RFIs, documents, and more."
      action={{ label: "Create Project", onClick: onCreateProject }}
    />
  );
}

export function NoTasksEmpty({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <EmptyState
      icon={<ListTodo className="h-14 w-14 text-green-500" />}
      title="No tasks found"
      description="Create tasks to track work items, assign team members, and monitor progress."
      action={{ label: "Create Task", onClick: onCreateTask }}
    />
  );
}

export function NoSearchResultsEmpty({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-14 w-14 text-muted-foreground" />}
      title={`No results for "${query}"`}
      description="Try adjusting your search terms or filters to find what you're looking for."
      action={{ label: "Clear Search", onClick: onClear, icon: null }}
      size="sm"
    />
  );
}

export function NoTeamMembersEmpty({ onInvite }: { onInvite: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-14 w-14 text-purple-500" />}
      title="No team members"
      description="Invite team members to collaborate on projects and share workload."
      action={{ label: "Invite Member", onClick: onInvite }}
    />
  );
}

export function NoDocumentsEmpty({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="h-14 w-14 text-blue-500" />}
      title="No documents uploaded"
      description="Upload project documents, drawings, specifications, and more for easy access."
      action={{ label: "Upload Document", onClick: onUpload }}
    />
  );
}

export function NoRFIsEmpty({ onCreateRFI }: { onCreateRFI: () => void }) {
  return (
    <EmptyState
      icon={<FileQuestion className="h-14 w-14 text-orange-500" />}
      title="No RFIs created"
      description="Create Requests for Information to clarify project details and track responses."
      action={{ label: "Create RFI", onClick: onCreateRFI }}
    />
  );
}

export function NoSafetyIncidentsEmpty() {
  return (
    <EmptyState
      icon={<Shield className="h-14 w-14 text-green-500" />}
      title="No safety incidents"
      description="Great news! There are no safety incidents recorded. Keep up the safe work practices."
      size="sm"
    />
  );
}

export function NoActivityEmpty() {
  return (
    <EmptyState
      icon={<Clock className="h-14 w-14 text-muted-foreground" />}
      title="No recent activity"
      description="Activity will appear here as you and your team work on projects."
      size="sm"
    />
  );
}
