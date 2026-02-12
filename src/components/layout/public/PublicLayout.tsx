import React from 'react';
import { Page } from '@/types';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';

interface PublicLayoutProps {
    children: React.ReactNode;
    currentPage: Page;
    setPage: (page: Page) => void;
    className?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
    children,
    currentPage,
    setPage,
    className = ""
}) => {
    return (
        <div className={`min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden selection:bg-indigo-600/10 ${className}`}>
            {/* Background decoration elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-indigo-50/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-blue-50/50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:64px_64px]"></div>
            </div>

            {/* Navigation */}
            <PublicNavbar currentPage={currentPage} setPage={setPage} />

            {/* Main Content */}
            <main className="relative z-10">
                {children}
            </main>

            {/* Footer */}
            <PublicFooter setPage={setPage} />
        </div>
    );
};
