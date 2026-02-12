import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface WebSocketContextType {
    isConnected: boolean;
    joinRoom: (projectId: string) => void;
    leaveRoom: () => void;
    sendMessage: (type: string, payload: any) => void;
    lastMessage: any;
    onlineUsers: string[];
    socket: Socket | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const currentRoomRef = useRef<string | null>(null);

    const handleUpdate = (data: any) => {
        if (!data || !data.type) return;

        setLastMessage(data);

        switch (data.type) {
            case 'company_presence':
                setOnlineUsers(data.users || []);
                break;
            case 'project_updated':
                addToast(`Project updated by another user`, 'info');
                break;
            case 'task_updated':
                addToast(`Task "${data.payload?.title || 'task'}" was updated`, 'info');
                break;
            case 'system_alert':
                addToast(data.message || 'System alert', data.severity || 'info');
                break;
            case 'presence_update':
                // Handled via company_presence mostly, but good for project specific
                break;
        }
    };

    const connect = async () => {
        if (!user) return;

        // Disconnect existing if any
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        try {
            // Get WebSocket URL from environment
            let wsUrl = import.meta.env.VITE_WS_URL || '';

            // If no WS_URL is set, derive from API_URL
            if (!wsUrl) {
                const apiUrl = import.meta.env.VITE_API_URL || '';
                // Convert https://api.domain.com/api/v1 to wss://api.domain.com
                wsUrl = apiUrl
                    .replace('https://', 'wss://')
                    .replace('http://', 'ws://')
                    .replace(/\/api.*$/, '');
            }

            // For socket.io, we need the base URL (protocol + host)
            // Remove /live if strictly part of the ENV variable to avoid duplication with path option
            const baseUrl = wsUrl.replace(/\/live\/?$/, '');

            // Ensure protocol is http/https for socket.io client (it handles upgrade)
            const socketUrl = baseUrl.replace('wss://', 'https://').replace('ws://', 'http://');

            const socket = io(socketUrl, {
                path: '/live',
                auth: {
                    token: localStorage.getItem('token') || ''
                },
                query: {
                    token: localStorage.getItem('token') || ''
                },
                transports: ['polling'], // Force polling for maximum compatibility with Hostinger proxy
                reconnectionAttempts: 10,
                reconnectionDelay: 1000
            });

            socket.on('connect', () => {
                setIsConnected(true);

                // Re-join room if we had one
                if (currentRoomRef.current) {
                    socket.emit('join_project', { projectId: currentRoomRef.current });
                }
            });

            socket.on('disconnect', (reason) => {
                // Only log disconnect if we were previously connected
                if (socketRef.current?.connected) {
                    console.debug('[WebSocket] Disconnected:', reason);
                }
                setIsConnected(false);
            });

            socket.on('message', (data: any) => {
                handleUpdate(data);
            });

            socket.on('connect_error', (err) => {
                // Suppress WebSocket connection errors since server may not support WebSocket upgrades
                // The app will work fine with REST API polling instead
                console.debug('[WebSocket] Connection unavailable - using REST API fallback');
                setIsConnected(false);
            });

            socketRef.current = socket;

            // Send initial heartbeat
            const heartbeatInterval = setInterval(() => {
                if (socket.connected) {
                    socket.emit('heartbeat');
                }
            }, 30000); // Send heartbeat every 30 seconds

            // Store interval for cleanup
            (socket as any).heartbeatInterval = heartbeatInterval;

        } catch (error) {
            console.debug('[WebSocket] Setup failed - using REST API fallback');
            setIsConnected(false);
        }
    };

    useEffect(() => {
        if (user) {
            connect();
        } else {
            if (socketRef.current) {
                // Clear heartbeat interval
                const interval = (socketRef.current as any).heartbeatInterval;
                if (interval) {
                    clearInterval(interval);
                }
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setIsConnected(false);
            setOnlineUsers([]);
        }

        return () => {
            if (socketRef.current) {
                const interval = (socketRef.current as any).heartbeatInterval;
                if (interval) {
                    clearInterval(interval);
                }
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user?.id]);

    const joinRoom = (projectId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('join_project', { projectId });
            currentRoomRef.current = projectId;
        } else {
            // Buffer the room join
            currentRoomRef.current = projectId;
        }
    };

    const leaveRoom = () => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('leave_project');
            currentRoomRef.current = null;
        }
    };

    const sendMessage = (type: string, payload: any) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('message', { type, ...payload });
        }
    };

    return (
        <WebSocketContext.Provider
            value={{
                isConnected,
                joinRoom,
                leaveRoom,
                sendMessage,
                lastMessage,
                onlineUsers,
                socket: socketRef.current
            }}
        >
            {children}
        </WebSocketContext.Provider>
    );
};
