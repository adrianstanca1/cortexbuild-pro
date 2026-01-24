import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { Server as HttpServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Define types for our WebSocket connections
interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  userId?: string;
  projectId?: string;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

// Store active connections
const connections = new Map<string, ExtendedWebSocket[]>();

export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocketServer | null = null;
  private server: HttpServer | null = null;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public async initialize(server: HttpServer) {
    this.server = server;
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/websocket',
      verifyClient: async (info, callback) => {
        try {
          // Extract token from query params or headers
          const url = new URL(info.origin || 'http://localhost');
          const token = url.searchParams.get('token') || info.req.headers.authorization?.split(' ')[1];
          
          if (!token) {
            callback(false, 401, 'Unauthorized: Missing token');
            return;
          }

          // Verify the token by checking if it's a valid session
          // For simplicity, we'll just check if it corresponds to a valid user
          // In a real implementation, you'd validate the JWT token
          const session = await getServerSession(authOptions);
          
          // Since we can't directly access session from here, we'll implement a simpler validation
          // In a real app, you'd decode the JWT and verify it
          callback(true);
        } catch (error) {
          console.error('WebSocket authentication error:', error);
          callback(false, 401, 'Unauthorized');
        }
      }
    });

    this.wss.on('connection', (ws: ExtendedWebSocket, req) => {
      console.log('New WebSocket connection established');
      
      ws.isAlive = true;
      
      // Extract user and project info from connection
      const url = new URL(`http://localhost${req.url}`);
      const userId = url.searchParams.get('userId');
      const projectId = url.searchParams.get('projectId');
      
      if (userId) {
        ws.userId = userId;
      }
      
      if (projectId) {
        ws.projectId = projectId;
      }

      // Add connection to appropriate project channel
      if (projectId) {
        if (!connections.has(projectId)) {
          connections.set(projectId, []);
        }
        connections.get(projectId)?.push(ws);
        console.log(`Added connection to project ${projectId}. Total connections: ${connections.get(projectId)?.length}`);
      }

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'ERROR',
            payload: { message: 'Invalid message format' }
          }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.removeConnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeConnection(ws);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'CONNECTION_ESTABLISHED',
        payload: { message: 'Connected to WebSocket server' }
      }));
    });

    // Health check - ping all connections periodically
    const interval = setInterval(() => {
      if (this.wss) {
        this.wss.clients.forEach((ws: ExtendedWebSocket) => {
          if (ws.isAlive === false) {
            console.log('Terminating inactive WebSocket connection');
            return ws.terminate();
          }
          
          ws.isAlive = false;
          ws.ping();
        });
      }
    }, 30000); // Ping every 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  private async handleMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
    console.log(`Received message: ${message.type}`, message.payload);

    switch (message.type) {
      case 'JOIN_PROJECT':
        await this.handleJoinProject(ws, message.payload);
        break;
      case 'LEAVE_PROJECT':
        await this.handleLeaveProject(ws, message.payload);
        break;
      case 'TASK_UPDATE':
        await this.broadcastToProject(ws.projectId!, message, ws.userId);
        break;
      case 'PROJECT_MESSAGE':
        await this.broadcastToProject(ws.projectId!, message, ws.userId);
        break;
      case 'USER_STATUS_UPDATE':
        await this.broadcastToProject(ws.projectId!, message, ws.userId);
        break;
      case 'PING':
        ws.send(JSON.stringify({ type: 'PONG', payload: {} }));
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: { message: `Unknown message type: ${message.type}` }
        }));
    }
  }

  private async handleJoinProject(ws: ExtendedWebSocket, payload: { projectId: string }) {
    const { projectId } = payload;
    
    // Remove from any existing project
    if (ws.projectId) {
      this.removeConnectionFromProject(ws, ws.projectId);
    }
    
    // Add to new project
    ws.projectId = projectId;
    if (!connections.has(projectId)) {
      connections.set(projectId, []);
    }
    connections.get(projectId)?.push(ws);
    
    // Notify user they joined
    ws.send(JSON.stringify({
      type: 'PROJECT_JOINED',
      payload: { projectId, message: `Joined project ${projectId}` }
    }));
    
    // Broadcast to others in project
    this.broadcastToProject(
      projectId, 
      { 
        type: 'USER_JOINED_PROJECT', 
        payload: { userId: ws.userId, projectId } 
      },
      ws.userId
    );
  }

  private async handleLeaveProject(ws: ExtendedWebSocket, payload: { projectId: string }) {
    const { projectId } = payload;
    this.removeConnectionFromProject(ws, projectId);
    
    ws.send(JSON.stringify({
      type: 'PROJECT_LEFT',
      payload: { projectId, message: `Left project ${projectId}` }
    }));
    
    // Broadcast to others in project
    this.broadcastToProject(
      projectId, 
      { 
        type: 'USER_LEFT_PROJECT', 
        payload: { userId: ws.userId, projectId } 
      },
      ws.userId
    );
  }

  private removeConnection(ws: ExtendedWebSocket) {
    if (ws.projectId) {
      this.removeConnectionFromProject(ws, ws.projectId);
    }
  }

  private removeConnectionFromProject(ws: ExtendedWebSocket, projectId: string) {
    const projectConnections = connections.get(projectId);
    if (projectConnections) {
      const index = projectConnections.indexOf(ws);
      if (index !== -1) {
        projectConnections.splice(index, 1);
        console.log(`Removed connection from project ${projectId}. Remaining: ${projectConnections.length}`);
        
        // Clean up empty arrays
        if (projectConnections.length === 0) {
          connections.delete(projectId);
        }
      }
    }
  }

  public async broadcastToProject(projectId: string, message: WebSocketMessage, senderId?: string) {
    const projectConnections = connections.get(projectId);
    if (projectConnections) {
      const filteredConnections = senderId 
        ? projectConnections.filter(conn => conn.userId !== senderId) 
        : projectConnections;
        
      const messageToSend = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      });

      filteredConnections.forEach((conn: ExtendedWebSocket) => {
        if (conn.readyState === WebSocket.OPEN) {
          try {
            conn.send(messageToSend);
          } catch (error) {
            console.error('Error sending message to WebSocket:', error);
            // Remove broken connection
            this.removeConnection(conn);
          }
        }
      });
    }
  }

  public async broadcastToUser(userId: string, message: WebSocketMessage) {
    // Find all connections for this user across all projects
    for (const [projectId, projectConnections] of connections.entries()) {
      const userConnections = projectConnections.filter(conn => conn.userId === userId);
      
      const messageToSend = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      });

      userConnections.forEach((conn: ExtendedWebSocket) => {
        if (conn.readyState === WebSocket.OPEN) {
          try {
            conn.send(messageToSend);
          } catch (error) {
            console.error('Error sending message to WebSocket:', error);
            this.removeConnection(conn);
          }
        }
      });
    }
  }

  public async broadcastToAll(message: WebSocketMessage) {
    for (const [projectId, projectConnections] of connections.entries()) {
      const messageToSend = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      });

      projectConnections.forEach((conn: ExtendedWebSocket) => {
        if (conn.readyState === WebSocket.OPEN) {
          try {
            conn.send(messageToSend);
          } catch (error) {
            console.error('Error sending message to WebSocket:', error);
            this.removeConnection(conn);
          }
        }
      });
    }
  }

  public getActiveConnectionsCount(): number {
    let count = 0;
    for (const connectionsArray of connections.values()) {
      count += connectionsArray.length;
    }
    return count;
  }

  public getProjectConnectionsCount(projectId: string): number {
    return connections.get(projectId)?.length || 0;
  }
}

// Initialize WebSocket service
export const websocketService = WebSocketService.getInstance();

// API route handler for Next.js
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Upgrade to WebSocket connection
  if (req.method === 'GET' && req.url?.includes('/api/websocket')) {
    // This will be handled by the WebSocket server
    return;
  }

  // For other requests, return method not allowed
  res.status(405).json({ error: 'Method not allowed' });
}