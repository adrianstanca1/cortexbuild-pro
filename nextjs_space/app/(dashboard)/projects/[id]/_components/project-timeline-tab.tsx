"use client";

import { useState, useMemo } from "react";
import {
  format,
  differenceInDays,
  isAfter,
  isBefore,
  addDays,
  startOfDay,
} from "date-fns";
import {
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Play,
  Pause,
  Flag,
  CircleDot,
  Milestone as MilestoneIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  type: "milestone" | "task" | "start" | "end";
  title: string;
  date: Date | string | null;
  status?: string;
  priority?: string;
  description?: string;
  percentComplete?: number;
}

interface ProjectTimelineTabProps {
  project: any;
  milestones: any[];
  tasks: any[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-green-500",
  OVERDUE: "bg-red-500",
  TODO: "bg-gray-500",
  REVIEW: "bg-purple-500",
  COMPLETE: "bg-green-500",
};

export function ProjectTimelineTab({
  project,
  milestones,
  tasks,
}: ProjectTimelineTabProps) {
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  // Calculate project progress
  const projectProgress = useMemo(() => {
    const totalTasks = tasks?.length || 0;
    const completedTasks =
      tasks?.filter((t) => t.status === "COMPLETE")?.length || 0;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [tasks]);

  // Build timeline items
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add project start
    if (project?.startDate) {
      items.push({
        id: "project-start",
        type: "start",
        title: "Project Start",
        date: project.startDate,
        status: "COMPLETED",
      });
    }

    // Add milestones
    milestones?.forEach((m) => {
      items.push({
        id: m.id,
        type: "milestone",
        title: m.name,
        date: m.targetDate,
        status: m.status,
        description: m.description,
        percentComplete: m.percentComplete,
      });
    });

    // Add key tasks (high/critical priority only)
    tasks
      ?.filter((t) => t.priority === "HIGH" || t.priority === "CRITICAL")
      ?.forEach((t) => {
        if (t.dueDate) {
          items.push({
            id: t.id,
            type: "task",
            title: t.title,
            date: t.dueDate,
            status: t.status,
            priority: t.priority,
            description: t.description,
          });
        }
      });

    // Add project end
    if (project?.endDate) {
      items.push({
        id: "project-end",
        type: "end",
        title: "Project Completion",
        date: project.endDate,
        status: project.status === "COMPLETED" ? "COMPLETED" : "PENDING",
      });
    }

    // Sort by date
    return items.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [project, milestones, tasks]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!project?.endDate) return null;
    const today = startOfDay(new Date());
    const end = startOfDay(new Date(project.endDate));
    return differenceInDays(end, today);
  }, [project]);

  // Calculate overall timeline progress
  const timelineProgress = useMemo(() => {
    if (!project?.startDate || !project?.endDate) return 0;
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    const now = Date.now();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }, [project]);

  const getItemIcon = (item: TimelineItem) => {
    switch (item.type) {
      case "start":
        return <Play className="h-4 w-4" />;
      case "end":
        return <Flag className="h-4 w-4" />;
      case "milestone":
        return <MilestoneIcon className="h-4 w-4" />;
      case "task":
        return <CircleDot className="h-4 w-4" />;
      default:
        return <CircleDot className="h-4 w-4" />;
    }
  };

  const isItemOverdue = (item: TimelineItem) => {
    if (!item.date) return false;
    if (item.status === "COMPLETED" || item.status === "COMPLETE") return false;
    return isBefore(new Date(item.date), startOfDay(new Date()));
  };

  const isItemToday = (item: TimelineItem) => {
    if (!item.date) return false;
    const itemDate = startOfDay(new Date(item.date));
    const today = startOfDay(new Date());
    return itemDate.getTime() === today.getTime();
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Timeline Progress
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {timelineProgress}%
                </p>
              </div>
            </div>
            <Progress value={timelineProgress} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks Complete</p>
                <p className="text-2xl font-bold text-foreground">
                  {projectProgress}%
                </p>
              </div>
            </div>
            <Progress value={projectProgress} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Milestones</p>
                <p className="text-2xl font-bold text-foreground">
                  {milestones?.filter((m) => m.status === "COMPLETED")
                    ?.length || 0}
                  /{milestones?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  daysRemaining && daysRemaining < 0
                    ? "bg-red-500/10"
                    : daysRemaining && daysRemaining < 14
                      ? "bg-amber-500/10"
                      : "bg-green-500/10",
                )}
              >
                <Clock
                  className={cn(
                    "h-5 w-5",
                    daysRemaining && daysRemaining < 0
                      ? "text-red-500"
                      : daysRemaining && daysRemaining < 14
                        ? "text-amber-500"
                        : "text-green-500",
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <p className="text-2xl font-bold text-foreground">
                  {daysRemaining !== null
                    ? daysRemaining < 0
                      ? `${Math.abs(daysRemaining)} overdue`
                      : daysRemaining
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineItems.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                No timeline items to display
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Add project dates and milestones to see the timeline
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {timelineItems.map((item, index) => {
                  const isOverdue = isItemOverdue(item);
                  const isToday = isItemToday(item);
                  const isCompleted =
                    item.status === "COMPLETED" || item.status === "COMPLETE";

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "relative flex items-start gap-4 pl-12 cursor-pointer",
                        "transition-all hover:bg-muted/50 rounded-lg p-2 -ml-2",
                        selectedItem?.id === item.id && "bg-muted/50",
                      )}
                      onClick={() => setSelectedItem(item)}
                    >
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          "absolute left-4 w-5 h-5 rounded-full flex items-center justify-center",
                          "-translate-x-1/2 z-10",
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isOverdue
                              ? "bg-red-500 text-white"
                              : isToday
                                ? "bg-blue-500 text-white ring-4 ring-blue-500/20"
                                : "bg-muted border-2 border-border",
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          getItemIcon(item)
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "font-medium",
                              isCompleted
                                ? "text-muted-foreground line-through"
                                : "text-foreground",
                            )}
                          >
                            {item.title}
                          </span>
                          <Badge
                            variant={
                              item.type === "milestone"
                                ? "default"
                                : item.type === "task"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {item.type}
                          </Badge>
                          {item.priority === "CRITICAL" && (
                            <Badge variant="destructive" className="text-xs">
                              Critical
                            </Badge>
                          )}
                          {item.priority === "HIGH" && (
                            <Badge variant="warning" className="text-xs">
                              High
                            </Badge>
                          )}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                          {isToday && (
                            <Badge variant="info" className="text-xs">
                              Today
                            </Badge>
                          )}
                        </div>
                        {item.date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(item.date), "EEEE, MMMM d, yyyy")}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.percentComplete !== undefined && (
                          <div className="mt-2 flex items-center gap-2">
                            <Progress
                              value={item.percentComplete}
                              className="h-2 flex-1 max-w-32"
                            />
                            <span className="text-xs text-muted-foreground">
                              {item.percentComplete}%
                            </span>
                          </div>
                        )}
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Items Alert */}
      {timelineItems.some(isItemOverdue) && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">Overdue Items</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {timelineItems.filter(isItemOverdue).length} item(s) are past
                  their due date:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {timelineItems.filter(isItemOverdue).map((item) => (
                    <li key={item.id} className="text-sm text-foreground">
                      {item.title}
                      <span className="text-muted-foreground">
                        {item.date &&
                          ` (due ${format(new Date(item.date), "MMM d")})`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
