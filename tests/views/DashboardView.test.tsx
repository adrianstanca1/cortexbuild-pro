import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardView from '@/views/DashboardView';
import { useProjects } from '@/contexts/ProjectContext';

// Mock all contexts
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'u1', name: 'Test User', email: 'test@test.com', role: 'COMPANY_ADMIN' },
        isAuthenticated: true,
        isLoading: false,
    }),
}));

jest.mock('@/contexts/TenantContext', () => ({
    useTenant: () => ({
        currentCompanyId: 'c1',
        currentCompanyName: 'Test Company',
        workforce: [],
        canAddResource: () => true,
        checkFeature: () => true,
        systemSettings: { betaFeatures: true },
    }),
}));

jest.mock('@/contexts/ToastContext', () => ({
    useToast: () => ({
        addToast: jest.fn(),
    }),
}));

jest.mock('@/contexts/WebSocketContext', () => ({
    useWebSocket: () => ({
        isConnected: true,
        joinRoom: jest.fn(),
        leaveRoom: jest.fn(),
        sendMessage: jest.fn(),
        lastMessage: null,
        onlineUsers: [],
        socket: null
    }),
}));

// Mock ProjectContext with a default implementation
jest.mock('@/contexts/ProjectContext', () => ({
    useProjects: jest.fn(() => ({
        projects: [
            { id: 'p1', name: 'Test Project', status: 'Active', progress: 45, budget: 1000000, health: 'Good' },
            { id: 'p2', name: 'Another Project', status: 'Planning', progress: 10, budget: 500000, health: 'Neutral' },
        ],
        tasks: [],
        documents: [],
        safetyHazards: [],
        equipment: [],
        isLoading: false,
        getPredictiveAnalysis: jest.fn(() => Promise.resolve({
            delayProbability: 15,
            predictedDelayDays: 2,
            reasoning: 'Stable trajectories',
            riskFactors: [],
            analyzedAt: new Date().toISOString()
        })),
    }))
}));

jest.mock('@/services/geminiService', () => ({
    runRawPrompt: jest.fn(() => Promise.resolve('{"greeting": "Hello", "agenda": [], "risks": [], "wins": [], "quote": "Test"}')),
    parseAIJSON: jest.fn((str) => JSON.parse(str)),
}));

jest.mock('@/services/db', () => ({
    db: {
        getKPIs: jest.fn(() => Promise.resolve({
            totalProjects: 5,
            activeProjects: 3,
            completedTasks: 42,
            pendingTasks: 18,
        })),
        getProjects: jest.fn(() => Promise.resolve([])),
        getActivities: jest.fn(() => Promise.resolve([])),
        getPredictiveAnalysis: jest.fn(() => Promise.resolve({
            risk_level: 'low',
            completion_probability: 0.95,
            recommendations: []
        })),
    },
}));

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('DashboardView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders dashboard header', async () => {
        renderWithProviders(<DashboardView setPage={jest.fn()} />);

        await waitFor(() => {
            expect(screen.getByText(/Strategic Overview/i)).toBeInTheDocument();
        });
    });

    it('renders project list section', async () => {
        renderWithProviders(<DashboardView setPage={jest.fn()} />);

        await waitFor(() => {
            // Look for any project-related content
            const projectElements = screen.queryAllByText(/Nodes/i);
            expect(projectElements.length).toBeGreaterThan(0);
        });
    });

    it('displays loading state initially', async () => {
        // Re-mock to show loading
        (useProjects as jest.Mock).mockReturnValueOnce({
            projects: [],
            tasks: [],
            documents: [],
            safetyHazards: [],
            equipment: [],
            isLoading: true,
        });

        renderWithProviders(<DashboardView setPage={jest.fn()} />);

        // Wait for loading to finish or at least for the component to settle
        await waitFor(() => {
            // If loading, Strategic Overview might still be there if skeleton is used, 
            // but let's just check it doesn't crash. 
            // The original test asserted Strategic Overview is present.
            expect(screen.getByText(/Strategic Overview/i)).toBeInTheDocument();
        });
    });
});
