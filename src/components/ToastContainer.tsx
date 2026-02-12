import React from 'react';
import { useToast, ToastType } from '../contexts/ToastContext';

const toastStyles: Record<ToastType, string> = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-yellow-500 border-yellow-600',
    info: 'bg-blue-500 border-blue-600'
};

const toastIcons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`${toastStyles[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg border-l-4 flex items-center justify-between animate-slide-in-right`}
                >
                    <div className="flex items-center space-x-3">
                        <span className="text-xl font-bold">{toastIcons[toast.type]}</span>
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
};
