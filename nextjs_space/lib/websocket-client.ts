// lib/websocket-client.ts
import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 seconds

  connect(token: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      // Connect to the WebSocket server
      const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      this.socket = io(socketUrl, {
        path: '/api/socketio',
        transports: ['websocket', 'polling'],
        auth: {
          token: token,
          userId: userId
        }
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Authenticate with the server
        this.socket!.emit('authenticate', { token, userId });
        resolve();
      });

      this.socket.on('authenticated', (data) => {
        console.log('Authenticated with WebSocket server:', data);
      });

      this.socket.on('authentication-error', (error) => {
        console.error('WebSocket authentication error:', error);
        this.disconnect();
        reject(new Error(error.message || 'Authentication failed'));
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        this.isConnected = false;

        // Attempt to reconnect if not manually disconnected
        if (reason !== 'io client disconnect') {
          this.attemptReconnect(token, userId);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
        reject(error);
      });
    });
  }

  private attemptReconnect(token: string, userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect(token, userId).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  joinProject(projectId: string, userId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-project', { projectId, userId });
    }
  }

  leaveProject(projectId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-project', { projectId });
    }
  }

  sendTaskUpdate(projectId: string, task: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('task-update', { projectId, task });
    }
  }

  sendProjectMessage(projectId: string, message: string, senderName: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('project-message', { projectId, message, senderName });
    }
  }

  updateUserStatus(projectId: string, status: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('user-status-update', { projectId, status });
    }
  }

  sendNotification(projectId: string, notification: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('notification', { projectId, notification });
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  isConnectedToProject(projectId: string): boolean {
    if (!this.socket) return false;
    return this.socket.rooms.has(`project-${projectId}`);
  }
}

export const websocketClient = new WebSocketClient();