import {
    Client,
    Equipment,
    EquipmentStatus,
    FinancialForecast,
    FinancialKPIs,
    IncidentSeverity,
    IncidentStatus,
    Invoice,
    InvoiceLineItem,
    InvoiceStatus,
    MonthlyFinancials,
    Permission,
    Project,
    ResourceAssignment,
    SafetyIncident,
    Role,
    User,
} from '../types';

const delay = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms));

const now = new Date().toISOString();

const demoClients: Client[] = [
    {
        id: 'client-1',
        name: 'Northshore Developments',
        email: 'info@northshore.dev',
        phone: '+44 161 555 0100',
        contactPerson: 'Imani Lewis',
        companyId: 'company-1',
        isActive: true,
        address: {
            street: '10 Wharf Road',
            city: 'Manchester',
            state: 'Greater Manchester',
            zipCode: 'M1 2AB',
            country: 'UK',
        },
        createdAt: now,
        updatedAt: now,
        contactEmail: 'imani.lewis@northshore.dev',
        contactPhone: '+44 161 555 0101',
        billingAddress: 'Accounts Payable, PO Box 123, Manchester',
        paymentTerms: 'NET_30',
    },
];

const demoProjects: Project[] = [
    {
        id: 'project-1',
        companyId: 'company-1',
        name: 'Riverfront Apartments',
        description: '22 storey residential development with podium parking.',
        status: 'ACTIVE',
        budget: 12_500_000,
        spent: 5_400_000,
        startDate: '2024-01-05',
        endDate: '2025-12-20',
        location: {
            address: '10 Riverside Avenue',
            lat: 51.5074,
            lng: -0.1278,
            city: 'London',
        },
        clientId: 'client-1',
        managerId: 'user-1',
        image: undefined,
        progress: 48,
        actualCost: 5_120_000,
        geofenceRadius: 150,
        imageUrl: undefined,
        projectType: 'Residential',
        workClassification: 'Commercial',
        createdAt: now,
        updatedAt: now,
    },
    {
        id: 'project-2',
        companyId: 'company-1',
        name: 'Logistics Hub Expansion',
        description: 'Warehouse and yard expansion with smart monitoring.',
        status: 'ACTIVE',
        budget: 8_400_000,
        spent: 2_750_000,
        startDate: '2024-04-15',
        endDate: '2025-08-30',
        location: {
            address: '58 Industrial Lane',
            lat: 52.4862,
            lng: -1.8904,
            city: 'Birmingham',
        },
        clientId: 'client-1',
        managerId: 'user-2',
        image: undefined,
        progress: 32,
        actualCost: 2_540_000,
        geofenceRadius: 220,
        imageUrl: undefined,
        projectType: 'Industrial',
        workClassification: 'Logistics',
        createdAt: now,
        updatedAt: now,
    },
];

const demoUsers: User[] = [
    {
        id: 'user-1',
        firstName: 'Alex',
        lastName: 'Forrester',
        email: 'alex.forrester@example.com',
        role: Role.PROJECT_MANAGER,
        permissions: [
            Permission.MANAGE_PROJECT_DETAILS,
            Permission.VIEW_FINANCES,
            Permission.MANAGE_EQUIPMENT,
            Permission.SUBMIT_SAFETY_REPORT,
        ],
        companyId: 'company-1',
        isActive: true,
        isEmailVerified: true,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
                email: true,
                push: true,
                sms: false,
                taskReminders: true,
                projectUpdates: true,
                systemAlerts: true,
            },
            dashboard: {
                defaultView: 'dashboard',
                pinnedWidgets: [],
                hiddenWidgets: [],
            },
        },
    },
    {
        id: 'user-2',
        firstName: 'Sophie',
        lastName: 'Nguyen',
        email: 'sophie.nguyen@example.com',
        role: Role.FOREMAN,
        permissions: [Permission.SUBMIT_SAFETY_REPORT],
        companyId: 'company-1',
        isActive: true,
        isEmailVerified: true,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        preferences: {
            theme: 'dark',
            language: 'en',
            notifications: {
                email: true,
                push: true,
                sms: true,
                taskReminders: true,
                projectUpdates: false,
                systemAlerts: true,
            },
            dashboard: {
                defaultView: 'projects',
                pinnedWidgets: [],
                hiddenWidgets: [],
            },
        },
    },
];

const demoTasks: any[] = [
    {
        id: 'task-1',
        title: 'Foundation Pour',
        description: 'Complete foundation pour for main building',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: 'proj-1',
        assignedTo: ['user-1'],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
    },
    {
        id: 'task-2',
        title: 'Electrical Wiring',
        description: 'Install electrical wiring in floors 1-3',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: 'proj-1',
        assignedTo: ['user-2'],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
    },
];

const demoExpenses: any[] = [
    {
        id: 'expense-1',
        description: 'Concrete Supply',
        amount: 25000,
        currency: 'USD',
        category: 'Materials',
        projectId: 'proj-1',
        submittedBy: 'user-1',
        status: 'APPROVED',
        date: now,
        createdAt: now,
        updatedAt: now,
    },
    {
        id: 'expense-2',
        description: 'Equipment Rental',
        amount: 8500,
        currency: 'USD',
        category: 'Equipment',
        projectId: 'proj-2',
        submittedBy: 'user-2',
        status: 'PENDING',
        date: now,
        createdAt: now,
        updatedAt: now,
    },
];

const demoEquipment: Equipment[] = [
    {
        id: 'equipment-1',
        name: 'Tower Crane TC-320',
        type: 'Tower Crane',
        model: 'TC-320',
        serialNumber: 'TC320-001',
        status: EquipmentStatus.AVAILABLE,
        currentProjectId: 'project-1',
        lastMaintenanceDate: '2024-05-15',
        nextMaintenanceDate: '2024-08-15',
        purchaseDate: '2022-03-12',
        purchasePrice: 420_000,
        currentValue: 360_000,
        location: 'Riverfront Apartments',
        companyId: 'company-1',
        createdAt: now,
        updatedAt: now,
    },
    {
        id: 'equipment-2',
        name: 'Excavator EX-75',
        type: 'Excavator',
        model: 'EX-75',
        serialNumber: 'EX75-015',
        status: EquipmentStatus.MAINTENANCE,
        currentProjectId: undefined,
        lastMaintenanceDate: '2024-06-02',
        nextMaintenanceDate: '2024-07-20',
        purchaseDate: '2021-11-07',
        purchasePrice: 180_000,
        currentValue: 135_000,
        location: 'Central Depot',
        companyId: 'company-1',
        createdAt: now,
        updatedAt: now,
    },
];

const demoAssignments: ResourceAssignment[] = [
    {
        id: 'assignment-1',
        resourceType: 'user',
        resourceId: 'user-1',
        projectId: 'project-1',
        startDate: '2024-07-01',
        endDate: '2024-07-19',
    },
    {
        id: 'assignment-2',
        resourceType: 'equipment',
        resourceId: 'equipment-1',
        projectId: 'project-1',
        startDate: '2024-07-05',
        endDate: '2024-09-30',
    },
];

const demoInvoiceLineItems: InvoiceLineItem[] = [
    {
        id: 'line-1',
        description: 'Concrete pour – level 7',
        quantity: 1,
        rate: 142_000,
        amount: 142_000,
        unitPrice: 142_000,
    },
    {
        id: 'line-2',
        description: 'Tower crane hire',
        quantity: 1,
        rate: 37_400,
        amount: 37_400,
        unitPrice: 37_400,
    },
];

const demoInvoices: Invoice[] = [
    {
        id: 'invoice-1',
        companyId: 'company-1',
        invoiceNumber: 'INV-2024-001',
        projectId: 'project-1',
        clientId: 'client-1',
        issueDate: '2024-06-30',
        dueDate: '2024-07-30',
        status: InvoiceStatus.SENT,
        lineItems: demoInvoiceLineItems,
        subtotal: 179_400,
        taxRate: 0.2,
        taxAmount: 35_880,
        retentionRate: 0.05,
        retentionAmount: 8_970,
        total: 206_310,
        amountPaid: 50_000,
        balance: 156_310,
        notes: 'Progress claim #3',
        createdAt: now,
        updatedAt: now,
        payments: [
            {
                id: 'payment-1',
                invoiceId: 'invoice-1',
                amount: 50_000,
                date: '2024-07-10',
                method: 'BANK_TRANSFER',
                createdBy: 'user-1',
                createdAt: now,
            },
        ],
        issuedAt: '2024-06-30',
        dueAt: '2024-07-30',
    },
];

const demoIncidents: SafetyIncident[] = [
    {
        id: 'incident-1',
        companyId: 'company-1',
        projectId: 'project-1',
        reportedBy: 'user-2',
        reportedById: 'user-2',
        title: 'Near miss – crane swing',
        description: 'Tower crane swing entered exclusion zone during lift.',
        severity: IncidentSeverity.MEDIUM,
        status: IncidentStatus.UNDER_INVESTIGATION,
        incidentDate: '2024-06-18T09:30:00Z',
        location: 'Block B, level 12',
        witnessIds: [],
        actionsTaken: 'Area cordoned off and lift plan reviewed.',
        images: [],
        timestamp: '2024-06-18T10:15:00Z',
        createdAt: now,
        updatedAt: now,
    },
];

const financialSummary: FinancialKPIs = {
    profitability: 18.4,
    projectMargin: 24.1,
    cashFlow: 61_200,
    currency: 'GBP',
};

const financialMonthly: MonthlyFinancials[] = [
    { month: 'Jan', revenue: 48_000, profit: 12_000 },
    { month: 'Feb', revenue: 52_000, profit: 13_800 },
    { month: 'Mar', revenue: 61_000, profit: 15_400 },
    { month: 'Apr', revenue: 58_000, profit: 14_700 },
    { month: 'May', revenue: 64_000, profit: 16_500 },
    { month: 'Jun', revenue: 69_000, profit: 18_200 },
];

const financialForecasts: FinancialForecast[] = [
    {
        id: 'forecast-1',
        companyId: 'company-1',
        summary: 'Projected revenue uplift driven by two pipeline residential schemes.',
        horizonMonths: 6,
        createdAt: now,
        createdBy: 'user-1',
    },
];

export const api = {
    async getProjectsByCompany(companyId: string, _options?: { signal?: AbortSignal }) {
        await delay();
        return demoProjects.filter(project => project.companyId === companyId);
    },
    async getUsersByCompany(companyId: string, _options?: { signal?: AbortSignal }) {
        await delay();
        return demoUsers.filter(user => user.companyId === companyId);
    },
    async getEquipmentByCompany(companyId: string, _options?: { signal?: AbortSignal }) {
        await delay();
        return demoEquipment.filter(item => item.companyId === companyId);
    },
    async getResourceAssignments(companyId: string, _options?: { signal?: AbortSignal }) {
        await delay();
        const projectIds = new Set(demoProjects.filter(project => project.companyId === companyId).map(project => project.id));
        return demoAssignments.filter(assignment => projectIds.has(assignment.projectId));
    },
    async createResourceAssignment(data: Omit<ResourceAssignment, 'id'>, _userId: string) {
        await delay();
        const assignment: ResourceAssignment = { id: `assignment-${Date.now()}`, ...data };
        demoAssignments.push(assignment);
        return assignment;
    },
    async updateResourceAssignment(id: string, data: Omit<ResourceAssignment, 'id'>, _userId: string) {
        await delay();
        const index = demoAssignments.findIndex(item => item.id === id);
        if (index >= 0) {
            demoAssignments[index] = { id, ...data };
        }
        return demoAssignments[index];
    },
    async getSafetyIncidentsByCompany(companyId: string) {
        await delay();
        const projectIds = new Set(demoProjects.filter(project => project.companyId === companyId).map(project => project.id));
        return demoIncidents.filter(incident => projectIds.has(incident.projectId));
    },
    async createSafetyIncident(data: { projectId: number | string; description: string; severity: IncidentSeverity }, reportedBy: string) {
        await delay();
        const incident: SafetyIncident = {
            id: `incident-${Date.now()}`,
            companyId: 'company-1',
            projectId: String(data.projectId),
            reportedBy,
            reportedById: reportedBy,
            title: 'Safety incident',
            description: data.description,
            severity: data.severity,
            status: IncidentStatus.REPORTED,
            incidentDate: new Date().toISOString(),
            location: '',
            timestamp: new Date().toISOString(),
            createdAt: now,
            updatedAt: now,
        };
        demoIncidents.unshift(incident);
        return incident;
    },
    async updateSafetyIncidentStatus(id: string, status: IncidentStatus) {
        await delay();
        const incident = demoIncidents.find(item => item.id === id);
        if (incident) {
            incident.status = status;
            incident.updatedAt = new Date().toISOString();
        }
        return incident;
    },
    async getClientsByCompany(companyId: string) {
        await delay();
        return demoClients.filter(client => client.companyId === companyId);
    },
    async getInvoicesByCompany(companyId: string) {
        await delay();
        const projectIds = new Set(demoProjects.filter(project => project.companyId === companyId).map(project => project.id));
        return demoInvoices.filter(invoice => projectIds.has(invoice.projectId));
    },
    async updateEquipment(id: string, updates: Partial<Equipment>, _userId: string) {
        await delay();
        const equipment = demoEquipment.find(item => item.id === id);
        if (equipment) {
            Object.assign(equipment, updates, { updatedAt: new Date().toISOString() });
        }
        return equipment;
    },
    async createEquipment(payload: { name: string; status: Equipment['status'] }, _userId: string) {
        await delay();
        const equipment: Equipment = {
            id: `equipment-${Date.now()}`,
            name: payload.name,
            type: 'General Equipment',
            model: 'GEN-01',
            serialNumber: `GEN-${Date.now()}`,
            status: payload.status,
            currentProjectId: undefined,
            lastMaintenanceDate: now,
            nextMaintenanceDate: now,
            purchaseDate: now,
            purchasePrice: 25_000,
            currentValue: 20_000,
            location: 'Central Depot',
            companyId: 'company-1',
            createdAt: now,
            updatedAt: now,
        };
        demoEquipment.push(equipment);
        return equipment;
    },
    async getFinancialKPIsForCompany(_companyId: string) {
        await delay();
        return financialSummary;
    },
    async getMonthlyFinancials(_companyId: string) {
        await delay();
        return financialMonthly;
    },
    async getCostBreakdown(_companyId: string) {
        await delay();
        return [
            { category: 'Labour', amount: 35_000 },
            { category: 'Materials', amount: 27_000 },
            { category: 'Equipment', amount: 14_500 },
            { category: 'Subcontractors', amount: 21_000 },
        ];
    },
    async getFinancialForecasts(_companyId: string) {
        await delay();
        return financialForecasts;
    },
    
    // Additional API methods for components
    async getProjects() {
        await delay();
        return demoProjects;
    },
    async getTasks() {
        await delay();
        return demoTasks;
    },
    async createTask(data: any) {
        await delay();
        const task = { id: `task-${Date.now()}`, ...data, createdAt: now, updatedAt: now };
        demoTasks.push(task);
        return task;
    },
    async updateTask(id: string, updates: any) {
        await delay();
        const task = demoTasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates, { updatedAt: new Date().toISOString() });
        }
        return task;
    },
    async getTodosByProjectIds(projectIds: string[]) {
        await delay();
        return demoTasks.filter(task => projectIds.includes(String(task.projectId)));
    },
    async getExpenses() {
        await delay();
        return demoExpenses;
    },
    async createExpense(data: any) {
        await delay();
        const expense = { id: `expense-${Date.now()}`, ...data, createdAt: now, updatedAt: now };
        demoExpenses.push(expense);
        return expense;
    },
    async updateExpense(id: string, updates: any, userId?: string) {
        await delay();
        const expense = demoExpenses.find(e => e.id === id);
        if (expense) {
            Object.assign(expense, updates, { updatedAt: new Date().toISOString() });
        }
        return expense;
    },
    async submitExpense(data: any, userId: string) {
        await delay();
        return this.createExpense({ ...data, submittedBy: userId, status: 'PENDING' });
    },
    async getSafetyIncidents() {
        await delay();
        return demoIncidents;
    },
    async getUserPerformanceMetrics(userId: string) {
        await delay();
        return { efficiency: 85, tasksCompleted: 42, avgTaskTime: 120, totalHours: 160 };
    },
    async createUser(data: any, createdBy: string) {
        await delay();
        const user = { id: `user-${Date.now()}`, ...data, companyId: 'company-1', createdAt: now, updatedAt: now };
        demoUsers.push(user);
        return user;
    },
    async updateUser(id: string, updates: any, projectIds?: string[], updatedBy?: string) {
        await delay();
        const user = demoUsers.find(u => u.id === id);
        if (user) {
            Object.assign(user, updates, { updatedAt: new Date().toISOString() });
        }
        return user;
    },
    async getProjectAssignmentsByCompany(companyId: string, options?: { signal?: AbortSignal }) {
        await delay();
        return demoAssignments.filter(assignment => {
            const project = demoProjects.find(p => p.id === assignment.projectId);
            return project?.companyId === companyId;
        });
    },
    async createClient(data: any, userId: string) {
        await delay();
        const client = { id: `client-${Date.now()}`, ...data, companyId: 'company-1', createdAt: now, updatedAt: now };
        demoClients.push(client);
        return client;
    },
    async updateClient(id: string, updates: any, userId: string) {
        await delay();
        const client = demoClients.find(c => c.id === id);
        if (client) {
            Object.assign(client, updates, { updatedAt: new Date().toISOString() });
        }
        return client;
    },
    async getClientInsights(companyId: string, options?: { signal?: AbortSignal }) {
        await delay();
        return {
            totalRevenue: 1250000,
            activeProjects: 8,
            avgProjectValue: 156250,
            clientSatisfaction: 4.7,
            repeatClientRate: 65,
        };
    },
};

export const authApi = {
    async login() {
        await delay();
        return {
            token: 'demo-token',
            refreshToken: 'demo-refresh',
            user: demoUsers[0],
            company: { id: 'company-1', name: 'Demo Construction Co' },
            availableCompanies: [],
            activeCompanyId: 'company-1',
        } as const;
    },
    async register() {
        await delay();
    },
    async refreshToken() {
        await delay();
        return { token: 'demo-token', refreshToken: 'demo-refresh' } as const;
    },
};
