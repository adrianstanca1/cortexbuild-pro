'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskCard, TaskDetailDialog } from '@/components/ui/task-card';
import { Loader2 } from 'lucide-react';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETE';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate?: string | Date | null;
  assignee?: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  };
  _count?: {
    comments: number;
  };
}

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: string) => void;
  isLoading?: boolean;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'REVIEW', title: 'Review', color: 'bg-yellow-500' },
  { id: 'COMPLETE', title: 'Complete', color: 'bg-green-500' },
];

export function KanbanBoard({ tasks, onStatusChange, isLoading }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      onStatusChange(draggedTask.id, status);
    }
    setDraggedTask(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <Card
              key={column.id}
              className="min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {columnTasks.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 py-8 border-2 border-dashed rounded-lg">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className={draggedTask?.id === task.id ? 'opacity-50' : ''}
                    >
                      <TaskCard
                        task={task}
                        onOpenDetail={setSelectedTask}
                        showProject
                        isDraggable
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TaskDetailDialog
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={(taskId, status) => {
          onStatusChange(taskId, status);
          if (selectedTask) {
            setSelectedTask({ ...selectedTask, status: status as TaskStatus });
          }
        }}
      />
    </>
  );
}
