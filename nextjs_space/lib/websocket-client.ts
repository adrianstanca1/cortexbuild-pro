/**
 * WebSocket Client for CortexBuild Pro
 *
 * Handles real-time communication for:
 * - Project updates
 * - Task synchronization
 * - Notifications
 * - User presence
 */

import { io, Socket } from "socket.io-client";

const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3000";

interface WebSocketEventMap {
  connect: () => void;
  disconnect: () => void;
  authenticated: (data: { userId: string; projectId?: string }) => void;
  "authentication-error": (error: Error) => void;
  "task:updated": (data: {
    taskId: string;
    projectId: string;
    changes: any;
  }) => void;
  "task:created": (data: { taskId: string; projectId: string }) => void;
  "task:deleted": (data: { taskId: string; projectId: string }) => void;
  "project:message": (data: {
    projectId: string;
    message: string;
    senderName: string;
    timestamp: string;
  }) => void;
  "user:status": (data: {
    projectId: string;
    userId: string;
    status: string;
  }) => void;
  notification: (data: {
    projectId: string;
    type: string;
    payload: any;
  }) => void;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<keyof WebSocketEventMap, Set<Function>> = new Map();
  private connectedProjectIds: Set<string> = new Set();

  /**
   * Connect to WebSocket server
   */
  async connect(token: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(WEBSOCKET_URL, {
          auth: { token, userId },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on("connect", () => {
          this.emit("connect");
          resolve();
        });

        this.socket.on("disconnect", () => {
          this.emit("disconnect");
        });

        this.socket.on(
          "authenticated",
          (data: { userId: string; projectId?: string }) => {
            this.emit("authenticated", data);
          },
        );

        this.socket.on("authentication-error", (error: Error) => {
          this.emit("authentication-error", error);
          reject(error);
        });

        // Set up event listeners for real-time events
        this.socket.on("task:updated", (data) => {
          this.emit("task:updated", data);
        });

        this.socket.on("task:created", (data) => {
          this.emit("task:created", data);
        });

        this.socket.on("task:deleted", (data) => {
          this.emit("task:deleted", data);
        });

        this.socket.on("project:message", (data) => {
          this.emit("project:message", data);
        });

        this.socket.on("user:status", (data) => {
          this.emit("user:status", data);
        });

        this.socket.on("notification", (data) => {
          this.emit("notification", data);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connectedProjectIds.clear();
    }
  }

  /**
   * Join a project room
   */
  joinProject(projectId: string, userId: string): void {
    if (this.socket) {
      this.socket.emit("join:project", { projectId, userId });
      this.connectedProjectIds.add(projectId);
    }
  }

  /**
   * Leave a project room
   */
  leaveProject(projectId: string): void {
    if (this.socket) {
      this.socket.emit("leave:project", { projectId });
      this.connectedProjectIds.delete(projectId);
    }
  }

  /**
   * Send task update event
   */
  sendTaskUpdate(projectId: string, task: any): void {
    if (this.socket && this.connectedProjectIds.has(projectId)) {
      this.socket.emit("task:update", { projectId, task });
    }
  }

  /**
   * Send project message
   */
  sendProjectMessage(
    projectId: string,
    message: string,
    senderName: string,
  ): void {
    if (this.socket && this.connectedProjectIds.has(projectId)) {
      this.socket.emit("project:message", { projectId, message, senderName });
    }
  }

  /**
   * Update user status in project
   */
  updateUserStatus(projectId: string, status: string): void {
    if (this.socket && this.connectedProjectIds.has(projectId)) {
      this.socket.emit("user:status", { projectId, status });
    }
  }

  /**
   * Send notification
   */
  sendNotification(projectId: string, notification: any): void {
    if (this.socket && this.connectedProjectIds.has(projectId)) {
      this.socket.emit("notification", { projectId, notification });
    }
  }

  /**
   * Subscribe to an event
   */
  on<T extends keyof WebSocketEventMap>(
    event: T,
    callback: WebSocketEventMap[T],
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as Function);
  }

  /**
   * Unsubscribe from an event
   */
  off<T extends keyof WebSocketEventMap>(
    event: T,
    callback?: WebSocketEventMap[T],
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      if (callback) {
        eventListeners.delete(callback as Function);
      } else {
        eventListeners.clear();
      }
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emit<T extends keyof WebSocketEventMap>(
    event: T,
    data?: Parameters<WebSocketEventMap[T]>[0],
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }
}

// Singleton instance
export const websocketClient = new WebSocketClient();
