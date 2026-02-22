'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  MessageSquare,
  User,
  Clock,
  AlertCircle,
  Send,
  Loader2
} from 'lucide-react';

interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETE';
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

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: string) => void;
  onOpenDetail?: (task: Task) => void;
  showProject?: boolean;
  isDraggable?: boolean;
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const statusColors = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  COMPLETE: 'bg-green-100 text-green-700',
};

export function TaskCard({ task, onStatusChange, onOpenDetail, showProject = false, isDraggable = false }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETE';

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={() => onOpenDetail?.(task)}
      draggable={isDraggable}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            <Badge className={priorityColors[task.priority]} variant="secondary">
              {task.priority}
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
          )}
          
          {showProject && task.project && (
            <div className="text-xs text-gray-700 font-medium">
              📁 {task.project.name}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {task.assignee ? (
                <div className="flex items-center gap-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                      {task.assignee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-600">{task.assignee.name.split(' ')[0]}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  <User className="h-4 w-4" />
                  <span className="text-xs">Unassigned</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {task._count?.comments ? (
                <div className="flex items-center gap-1 text-gray-600">
                  <MessageSquare className="h-3 w-3" />
                  <span className="text-xs">{task._count.comments}</span>
                </div>
              ) : null}
              
              {task.dueDate && (
                <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                  {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {format(new Date(task.dueDate), 'MMM d')}
                </div>
              )}
            </div>
          </div>
          
          {onStatusChange && (
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={task.status}
                onValueChange={(value) => onStatusChange(task.id, value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (taskId: string, status: string) => void;
}

export function TaskDetailDialog({ task, isOpen, onClose, onStatusChange }: TaskDetailDialogProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    if (!task) return;
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!task || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        const comment = await res.json();
        setComments([...comments, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch comments when dialog opens
  if (isOpen && task && comments.length === 0 && !isLoadingComments) {
    fetchComments();
  }

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8">{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Task Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              {onStatusChange ? (
                <Select
                  value={task.status}
                  onValueChange={(value) => onStatusChange(task.id, value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="COMPLETE">Complete</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={`mt-1 ${statusColors[task.status]}`}>{task.status.replace('_', ' ')}</Badge>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Priority</label>
              <Badge className={`mt-1 block w-fit ${priorityColors[task.priority]}`}>{task.priority}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Assignee</label>
              <p className="mt-1 text-sm">{task.assignee?.name || 'Unassigned'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Due Date</label>
              <p className="mt-1 text-sm">
                {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
              </p>
            </div>
          </div>
          
          {/* Description */}
          {task.description && (
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
          
          {/* Comments Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </h4>
            
            {isLoadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                          {comment.author.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{comment.author.name}</span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {/* Add Comment */}
            <div className="flex gap-2 mt-4">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                className="self-end"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
