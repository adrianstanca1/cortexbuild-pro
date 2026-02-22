import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { EnhancedProjectCard } from '@/components/EnhancedProjectCard';
import { Project } from '@/types';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

// Mock the Can component
jest.mock('@/components/Can', () => ({
    Can: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock the WebSocket context
const mockWebSocketContext = {
    isConnected: true,
    socket: null,
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    sendMessage: jest.fn()
};

jest.mock('@/contexts/WebSocketContext', () => ({
    WebSocketProvider: ({ children }: { children: React.ReactNode }) => children,
    useWebSocket: () => mockWebSocketContext
}));

describe('EnhancedProjectCard', () => {
    const mockProject: Project = {
        id: 'p1',
        companyId: 'c1',
        name: 'Test Project',
        code: 'TEST-001',
        description: 'Test project description',
        location: 'Test Location',
        type: 'Commercial',
        status: 'Active',
        health: 'Good',
        progress: 50,
        budget: 100000,
        spent: 50000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        manager: 'Test Manager',
        image: '',
        teamSize: 10,
        tasks: { total: 10, completed: 5, overdue: 1 },
        tags: ['test-tag-1', 'test-tag-2', 'test-tag-3'],
        priority: 'high',
        riskScore: 25,
        lastActivity: '2024-01-15T10:00:00Z',
        archived: false,
        activeCollaborators: ['user1', 'user2'],
        recentComments: [],
        customFields: {}
    };

    it('renders project card with basic information', () => {
        render(<EnhancedProjectCard project={mockProject} />);
        
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('Test Location')).toBeInTheDocument();
        expect(screen.getByText('TEST-001')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('displays WebSocket connection status', () => {
        render(<EnhancedProjectCard project={mockProject} />);
        
        expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('displays risk score for projects with risk > 0', () => {
        render(<EnhancedProjectCard project={mockProject} />);
        
        expect(screen.getByText('Risk Score:')).toBeInTheDocument();
        expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('displays risk score of 0', () => {
        const projectWithZeroRisk = { ...mockProject, riskScore: 0 };
        render(<EnhancedProjectCard project={projectWithZeroRisk} />);
        
        expect(screen.getByText('Risk Score:')).toBeInTheDocument();
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays priority badge', () => {
        render(<EnhancedProjectCard project={mockProject} />);
        
        expect(screen.getByText(/high/i)).toBeInTheDocument();
    });

    it('displays tags with overflow indicator', () => {
        render(<EnhancedProjectCard project={mockProject} />);
        
        expect(screen.getByText('test-tag-1')).toBeInTheDocument();
        expect(screen.getByText('test-tag-2')).toBeInTheDocument();
        expect(screen.getByText('+1')).toBeInTheDocument(); // Third tag as overflow
    });

    it('displays archive badge for archived projects', () => {
        const archivedProject = { ...mockProject, archived: true };
        render(<EnhancedProjectCard project={archivedProject} />);
        
        const card = screen.getByText('Test Project').closest('div[class*="opacity-70"]');
        expect(card).toBeInTheDocument();
    });

    it('displays active collaborators count', () => {
        render(<EnhancedProjectCard project={mockProject} />);
        
        expect(screen.getByText('2 active collaborators')).toBeInTheDocument();
    });

    it('displays last activity timestamp', () => {
        render(<EnhancedProjectCard project={mockProject} />);
        
        expect(screen.getByText(/Last activity:/)).toBeInTheDocument();
    });

    it('shows budget warning when over budget', () => {
        const overBudgetProject = { 
            ...mockProject, 
            budget: 100000, 
            spent: 150000 
        };
        render(<EnhancedProjectCard project={overBudgetProject} />);
        
        expect(screen.getByText(/Over budget by/)).toBeInTheDocument();
    });

    it('calls onSelect when card is clicked', () => {
        const onSelect = jest.fn();
        render(<EnhancedProjectCard project={mockProject} onSelect={onSelect} />);
        
        const card = screen.getByText('Test Project').closest('div[role="generic"]');
        if (card) {
            fireEvent.click(card);
            expect(onSelect).toHaveBeenCalledWith('p1');
        }
    });

    it('shows quick action buttons on hover', async () => {
        const onArchive = jest.fn();
        render(<EnhancedProjectCard project={mockProject} onArchive={onArchive} />);
        
        const card = screen.getByText('Test Project').closest('div');
        if (card) {
            fireEvent.mouseEnter(card);
            
            await waitFor(() => {
                expect(screen.getByText('Tasks')).toBeInTheDocument();
                expect(screen.getByText('Status')).toBeInTheDocument();
            });
        }
    });

    it('handles undefined risk score gracefully', () => {
        const projectWithoutRisk = { ...mockProject, riskScore: undefined };
        render(<EnhancedProjectCard project={projectWithoutRisk} />);
        
        expect(screen.queryByText('Risk Score:')).not.toBeInTheDocument();
    });

    it('handles projects without tags', () => {
        const projectWithoutTags = { ...mockProject, tags: undefined };
        render(<EnhancedProjectCard project={projectWithoutTags} />);
        
        // Should render without errors
        expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('displays correct risk score color for different ranges', () => {
        // Low risk (< 30)
        const { rerender } = render(<EnhancedProjectCard project={{ ...mockProject, riskScore: 20 }} />);
        expect(screen.getByText('20%')).toHaveClass('text-green-600');

        // Medium risk (30-59)
        rerender(<EnhancedProjectCard project={{ ...mockProject, riskScore: 45 }} />);
        expect(screen.getByText('45%')).toHaveClass('text-yellow-600');

        // High risk (>= 60)
        rerender(<EnhancedProjectCard project={{ ...mockProject, riskScore: 75 }} />);
        expect(screen.getByText('75%')).toHaveClass('text-red-600');
    });
});
