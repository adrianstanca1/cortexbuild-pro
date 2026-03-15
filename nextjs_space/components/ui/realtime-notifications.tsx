// components/ui/realtime-notifications.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useSession } from "next-auth/react";
import { RealTimeNotifications as RealTimeNotificationService } from "@/lib/realtime-notifications";

interface Notification {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  message: string;
  type:
    | "INFO"
    | "WARNING"
    | "ERROR"
    | "SUCCESS"
    | "TASK_ASSIGNED"
    | "TASK_UPDATED"
    | "TASK_COMPLETED"
    | "PROJECT_MESSAGE"
    | "RFI_RESPONSE"
    | "SUBMITTAL_APPROVED"
    | "SUBMITTAL_REJECTED"
    | "DEADLINE_REMINDER"
    | "SAFETY_INCIDENT"
    | "SYSTEM_ALERT";
  read: boolean;
  createdAt: Date;
  data?: Record<string, any>;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "SUCCESS":
    case "TASK_COMPLETED":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "WARNING":
    case "DEADLINE_REMINDER":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "ERROR":
    case "SAFETY_INCIDENT":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "TASK_ASSIGNED":
    case "TASK_UPDATED":
    case "PROJECT_MESSAGE":
    case "RFI_RESPONSE":
    case "SUBMITTAL_APPROVED":
    case "SUBMITTAL_REJECTED":
    case "SYSTEM_ALERT":
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "SUCCESS":
    case "TASK_COMPLETED":
      return "border-green-200 bg-green-50";
    case "WARNING":
    case "DEADLINE_REMINDER":
      return "border-yellow-200 bg-yellow-50";
    case "ERROR":
    case "SAFETY_INCIDENT":
      return "border-red-200 bg-red-50";
    case "TASK_ASSIGNED":
    case "TASK_UPDATED":
    case "PROJECT_MESSAGE":
    case "RFI_RESPONSE":
    case "SUBMITTAL_APPROVED":
    case "SUBMITTAL_REJECTED":
    case "SYSTEM_ALERT":
    default:
      return "border-blue-200 bg-blue-50";
  }
};

const RealTimeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { isConnected, sendNotification: _sendNotification } = useWebSocket();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    // Load initial notifications
    const loadNotifications = async () => {
      try {
        const userNotifications =
          await RealTimeNotificationService.getUserUnreadNotifications(userId);
        setNotifications(userNotifications as unknown as Notification[]);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    loadNotifications();

    // Set up WebSocket listeners for real-time notifications
    if (isConnected) {
      // Listen for new notifications
      // In a real implementation, this would be handled by the WebSocket context
    }
  }, [userId, isConnected]);

  const markAsRead = async (notificationId: string) => {
    try {
      await RealTimeNotificationService.markAsRead(notificationId, userId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      for (const notification of notifications) {
        await RealTimeNotificationService.markAsRead(notification.id, userId);
      }
      setNotifications([]);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const _handleNotificationReceived = (newNotification: Notification) => {
    setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]); // Keep only the 10 most recent

    // Show notification toast
    setIsVisible(true);
    setTimeout(() => setIsVisible(false), 5000);
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-hidden rounded-md border bg-white shadow-lg z-50"
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`border-b p-3 ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast-style notification for new incoming notifications */}
      <AnimatePresence>
        {isVisible && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-4 right-4 z-[100] max-w-sm w-full rounded-lg border bg-white shadow-lg p-4"
          >
            <div className="flex items-start gap-3">
              {getNotificationIcon(notifications[0].type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900">
                  {notifications[0].title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {notifications[0].message}
                </p>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RealTimeNotifications;
