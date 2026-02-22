import React from 'react';

interface LoadingSkeletonProps {
    type?: 'card' | 'list' | 'table' | 'form';
    rows?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card', rows = 3 }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                );

            case 'list':
                return (
                    <div className="space-y-3">
                        {Array.from({ length: rows }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 animate-pulse">
                                <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'table':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                        <div className="animate-pulse">
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600"></div>
                            {Array.from({ length: rows }).map((_, i) => (
                                <div key={i} className="h-16 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'form':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
                        {Array.from({ length: rows }).map((_, i) => (
                            <div key={i} className="animate-pulse space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    return <>{renderSkeleton()}</>;
};
