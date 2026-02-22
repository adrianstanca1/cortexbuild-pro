import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { Page } from '@/types';

// Mock contexts
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'u1', name: 'Test User', email: 'test@test.com', role: 'COMPANY_ADMIN', avatarInitials: 'TU' },
        isAuthenticated: true,
        logout: jest.fn(),
        stopImpersonating: jest.fn(),
        isImpersonating: false
    }),
}));

jest.mock('@/contexts/TenantContext', () => ({
    useTenant: () => ({
        systemSettings: { betaFeatures: true },
        currentCompanyId: 'c1',
        currentCompanyName: 'Test Company',
    }),
}));

jest.mock('@/contexts/WebSocketContext', () => ({
    useWebSocket: () => ({
        isConnected: true,
        lastMessage: null,
        sendMessage: jest.fn(),
        onlineUsers: [],
    }),
}));

jest.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({
        can: () => true,
        isAdmin: true,
    }),
}));

const renderSidebar = (isOpen = true) => {
    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Sidebar currentPage={Page.DASHBOARD} setPage={jest.fn()} isOpen={isOpen} onClose={jest.fn()} />
        </MemoryRouter>
    );
};

describe('Sidebar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders when open', () => {
        renderSidebar(true);

        // Sidebar should be visible when open
        const sidebar = document.querySelector('nav');
        expect(sidebar).toBeInTheDocument();
    });

    it('contains navigation links', () => {
        renderSidebar(true);

        // Should have navigation elements
        const links = document.querySelectorAll('button');
        expect(links.length).toBeGreaterThan(0);
    });

    it('shows Dashboard link', () => {
        renderSidebar(true);

        // Dashboard should always be visible
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    it('shows Projects link for authorized users', () => {
        renderSidebar(true);

        expect(screen.getByText(/Portfolio/i)).toBeInTheDocument();
    });

    it('shows Tasks link', () => {
        renderSidebar(true);

        expect(screen.getByText(/Vector Ledger/i)).toBeInTheDocument();
    });
});
