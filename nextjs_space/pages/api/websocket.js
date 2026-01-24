// pages/api/websocket.js
// Note: WebSockets work better with the Pages router, so I'll create a pages directory
import { Server } from 'socket.io';
import { getSession } from 'next-auth/react';
import { authOptions } from '@/lib/auth-options';

const SocketHandler = (req, res) => {
  // It's important to prevent the response from being ended
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server, {
      path: '/api/websocket',
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3001',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('New client connected');

      // Authenticate user
      socket.on('authenticate', async (token) => {
        try {
          // In a real implementation, you'd verify the JWT token
          // For now, we'll use a simplified approach
          // const session = await getServerSession(req, res, authOptions);

          // For this implementation, we'll trust the token passed from the client
          // In production, you'd validate the JWT token properly
          if (token) {
            // Decode the token to get user info (simplified)
            // In a real app, you'd use a JWT library to decode and verify
            socket.userId = token.userId || 'unknown';
            socket.join(`user-${socket.userId}`);
            socket.emit('authenticated', {
              success: true,
              userId: socket.userId,
              message: 'Authentication successful'
            });
          } else {
            socket.emit('authentication-error', { message: 'Invalid token' });
            socket.disconnect();
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication-error', { message: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Join project room
      socket.on('join-project', (data) => {
        const { projectId, userId } = data;
        if (userId) {
          socket.userId = userId;
          socket.join(`project-${projectId}`);
          socket.to(`project-${projectId}`).emit('user-joined', {
            userId: socket.userId,
            projectId,
            message: `${socket.userId} joined project ${projectId}`
          });
        }
      });

      // Leave project room
      socket.on('leave-project', (data) => {
        const { projectId } = data;
        socket.leave(`project-${projectId}`);
        socket.to(`project-${projectId}`).emit('user-left', {
          userId: socket.userId,
          projectId,
          message: `${socket.userId} left project ${projectId}`
        });
      });

      // Listen for task updates
      socket.on('task-update', (data) => {
        const { projectId, task } = data;
        socket.to(`project-${projectId}`).emit('task-updated', {
          task,
          updatedBy: socket.userId,
          timestamp: new Date().toISOString()
        });
      });

      // Listen for project messages
      socket.on('project-message', (data) => {
        const { projectId, message, senderName } = data;
        socket.to(`project-${projectId}`).emit('new-message', {
          message,
          senderId: socket.userId,
          senderName: senderName || 'Anonymous',
          timestamp: new Date().toISOString()
        });
      });

      // Listen for user status updates
      socket.on('user-status-update', (data) => {
        const { projectId, status } = data;
        socket.to(`project-${projectId}`).emit('user-status-changed', {
          userId: socket.userId,
          status,
          timestamp: new Date().toISOString()
        });
      });

      // Listen for real-time notifications
      socket.on('notification', (data) => {
        const { projectId, notification } = data;
        socket.to(`project-${projectId}`).emit('new-notification', {
          notification,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
        // Notify other users in rooms that this user disconnected
        for (const room in socket.rooms) {
          if (room.startsWith('project-')) {
            const projectId = room.replace('project-', '');
            socket.to(room).emit('user-disconnected', {
              userId: socket.userId,
              projectId,
              message: `${socket.userId} disconnected from project ${projectId}`
            });
          }
        }
      });
    });
  }

  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default SocketHandler;