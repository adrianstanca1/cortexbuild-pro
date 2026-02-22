import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ClientLoginView } from '@/views/client-portal/ClientLoginView';
import { ClientProjectView } from '@/views/client-portal/ClientProjectView';

const ClientPortalView: React.FC = () => {
    return (
        <React.Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Portal...</div>}>
            <Routes>
                {/* Default route: tries to login/validate token */}
                <Route path=":token" element={<ClientLoginView />} />
                <Route path=":token/login" element={<ClientLoginView />} />
                <Route path=":token/project" element={<ClientProjectView />} />
                {/* Fallback */}
                <Route path="*" element={<div className="p-10 text-center">Page not found</div>} />
            </Routes>
        </React.Suspense>
    );
};

export default ClientPortalView;
