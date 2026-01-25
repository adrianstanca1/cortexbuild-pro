// contexts/WebSocketContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { websocketClient } from '@/lib/websocket-client';
import { useSession } from 'next-auth/react';

interface WebSocketContextType {
  isConnected: boolean;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  sendTaskUpdate: (projectId: string, task: any) => void;
  sendProjectMessage: (projectId: string, message: string, senderName: string) => void;
  updateUserStatus: (projectId: string, status: string) => void;
  sendNotification: (projectId: string, notification: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const token = (session.user as any).accessToken || session.accessToken || 'fallback-token';
      const userId = (session.user as any).id || session.user?.id;
      
      // Connect to WebSocket
      websocketClient.connect(token, userId)
        .then(() => {
          setIsConnected(true);
          console.log('WebSocket connected successfully');
        })
        .catch(error => {
          console.error('Failed to connect WebSocket:', error);
        });

      // Set up listeners
      websocketClient.on('authenticated', (data) => {
        console.log('WebSocket authenticated:', data);
      });

      websocketClient.on('authentication-error', (error) => {
        console.error('WebSocket authentication error:', error);
      });

      websocketClient.on('connect', () => {
        setIsConnected(true);
      });

      websocketClient.on('disconnect', () => {
        setIsConnected(false);
      });
    }

    // Cleanup on unmount
    return () => {
      websocketClient.off('authenticated');
      websocketClient.off('authentication-error');
      websocketClient.off('connect');
      websocketClient.off('disconnect');
      websocketClient.disconnect();
    };
  }, [status, session]);

  const joinProject = (projectId: string) => {
    if (session?.user) {
      const userId = (session.user as any).id || session.user?.id;
      websocketClient.joinProject(projectId, userId);
    }
  };

  const leaveProject = (projectId: string) => {
    websocketClient.leaveProject(projectId);
  };

  const sendTaskUpdate = (projectId: string, task: any) => {
    websocketClient.sendTaskUpdate(projectId, task);
  };

  const sendProjectMessage = (projectId: string, message: string, senderName: string) => {
    websocketClient.sendProjectMessage(projectId, message, senderName);
  };

  const updateUserStatus = (projectId: string, status: string) => {
    websocketClient.updateUserStatus(projectId, status);
  };

  const sendNotification = (projectId: string, notification: any) => {
    websocketClient.sendNotification(projectId, notification);
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        joinProject,
        leaveProject,
        sendTaskUpdate,
        sendProjectMessage,
        updateUserStatus,
        sendNotification,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};