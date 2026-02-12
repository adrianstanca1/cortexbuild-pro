import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { db } from '@/services/db';

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const { addToast } = useToast();
    const { lastMessage } = useWebSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Initial fetch
    useEffect(() => {
        const fetchNotifications = async () => {
            if (user && token) {
                try {
                    const data = await db.getNotifications();
                    setNotifications(data);
                } catch (error) {
                    console.error('Failed to fetch notifications:', error);
                }
            }
        };
        fetchNotifications();
    }, [user, token]);

    // Handle real-time notifications via WebSocketContext
    useEffect(() => {
        if (lastMessage && lastMessage.type === 'notification') {
            const newNote: Notification = {
                id: lastMessage.id || Math.random().toString(36).substr(2, 9),
                type: lastMessage.notificationType || 'info',
                title: lastMessage.title || 'New Notification',
                message: lastMessage.message || '',
                link: lastMessage.link,
                isRead: false,
                createdAt: lastMessage.createdAt || new Date().toISOString()
            };

            setNotifications((prev) => [newNote, ...prev]);

            // Show Toast immediately
            addToast(newNote.title, newNote.type);
        }
    }, [lastMessage]);

    const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.isRead).length : 0;

    const markAsRead = async (id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        try {
            await db.markNoteAsRead(id);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        try {
            await db.markAllNotesAsRead();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const addNotification = (n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
        const newNote: Notification = {
            ...n,
            id: Math.random().toString(36).substr(2, 9),
            isRead: false,
            createdAt: new Date().toISOString()
        };
        setNotifications((prev) => [newNote, ...prev]);
        addToast(n.title, n.type);
    };

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
