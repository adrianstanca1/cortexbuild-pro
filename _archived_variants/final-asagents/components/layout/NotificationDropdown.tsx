import React from 'react';
import { Bell, X } from 'lucide-react';

interface NotificationDropdownProps {
    user: any;
    notifications: any[];
    onClose: () => void;
    addToast: (message: string, type: 'success' | 'error') => void;
    onNotificationClick: (notification: any) => void;
    onMarkAllAsRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
    onClose,
    notifications
}) => {
    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
            </div>
        </div>
    );
};