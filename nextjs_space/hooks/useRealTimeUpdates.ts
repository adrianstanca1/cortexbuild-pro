"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  status: string;
  updatedAt: Date;
}

interface Message {
  id: string;
  content: string;
  message?: string;
  author: string;
  senderName?: string;
  timestamp: Date;
}

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  substring?: (start: number, end: number) => string;
}

interface UseRealTimeUpdatesReturn {
  isConnected: boolean;
  tasks: Task[];
  messages: Message[];
  onlineUsers: OnlineUser[];
  sendTaskUpdate: (task: Partial<Task>) => void;
  sendProjectMessage: (content: string, author: string) => void;
}

export function useRealTimeUpdates(
  projectId: string,
): UseRealTimeUpdatesReturn {
  const [isConnected, setIsConnected] = React.useState(false);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = React.useState<OnlineUser[]>([]);
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-project", projectId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("task-updated", (updatedTask: Task) => {
      setTasks((prev) => {
        const index = prev.findIndex((t) => t.id === updatedTask.id);
        if (index >= 0) {
          const newTasks = [...prev];
          newTasks[index] = updatedTask;
          return newTasks;
        }
        return [...prev, updatedTask];
      });
    });

    socket.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("users-online", (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId]);

  const sendTaskUpdate = React.useCallback(
    (task: Partial<Task>) => {
      if (socketRef.current) {
        socketRef.current.emit("task-update", { projectId, task });
      }
    },
    [projectId],
  );

  const sendProjectMessage = React.useCallback(
    (content: string, author: string) => {
      if (socketRef.current) {
        const message: Message = {
          id: Date.now().toString(),
          content,
          author,
          timestamp: new Date(),
        };
        socketRef.current.emit("project-message", { projectId, message });
        setMessages((prev) => [...prev, message]);
      }
    },
    [projectId],
  );

  return {
    isConnected,
    tasks,
    messages,
    onlineUsers,
    sendTaskUpdate,
    sendProjectMessage,
  };
}
