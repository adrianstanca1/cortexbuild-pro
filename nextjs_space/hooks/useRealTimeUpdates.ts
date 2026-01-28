// hooks/useRealTimeUpdates.ts
import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useSession } from 'next-auth/react';

interface TaskUpdate {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: Date;
  completedAt?: Date;
  projectId?: string;
  assigneeId?: string;
  creatorId?: string;
}

interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

export const useRealTimeUpdates = (projectId: string) => {
  const { isConnected, joinProject, leaveProject, on, off } = useWebSocket();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || session?.user?.id;
  
  const [tasks, setTasks] = useState<TaskUpdate[]>([]);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!projectId || !userId || !isConnected) return;

    // Join the project room
    joinProject(projectId, userId);

    // Set up listeners
    on('task-updated', (data) => {
      setTasks(prev => {
        const existingIndex = prev.findIndex(task => task.id === data.task.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], ...data.task };
          return updated;
        }
        return [...prev, data.task];
      });
    });

    on('new-message', (data) => {
      setMessages(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          projectId: data.projectId,
          senderId: data.senderId,
          senderName: data.senderName,
          message: data.message,
          timestamp: new Date()
        },
        ...prev
      ]);
    });

    on('user-joined', (data) => {
      setOnlineUsers(prev => [...prev, data.userId]);
    });

    on('user-left', (data) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    });

    on('user-status-changed', (data) => {
      // Update user status if needed
      console.log(`User ${data.userId} status changed to ${data.status}`);
    });

    on('user-disconnected', (data) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    });

    // Clean up
    return () => {
      leaveProject(projectId);
      off('task-updated');
      off('new-message');
      off('user-joined');
      off('user-left');
      off('user-status-changed');
      off('user-disconnected');
    };
  }, [projectId, userId, isConnected, joinProject, leaveProject, on, off]);

  const sendTaskUpdate = (task: TaskUpdate) => {
    if (isConnected) {
      // In a real implementation, this would call the WebSocket context method
      console.log('Sending task update:', task);
    }
  };

  const sendProjectMessage = (message: string, senderName: string) => {
    if (isConnected) {
      // In a real implementation, this would call the WebSocket context method
      console.log('Sending project message:', message);
    }
  };

  return {
    isConnected,
    tasks,
    messages,
    onlineUsers,
    sendTaskUpdate,
    sendProjectMessage
  };
};