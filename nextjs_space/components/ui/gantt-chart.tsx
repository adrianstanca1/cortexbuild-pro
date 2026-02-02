"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  format, differenceInDays, addDays, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isWeekend, parseISO, isBefore, isAfter
} from "date-fns";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface GanttItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  type: "task" | "milestone" | "project";
  status?: string;
  assignee?: string;
  dependencies?: string[];
  color?: string;
}

interface GanttChartProps {
  items: GanttItem[];
  onItemClick?: (item: GanttItem) => void;
}

const statusColors: Record<string, string> = {
  TODO: "bg-gray-400",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-amber-500",
  COMPLETE: "bg-green-500",
  COMPLETED: "bg-green-500",
  NOT_STARTED: "bg-gray-400",
  DELAYED: "bg-red-500",
  AT_RISK: "bg-orange-500",
  PLANNING: "bg-purple-400",
  ON_HOLD: "bg-yellow-500"
};

export function GanttChart({ items, onItemClick }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<"day" | "week" | "month">("week");
  const [viewStart, setViewStart] = useState(() => {
    const minDate = items.reduce((min, item) => {
      const d = parseISO(item.startDate);
      return d < min ? d : min;
    }, new Date());
    return startOfMonth(minDate);
  });

  // Calculate date range
  const dateRange = useMemo(() => {
    if (items.length === 0) {
      return { start: new Date(), end: addDays(new Date(), 30), days: [] };
    }

    let minDate = new Date();
    let maxDate = new Date();

    items.forEach(item => {
      const start = parseISO(item.startDate);
      const end = parseISO(item.endDate);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    });

    // Add padding
    minDate = addDays(minDate, -7);
    maxDate = addDays(maxDate, 14);

    return {
      start: minDate,
      end: maxDate,
      days: eachDayOfInterval({ start: minDate, end: maxDate })
    };
  }, [items]);

  const cellWidth = zoom === "day" ? 40 : zoom === "week" ? 20 : 8;
  const totalWidth = dateRange.days.length * cellWidth;

  const getBarPosition = (item: GanttItem) => {
    const startDate = parseISO(item.startDate);
    const endDate = parseISO(item.endDate);
    const left = differenceInDays(startDate, dateRange.start) * cellWidth;
    const width = Math.max((differenceInDays(endDate, startDate) + 1) * cellWidth, 20);
    return { left, width };
  };

  const navigateView = (direction: "prev" | "next") => {
    const amount = zoom === "day" ? 7 : zoom === "week" ? 30 : 90;
    setViewStart(addDays(viewStart, direction === "prev" ? -amount : amount));
  };

  // Group days by month for header
  const monthHeaders = useMemo(() => {
    const months: { month: string; startIndex: number; count: number }[] = [];
    let currentMonth = "";
    let startIndex = 0;
    let count = 0;

    dateRange.days.forEach((day, index) => {
      const monthKey = format(day, "MMM yyyy");
      if (monthKey !== currentMonth) {
        if (currentMonth) {
          months.push({ month: currentMonth, startIndex, count });
        }
        currentMonth = monthKey;
        startIndex = index;
        count = 1;
      } else {
        count++;
      }
    });
    if (currentMonth) {
      months.push({ month: currentMonth, startIndex, count });
    }
    return months;
  }, [dateRange.days]);

  return (
    <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateView("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewStart(startOfMonth(new Date()))}>
            <Calendar className="h-4 w-4 mr-1" /> Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateView("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={zoom === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setZoom("day")}
          >
            Day
          </Button>
          <Button
            variant={zoom === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setZoom("week")}
          >
            Week
          </Button>
          <Button
            variant={zoom === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setZoom("month")}
          >
            Month
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Left panel - Item names */}
        <div className="w-[200px] flex-shrink-0 border-r">
          <div className="h-[60px] border-b bg-gray-50 dark:bg-gray-800 flex items-end p-2">
            <span className="text-sm font-medium text-gray-600">Tasks / Milestones</span>
          </div>
          {items.map((item, index) => (
            <div
              key={item.id}
              className="h-[40px] border-b flex items-center px-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => onItemClick?.(item)}
            >
              <div className="truncate">
                <span className="text-sm font-medium">{item.name}</span>
                {item.assignee && (
                  <span className="text-xs text-gray-500 ml-2">{item.assignee}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right panel - Timeline */}
        <ScrollArea className="flex-1" ref={containerRef}>
          <div style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Month headers */}
            <div className="h-[30px] border-b bg-gray-50 dark:bg-gray-800 flex">
              {monthHeaders.map((mh, i) => (
                <div
                  key={i}
                  className="border-r text-xs font-medium text-gray-600 flex items-center justify-center"
                  style={{ width: mh.count * cellWidth, left: mh.startIndex * cellWidth }}
                >
                  {mh.month}
                </div>
              ))}
            </div>

            {/* Day headers */}
            <div className="h-[30px] border-b bg-gray-50 dark:bg-gray-800 flex">
              {dateRange.days.map((day, i) => {
                const isWknd = isWeekend(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={i}
                    className={`flex-shrink-0 border-r text-[10px] flex items-center justify-center ${
                      isWknd ? "bg-gray-100 dark:bg-gray-700" : ""
                    } ${isToday ? "bg-blue-100 dark:bg-blue-900" : ""}`}
                    style={{ width: cellWidth }}
                  >
                    {zoom === "day" ? format(day, "d") : zoom === "week" && i % 7 === 0 ? format(day, "d") : ""}
                  </div>
                );
              })}
            </div>

            {/* Timeline rows */}
            {items.map((item, index) => {
              const { left, width } = getBarPosition(item);
              const barColor = item.color || statusColors[item.status || "TODO"] || "bg-blue-500";

              return (
                <div key={item.id} className="h-[40px] border-b relative flex items-center">
                  {/* Grid lines */}
                  {dateRange.days.map((day, i) => {
                    const isWknd = isWeekend(day);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <div
                        key={i}
                        className={`absolute top-0 bottom-0 border-r ${
                          isWknd ? "bg-gray-50 dark:bg-gray-800/50" : ""
                        } ${isToday ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                        style={{ left: i * cellWidth, width: cellWidth }}
                      />
                    );
                  })}

                  {/* Bar */}
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`absolute h-[24px] rounded cursor-pointer group ${
                      item.type === "milestone" ? "" : barColor
                    }`}
                    style={{
                      left,
                      width: item.type === "milestone" ? 16 : width,
                      transformOrigin: "left"
                    }}
                    onClick={() => onItemClick?.(item)}
                  >
                    {item.type === "milestone" ? (
                      <div className={`w-4 h-4 rotate-45 ${barColor} mx-auto mt-1`} />
                    ) : (
                      <>
                        {/* Progress overlay */}
                        <div
                          className="absolute inset-0 rounded opacity-30 bg-black"
                          style={{ width: `${100 - item.progress}%`, right: 0, left: "auto" }}
                        />
                        {/* Label */}
                        <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                          <span className="text-xs text-white font-medium truncate">
                            {width > 60 ? item.name : ""}
                          </span>
                        </div>
                        {/* Progress text */}
                        {width > 40 && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-white/80">
                            {item.progress}%
                          </div>
                        )}
                      </>
                    )}

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        <p className="font-medium">{item.name}</p>
                        <p>{format(parseISO(item.startDate), "MMM d")} - {format(parseISO(item.endDate), "MMM d")}</p>
                        <p>{item.progress}% complete</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Legend */}
      <div className="p-3 border-t bg-gray-50 dark:bg-gray-800 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span>Not Started</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Delayed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rotate-45 bg-purple-500" />
          <span>Milestone</span>
        </div>
      </div>
    </div>
  );
}

export default GanttChart;
