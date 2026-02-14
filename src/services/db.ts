/// <reference types="vite/client" />
import {
    Project,
    Task,
    TeamMember,
    ProjectDocument,
    Client,
    InventoryItem,
    RFI,
    PunchItem,
    DailyLog,
    Daywork,
    SafetyIncident,
    SafetyHazard,
    Equipment,
    Timesheet,
    Tenant,
    Transaction,
    TenantUsage,
    TenantAuditLog,
    TenantAnalytics,
    Defect,
    ProjectRisk,
    PurchaseOrder,
    Invoice,
    ExpenseClaim,
    CostCode,
    SystemHealth,
    MLModel,
    MLPrediction
} from '@/types';
// Ensure we always target /api/v1 regardless of whether env var includes /api or not
const getViteApiUrl = (): string | undefined => {
    try {
        return (0, eval)('import.meta.env?.VITE_API_URL') as string | undefined;
    } catch {
        return undefined;
    }
};

const getBaseUrl = () => {
    const envUrl = getViteApiUrl() || 'https://api.cortexbuildpro.com';
    // Remove trailing slash and any existing /api or /v1 suffix to get clean origin
    const origin = envUrl
        .replace(/\/$/, '')
        .replace(/\/api$/, '')
        .replace(/\/v1$/, '');
    return `${origin}/api/v1`;
};

const API_URL = getBaseUrl();

export class DatabaseService {
    private useMock = false;
    private tenantId: string | null = null;
    private headerCache: { headers: Record<string, string>; expires: number } | null = null;
    private readonly CACHE_TTL = 2000; // 2 seconds

    constructor() {
        // Health check removed from constructor to prevent unauthenticated 401 calls on landing page
    }

    setTenantId(id: string | null) {
        if (this.tenantId !== id) {
            this.tenantId = id;
            this.headerCache = null; // Invalidate cache on tenant change
        }
    }

    private get healthUrl(): string {
        // API_URL is https://api.cortexbuildpro.com/api/v1
        // We want https://api.cortexbuildpro.com/api/health
        return API_URL.replace(/\/v\d+$/, '') + '/health';
    }

    private async checkHealth() {
        try {
            // Use the PUBLIC /health endpoint (no auth required)
            // Previously used /projects which returns 401 for unauthenticated users,
            // incorrectly triggering mock mode
            const res = await fetch(this.healthUrl, { method: 'GET' });
            if (!res.ok) throw new Error('API Unreachable');
            const data = await res.json();
        } catch (e) {
            this.useMock = true;
        }
    }

    private async getHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
        const now = Date.now();
        // Cache only applies if no extra headers are requested (most common case)
        if (this.headerCache && this.headerCache.expires > now && Object.keys(extra).length === 0) {
            return this.headerCache.headers;
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
        if (this.tenantId) headers['x-company-id'] = this.tenantId;

        try {
            const storedToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
            if (storedToken) {
                headers['Authorization'] = `Bearer ${storedToken}`;
                console.debug('[DB Service] Auth token attached to request');
            } else {
                const devToken = localStorage.getItem('dev_auth_token');
                if (devToken) {
                    headers['Authorization'] = `Bearer ${devToken}`;
                    console.log('[DB Service] Using dev token from localStorage');
                } else {
                    console.warn('[DB Service] No active session found - API calls will fail with 401');
                }
            }
        } catch (e) {
            console.error('[DB Service] Error getting auth headers:', e);
        }

        // Cache the result for next time (only if no extra headers)
        if (Object.keys(extra).length === 0) {
            this.headerCache = {
                headers: { ...headers },
                expires: now + this.CACHE_TTL
            };
        }

        return headers;
    }

    // --- Generic Helpers ---
    async fetch<T>(endpoint: string): Promise<T[]> {
        if (this.useMock) {
            console.log(`[MockDB] Fetching ${endpoint}`);
            return [];
        }

        try {
            const res = await fetch(`${API_URL}/${endpoint}`, {
                headers: await this.getHeaders()
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`[API Error] Fetch failed for ${endpoint}: ${res.status}`, errorText);
                throw new Error(`API Fetch failed: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            const items = data?.data ?? data;

            if (!Array.isArray(items)) {
                console.warn(`[API Warning] Expected array from ${endpoint}, got ${items === null ? 'null' : typeof items}`);
                return [];
            }

            return items;
        } catch (e: any) {
            console.error(`[API Error] Fetch exception for ${endpoint}:`, {
                message: e.message,
                type: e.name,
                apiUrl: API_URL
            });
            throw e; // Propagate exception to caller
        }
    }

    private async getSingle<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
        if (this.useMock) {
            console.log(`[MockDB] Fetching Single ${endpoint}`);
            return null;
        }

        try {
            const res = await fetch(`${API_URL}/${endpoint}`, {
                ...options,
                headers: {
                    ...(await this.getHeaders()), // Await the promise here
                    ...options.headers
                }
            });

            if (!res.ok) {
                console.error(`[API Error] Fetch failed for ${endpoint}: ${res.status} ${res.statusText}`);
                return null;
            }

            const data = await res.json();
            return data.data || data; // Handle wrapped response { data: T } or direct T
        } catch (error) {
            console.error(`[API Error] Exception fetching ${endpoint}:`, error);
            return null;
        }
    }

    private async post<TResponse = any, TBody = any>(endpoint: string, data: TBody): Promise<TResponse | null> {
        if (this.useMock) {
            console.log(`[MockDB] POST ${endpoint}`, data);
            return { ...(data as any), id: 'mock-id-' + Date.now() } as any;
        }
        try {
            const headers = await this.getHeaders({ 'Content-Type': 'application/json' });

            const res = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`[API] Error response:`, errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText };
                }
                throw new Error(errorData.error || `Failed to post to ${endpoint} (${res.status})`);
            }

            const result = await res.json();
            console.log(`[API] Success response:`, result);
            return result;
        } catch (e) {
            console.error(`[API] Exception in POST ${endpoint}:`, e);
            throw e;
        }
    }

    private async put<TResponse = any, TBody = any>(endpoint: string, id: string, data: TBody): Promise<TResponse | null> {
        if (this.useMock) {
            console.log(`[MockDB] PUT ${endpoint}/${id}`, data);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'PUT',
                headers: await this.getHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`Failed to update ${endpoint}/${id}`);
        } catch (e) {
            console.error(`API Error (${endpoint}):`, e);
        }
    }

    private async patch<T = any>(endpoint: string, data: any): Promise<T | null> {
        if (this.useMock) {
            console.log(`[MockDB] PATCH ${endpoint}`, data);
            return null;
        }
        try {
            const res = await fetch(`${API_URL}/${endpoint}`, {
                method: 'PATCH',
                headers: await this.getHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const errorText = await res.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText };
                }
                throw new Error(errorData.error || `Failed to patch ${endpoint} (${res.status})`);
            }
            return await res.json();
        } catch (e) {
            console.error(`API Error (${endpoint}):`, e);
            throw e;
        }
    }

    private async delete(endpoint: string, id: string): Promise<void> {
        if (this.useMock) {
            console.log(`[MockDB] DELETE ${endpoint}/${id}`);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'DELETE',
                headers: await this.getHeaders()
            });
            if (!res.ok) throw new Error(`Failed to delete ${endpoint}/${id}`);
        } catch (e) {
            console.error(`API Error (${endpoint}):`, e);
        }
    }

    // --- Projects ---
    async getProjects(): Promise<Project[]> {
        return this.fetch<Project>('projects');
    }
    async addProject(p: Project) {
        await this.post('projects', p);
    }
    async updateProject(id: string, p: Partial<Project>) {
        await this.put('projects', id, p);
    }
    async deleteProject(id: string) {
        await this.delete('projects', id);
    }

    // --- Tasks ---
    async getTasks(projectId?: string): Promise<Task[]> {
        const query = projectId ? `?projectId=${projectId}` : '';
        return this.fetch<Task>(`tasks${query}`);
    }
    async addTask(t: Task) {
        await this.post('tasks', t);
    }
    async updateTask(id: string, t: Partial<Task>) {
        await this.put('tasks', id, t);
    }
    async getCriticalPath(projectId: string): Promise<any[]> {
        const data = await this.getSingle<any>(`tasks/analysis/critical-path?projectId=${projectId}`);
        return (data as any)?.data || [];
    }

    // --- Automations (Phase 14) ---
    async getAutomations(): Promise<any[]> {
        const data = await this.getSingle<any>('automations');
        return (data as any)?.data || [];
    }

    async createAutomation(a: any): Promise<any> {
        const data = await this.post<any>('automations', a);
        return (data as any)?.data;
    }

    async getAutomationJobs(): Promise<any[]> {
        return this.fetch('platform-automation/jobs');
    }

    async createAutomationJob(job: any): Promise<any> {
        return this.post('platform-automation/jobs', job);
    }

    async executeAutomationJob(id: string): Promise<any> {
        return this.post(`platform-automation/jobs/${id}/execute`, {});
    }

    async updateAutomationJob(id: string, updates: any): Promise<any> {
        return this.put('platform-automation/jobs', id, updates);
    }

    async deleteAutomationJob(id: string): Promise<void> {
        await this.delete('platform-automation/jobs', id);
    }

    // --- Predictive Intelligence (Phase 14) ---
    async getPredictiveAnalysis(projectId: string): Promise<any> {
        const data = await this.getSingle<any>(`predictive/${projectId}`);
        return (data as any)?.data;
    }

    async getBulkPredictiveAnalysis(): Promise<any[]> {
        const data = await this.getSingle<any>('predictive/all');
        return (data as any)?.data || [];
    }

    // --- AI Assets (Phase 6) ---
    async getAIAssets(type?: 'IMAGE' | 'VIDEO' | 'ANALYSIS', limit: number = 50): Promise<any[]> {
        const query = new URLSearchParams({ type: type || '', limit: limit.toString() }).toString();
        const data = await this.getSingle<any>(`ai/assets?${query}`);
        return (data as any)?.data || [];
    }

    // --- Client Portal (Phase 15) ---
    async validateShareToken(token: string, password?: string): Promise<any> {
        return this.post(`client-portal/shared/${token}/validate`, { password });
    }

    async getSharedProject(token: string): Promise<any> {
        const data = await this.getSingle<any>(`client-portal/shared/${token}`);
        return (data as any)?.data;
    }

    async getSharedDocuments(token: string): Promise<any[]> {
        const data = await this.getSingle<any>(`client-portal/shared/${token}/documents`);
        return (data as any)?.data || [];
    }

    async getSharedPhotos(token: string): Promise<any[]> {
        const data = await this.getSingle<any>(`client-portal/shared/${token}/photos`);
        return (data as any)?.data || [];
    }

    async saveAIAsset(asset: {
        type: string;
        url: string;
        prompt?: string;
        projectId?: string;
        metadata?: any;
    }): Promise<any> {
        const data = await this.post<any>('ai/assets', asset);
        return (data as any)?.data;
    }

    async deleteAIAsset(id: string): Promise<void> {
        await this.delete('ai/assets', id);
    }

    // --- OCR (Phase 14) ---
    async extractOcrData(file: File, type: string = 'general'): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const headers = await this.getHeaders();
        delete headers['Content-Type']; // Multipart handled by browser

        const res = await fetch(`${API_URL}/ocr/extract`, {
            method: 'POST',
            headers,
            body: formData
        });
        const data = await res.json();
        return data.data;
    }

    // --- Team ---
    async getTeam(): Promise<TeamMember[]> {
        return this.fetch<TeamMember>('team');
    }
    async addTeamMember(m: TeamMember) {
        await this.post('team', m);
    }

    // --- Vendors ---
    async getVendors(): Promise<any[]> {
        return this.fetch('vendors');
    }
    async addVendor(v: any) {
        await this.post('vendors', v);
    }
    async updateVendor(id: string, updates: Partial<any>) {
        await this.put('vendors', id, updates);
    }

    // --- Documents ---
    async getDocuments(): Promise<ProjectDocument[]> {
        return this.fetch<ProjectDocument>('documents');
    }
    async addDocument(d: Partial<ProjectDocument>) {
        await this.post('documents', d);
    }
    async updateDocument(id: string, d: Partial<ProjectDocument>) {
        await this.put('documents', id, d);
    }

    // --- Clients ---
    async getClients(): Promise<Client[]> {
        return this.fetch<Client>('clients');
    }
    async addClient(c: Client) {
        await this.post('clients', c);
    }

    // --- Inventory ---
    async getInventory(): Promise<InventoryItem[]> {
        return this.fetch<InventoryItem>('inventory');
    }
    async addInventoryItem(i: InventoryItem) {
        await this.post('inventory', i);
    }
    async updateInventoryItem(id: string, i: Partial<InventoryItem>) {
        await this.put('inventory', id, i);
    }

    // --- RFIs ---
    async getRFIs(): Promise<RFI[]> {
        return this.fetch<RFI>('rfis');
    }
    async addRFI(item: RFI) {
        await this.post('rfis', item);
    }
    async updateRFI(id: string, updates: Partial<RFI>) {
        await this.put('rfis', id, updates);
    }
    async deleteRFI(id: string) {
        await this.delete('rfis', id);
    }

    // --- Punch Items ---
    async getPunchItems(): Promise<PunchItem[]> {
        return this.fetch<PunchItem>('punch_items');
    }
    async addPunchItem(item: PunchItem) {
        await this.post('punch_items', item);
    }

    // --- Daily Logs ---
    async getDailyLogs(): Promise<DailyLog[]> {
        return this.fetch<DailyLog>('daily_logs');
    }
    async addDailyLog(item: DailyLog) {
        await this.post('daily_logs', item);
    }
    async updateDailyLog(id: string, updates: Partial<DailyLog>) {
        await this.put('daily_logs', id, updates);
    }
    async deleteDailyLog(id: string) {
        await this.delete('daily_logs', id);
    }

    // --- Dayworks ---
    async getDayworks(): Promise<Daywork[]> {
        return this.fetch<Daywork>('dayworks');
    }
    async addDaywork(item: Daywork) {
        await this.post('dayworks', item);
    }

    // --- Safety Incidents ---
    async getSafetyIncidents(): Promise<SafetyIncident[]> {
        return this.fetch<SafetyIncident>('safety_incidents');
    }
    async addSafetyIncident(item: SafetyIncident) {
        await this.post('safety_incidents', item);
    }
    async updateSafetyIncident(id: string, u: Partial<SafetyIncident>) {
        await this.put('safety_incidents', id, u);
    }

    // --- Safety Hazards ---
    async getSafetyHazards(): Promise<SafetyHazard[]> {
        return this.fetch<SafetyHazard>('safety_hazards');
    }
    async addSafetyHazard(item: SafetyHazard) {
        await this.post('safety_hazards', item);
    }
    async getSafetyChecklists(): Promise<any[]> {
        return this.fetch('compliance/safety-checklists');
    }

    // --- Equipment ---
    async getEquipment(): Promise<Equipment[]> {
        return this.fetch<Equipment>('equipment');
    }
    async addEquipment(item: Equipment) {
        await this.post('equipment', item);
    }
    async updateEquipment(id: string, u: Partial<Equipment>) {
        await this.put('equipment', id, u);
    }

    // --- Timesheets ---
    async getTimesheets(): Promise<Timesheet[]> {
        return this.fetch<Timesheet>('timesheets');
    }
    async addTimesheet(item: Timesheet) {
        await this.post('timesheets', item);
    }
    async updateTimesheet(id: string, u: Partial<Timesheet>) {
        if (this.useMock) return;
        await this.put('timesheets', id, u);
    }

    // --- Transactions ---
    async getTransactions(): Promise<Transaction[]> {
        return this.fetch<Transaction>('transactions');
    }
    async addTransaction(item: Transaction) {
        await this.post('transactions', item);
    }
    async updateTransaction(id: string, updates: Partial<Transaction>) {
        await this.put('transactions', id, updates);
    }

    // --- Purchase Orders ---
    async getPurchaseOrders(): Promise<PurchaseOrder[]> {
        return this.fetch<PurchaseOrder>('purchase_orders');
    }
    async addPurchaseOrder(item: PurchaseOrder) {
        await this.post('purchase_orders', item);
    }
    async updatePurchaseOrder(id: string, u: Partial<PurchaseOrder>) {
        await this.put('purchase_orders', id, u);
    }

    // --- Channels ---
    async getChannels(): Promise<any[]> {
        return this.fetch('channels');
    }
    async addChannel(item: any) {
        await this.post('channels', item);
    }

    // --- Team Messages ---
    async getTeamMessages(): Promise<any[]> {
        return this.fetch('team_messages');
    }
    async addTeamMessage(item: any) {
        await this.post('team_messages', item);
    }

    // --- Defects ---
    async getDefects(): Promise<Defect[]> {
        return this.fetch<Defect>('defects');
    }
    async addDefect(item: Defect) {
        await this.post('defects', item);
    }
    async updateDefect(id: string, u: Partial<Defect>) {
        await this.put('defects', id, u);
    }
    async deleteDefect(id: string) {
        await this.delete('defects', id);
    }

    // --- Project Health Forecasting ---
    async getProjectRisks(): Promise<ProjectRisk[]> {
        return this.fetch<ProjectRisk>('project_risks');
    }

    async addProjectRisk(item: ProjectRisk) {
        await this.post('project_risks', item);
    }

    // --- Companies ---
    async getCompanies(): Promise<Tenant[]> {
        return this.fetch<Tenant>('companies/all');
    }
    async addCompany(item: Tenant) {
        await this.post('companies', item);
    }
    async updateCompany(id: string, updates: Partial<Tenant>) {
        await this.put('companies', id, updates);
    }
    async deleteCompany(id: string) {
        await this.delete('companies', id);
    }

    // --- Dashboards & Widgets ---
    async getDashboards(): Promise<any[]> {
        return this.fetch<any>('dashboard');
    }

    async createDashboard(data: any): Promise<any> {
        return this.post('dashboard', data);
    }

    async getDashboardWidgets(dashboardId: string): Promise<any[]> {
        return this.fetch<any>(`dashboard/${dashboardId}/widgets`);
    }

    async addWidget(dashboardId: string, widgetData: any): Promise<any> {
        return this.post(`dashboard/${dashboardId}/widgets`, widgetData);
    }

    async updateWidget(id: string, data: any): Promise<any> {
        return this.put('dashboard/widgets', id, data);
    }

    async deleteWidget(widgetId: string): Promise<void> {
        await this.delete('dashboard/widgets', widgetId);
    }

    async provisionCompany(data: any): Promise<any> {
        if (this.useMock) {
            console.log('Mock: Provisioning company', data);
            return { success: true };
        }

        console.log('[ProvisionCompany] Starting company provisioning...', { data });

        try {
            const headers = await this.getHeaders({ 'Content-Type': 'application/json' });
            console.log('[ProvisionCompany] Headers prepared:', {
                hasAuth: !!headers.Authorization,
                authPreview: headers.Authorization ? `Bearer ${headers.Authorization.substring(7, 30)}...` : 'missing'
            });

            const res = await fetch(`${API_URL}/companies`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });

            console.log(`[ProvisionCompany] Response: ${res.status} ${res.statusText}`);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('[ProvisionCompany] API Error Response:', {
                    status: res.status,
                    statusText: res.statusText,
                    body: errorText
                });
                throw new Error(`Company provisioning failed: ${res.status} ${res.statusText}`);
            }

            const result = await res.json();
            console.log('[ProvisionCompany] Success:', result);
            return result;
        } catch (error: any) {
            console.error('[ProvisionCompany] Network or Fetch Error:', {
                message: error.message,
                apiUrl: API_URL,
                endpoint: '/companies'
            });
            throw error;
        }
    }

    // --- Company Management ---
    async getCompanyStats(): Promise<any> {
        const data = await this.getSingle<any>('companies/stats');
        return data || {};
    }

    // --- Tenant Analytics & Security ---
    async getTenantUsage(tenantId: string): Promise<TenantUsage> {
        const data = await this.getSingle<TenantUsage>(`tenants/${tenantId}/usage`);
        if (!data) throw new Error('Failed to fetch usage');
        return data;
    }

    async getAuditLogs(tenantId: string): Promise<TenantAuditLog[]> {
        return this.fetch<TenantAuditLog>(`audit_logs?tenantId=${tenantId}`);
    }

    // --- Multi-Tenant Intelligence & Roles ---
    async getTenantAnalytics(tenantId: string): Promise<TenantAnalytics> {
        const data = await this.getSingle<TenantAnalytics>(`tenants/${tenantId}/analytics`);
        if (!data) throw new Error('Failed to fetch analytics');
        return data;
    }

    async checkTenantLimits(tenantId: string, resourceType: string): Promise<any> {
        const data = await this.getSingle<any>(`tenants/${tenantId}/limits/${resourceType}`);
        if (!data) throw new Error('Failed to check limits');
        return data;
    }

    async getPlatformAnalytics(): Promise<any> {
        return await this.getSingle<any>('platform/analytics');
    }

    async getAdvancedMetrics(): Promise<any> {
        return await this.getSingle<any>('platform/metrics');
    }

    // --- API Management (Command Center) ---
    async getAPIKeys(): Promise<any[]> {
        return this.fetch('api-management/keys');
    }

    async createAPIKey(data: any): Promise<any> {
        return this.post('api-management/keys', data);
    }

    async deleteAPIKey(id: string): Promise<void> {
        return this.delete('api-management/keys', id);
    }

    async getWebhooks(): Promise<any[]> {
        return this.fetch('api-management/webhooks');
    }

    async createWebhook(data: any): Promise<any> {
        return this.post('api-management/webhooks', data);
    }

    async deleteWebhook(id: string): Promise<void> {
        return this.delete('api-management/webhooks', id);
    }

    async testWebhook(id: string, payload: any = {}): Promise<any> {
        return this.post(`api-management/webhooks/${id}/test`, payload);
    }

    // --- Access Control ---
    async getRoles(): Promise<any[]> {
        return this.fetch('roles');
    }

    async createRole(role: any): Promise<any> {
        return this.post('roles', role);
    }

    async updateRolePermissions(roleId: string, permissions: any): Promise<void> {
        return this.put('roles', `${roleId}/permissions`, { permissions });
    }

    // --- User Management Extensions ---
    async createUser(user: any, companyId?: string): Promise<any> {
        // Alias to provisionUser or separate endpoint
        const payload = companyId ? { ...user, companyId } : user;
        return this.post('users', payload);
    }

    // Removed duplicate deleteUser

    async bulkInviteUsers(invitations: any[], companyId: string, role: string): Promise<any> {
        return this.post('users/bulk-invite', { invitations, companyId, role });
    }

    // --- Support Tickets ---
    async getTickets(): Promise<any[]> {
        return this.fetch('support/admin/tickets');
    }

    async getTicketMessages(ticketId: string): Promise<any[]> {
        return this.fetch(`support/admin/tickets/${ticketId}/messages`);
    }

    async replyToTicket(ticketId: string, message: string): Promise<any> {
        return this.post(`support/admin/tickets/${ticketId}/reply`, { message });
    }

    async updateTicketStatus(ticketId: string, status: string): Promise<void> {
        return this.put('support/admin/tickets', `${ticketId}/status`, { status });
    }

    // --- Security ---
    async getActiveImpersonationSessions(): Promise<any[]> {
        return this.fetch('security/impersonation-sessions');
    }

    // --- Export ---
    async requestDataExport(companyId?: string): Promise<any> {
        const targetCompanyId = companyId || this.tenantId;
        if (!targetCompanyId) {
            throw new Error('Company ID is required for data export');
        }
        return this.getSingle<any>(`analytics/export?companyId=${encodeURIComponent(targetCompanyId)}`);
    }

    async getPlatformAuditLogs(filters: {
        limit?: number;
        offset?: number;
        action?: string;
        userId?: string;
        resource?: string;
        companyId?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
    } = {}): Promise<any[]> {
        const p = new URLSearchParams();
        if (filters.limit) p.append('limit', filters.limit.toString());
        if (filters.offset) p.append('offset', filters.offset.toString());
        if (filters.action && filters.action !== 'ALL') p.append('action', filters.action);
        if (filters.userId) p.append('userId', filters.userId);
        if (filters.resource) p.append('resource', filters.resource);
        if (filters.companyId && filters.companyId !== 'all') p.append('companyId', filters.companyId);
        if (filters.startDate) p.append('startDate', filters.startDate);
        if (filters.endDate) p.append('endDate', filters.endDate);
        if (filters.search) p.append('search', filters.search);

        return await this.fetch<any>(`platform/audit-logs?${p.toString()}`);
    }

    async getGlobalAuditLogs(filters: any = {}): Promise<any[]> {
        return this.getPlatformAuditLogs(filters);
    }

    // --- Platform Notifications (Phase 11) ---
    async getPlatformEvents(limit: number = 20): Promise<any[]> {
        return this.fetch(`notifications/events?limit=${limit}`);
    }

    async markPlatformEventRead(id: string): Promise<void> {
        await this.put('notifications/events', `${encodeURIComponent(id)}/read`, {});
    }

    async markAllPlatformEventsRead(): Promise<void> {
        await this.post('notifications/events/mark-all-read', {});
    }

    async getUserRoles(userId: string, companyId: string): Promise<any[]> {
        return await this.fetch<any>(`user-roles/${encodeURIComponent(userId)}/${encodeURIComponent(companyId)}`);
    }

    async getUserPermissions(): Promise<string[]> {
        const data = await this.getSingle<any>('user/permissions');
        return Array.isArray(data) ? data : [];
    }

    async getContext(): Promise<any> {
        return await this.getSingle<any>('user/me');
    }

    // --- Company Modules ---
    async getCompanyModules(): Promise<{ enabledModules: string[]; moduleDetails?: any[] }> {
        const data = await this.getSingle<{ enabledModules: string[]; moduleDetails?: any[] }>(
            'modules/features/my-company'
        );
        return data || { enabledModules: [] };
    }

    // --- Platform API (Super Admin) ---
    async getPlatformStats(): Promise<any> {
        const data = await this.getSingle<any>('platform/stats');
        return (
            data || { totalCompanies: 0, totalUsers: 0, totalProjects: 0, monthlyRevenue: 0, systemStatus: 'unknown' }
        );
    }

    async getSystemHealth(): Promise<any> {
        return await this.getSingle<any>('platform/health');
    }

    async getSystemPerformanceHistory(): Promise<any[]> {
        return await this.fetch<any>('platform/performance/history');
    }

    async executeSql(query: string): Promise<{ success: boolean; duration: string; result: any; error?: string }> {
        return await this.post('platform/sql', { query });
    }

    async sendTargetedBroadcast(filter: any, message: string): Promise<void> {
        await this.post('platform/broadcast/targeted', { filter, message });
    }

    async sendBroadcast(message: string, level: 'info' | 'warning' | 'critical' = 'info'): Promise<void> {
        await this.post('platform/broadcast', { message, level });
    }


    async getPlatformAlerts(): Promise<any[]> {
        return await this.fetch<any>('platform/alerts');
    }

    async getSecurityStats(): Promise<any> {
        const data = await this.getSingle<any>('platform/security/stats');
        return data || { securityScore: 0, activeSessions: 0, failedLogins24h: 0 };
    }

    async getAllPlatformUsers(
        companyId?: string,
        filters: { role?: string; status?: string; search?: string } = {}
    ): Promise<any[]> {
        const p = new URLSearchParams();
        if (companyId) p.append('tenantId', companyId);
        if (filters.role && filters.role !== 'all') p.append('role', filters.role);
        if (filters.status && filters.status !== 'all') p.append('status', filters.status);
        if (filters.search) p.append('search', filters.search);

        return await this.fetch<any>(`platform/users?${p.toString()}`);
    }

    async searchPlatformUsers(
        query: string,
        role: string = 'all',
        status: string = 'all',
        limit: number = 50,
        offset: number = 0
    ): Promise<{ users: any[]; total: number }> {
        return await this.post<{ users: any[]; total: number }>('platform/users/search', {
            query,
            role,
            status,
            limit,
            offset
        });
    }

    async bulkUserAction(
        userIds: string[],
        action: 'suspend' | 'activate' | 'reset_password' | 'delete',
        reason?: string
    ): Promise<{ success: boolean; results: any }> {
        return await this.post<{ success: boolean; results: any }>('platform/users/bulk-action', {
            userIds,
            action,
            reason
        });
    }

    async suspendCompany(id: string, reason: string): Promise<void> {
        if (this.useMock) {
            console.log(`[MockDB] Suspending company ${id}`);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/companies/${id}/suspend`, {
                method: 'POST',
                headers: await this.getHeaders(),
                body: JSON.stringify({ reason })
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`[API Error] Suspend company failed:`, errorText);
                throw new Error(errorText || `Failed to suspend company: ${res.status}`);
            }

            console.log(`[API Success] Company ${id} suspended`);
        } catch (error) {
            console.error('[API Error] Exception suspending company:', error);
            throw error;
        }
    }

    async activateCompany(id: string): Promise<void> {
        if (this.useMock) {
            console.log(`[MockDB] Activating company ${id}`);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/companies/${id}/activate`, {
                method: 'POST',
                headers: await this.getHeaders(),
                body: JSON.stringify({})
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`[API Error] Activate company failed:`, errorText);
                throw new Error(errorText || `Failed to activate company: ${res.status}`);
            }

            console.log(`[API Success] Company ${id} activated`);
        } catch (error) {
            console.error('[API Error] Exception activating company:', error);
            throw error;
        }
    }

    async bulkSuspendCompanies(ids: string[]): Promise<void> {
        if (this.useMock) {
            console.log(`[MockDB] Bulk suspending ${ids.length} companies`);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/platform/companies/bulk-suspend`, {
                method: 'POST',
                headers: await this.getHeaders(),
                body: JSON.stringify({ ids })
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`[API Error] Bulk suspend failed:`, errorText);
                throw new Error(errorText || `Failed to bulk suspend companies: ${res.status}`);
            }

            console.log(`[API Success] Bulk suspended ${ids.length} companies`);
        } catch (error) {
            console.error('[API Error] Exception bulk suspending companies:', error);
            throw error;
        }
    }

    async bulkActivateCompanies(ids: string[]): Promise<void> {
        if (this.useMock) {
            console.log(`[MockDB] Bulk activating ${ids.length} companies`);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/platform/companies/bulk-activate`, {
                method: 'POST',
                headers: await this.getHeaders(),
                body: JSON.stringify({ ids })
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`[API Error] Bulk activate failed:`, errorText);
                throw new Error(errorText || `Failed to bulk activate companies: ${res.status}`);
            }

            console.log(`[API Success] Bulk activated ${ids.length} companies`);
        } catch (error) {
            console.error('[API Error] Exception bulk activating companies:', error);
            throw error;
        }
    }

    async updateCompanyLimits(id: string, limits: any): Promise<void> {
        await this.put('companies', `${id}/limits`, limits);
    }

    async getCompanyFeatures(id: string): Promise<any> {
        return await this.getSingle<any>(`companies/${id}/features`);
    }

    async updateCompanyFeatures(id: string, features: any): Promise<void> {
        await this.put('companies', `${id}/features`, { features });
    }

    async toggleCompanyFeature(id: string, featureName: string, enabled: boolean): Promise<void> {
        await this.patch(`companies/${id}/features/${featureName}`, { enabled });
    }

    async getCompanyDatabaseControl(id: string): Promise<any> {
        return await this.getSingle<any>(`companies/${id}/database-control`);
    }

    async updateCompanyDatabaseControl(id: string, data: any): Promise<void> {
        await this.put('companies', `${id}/database-control`, data);
    }

    async updateUserStatus(id: string, status: string): Promise<void> {
        await this.put('platform/users', `${id}/status`, { status });
    }

    async provisionUser(userData: any): Promise<any> {
        return await this.post('platform/users', userData);
    }

    async updatePlatformUserRole(id: string, role: string, companyId?: string): Promise<void> {
        await this.put('users', `${id}/role`, { role, companyId });
    }

    async updatePlatformUser(id: string, data: any): Promise<void> {
        await this.put('platform/users', id, data);
    }

    async resetUserPassword(id: string): Promise<void> {
        await this.post(`platform/users/${id}/reset-password`, {});
    }

    async deleteUser(id: string): Promise<void> {
        await this.delete('platform/users', id);
    }

    // --- System Settings (Admin) ---
    async getSystemSettings(): Promise<any> {
        return (await this.getSingle<any>('platform/config')) || {};
    }

    async updateSystemSettings(settings: any): Promise<void> {
        await this.post('platform/config', settings);
    }

    // Alias methods for GlobalSettingsView compatibility
    async getPlatformConfig(): Promise<any> {
        return await this.getSystemSettings();
    }

    async updatePlatformConfig(settings: any): Promise<void> {
        await this.updateSystemSettings(settings);
    }

    async verifyEmailConfig(): Promise<any> {
        return await this.post('platform/config/verify/email', {});
    }

    async verifyPushConfig(): Promise<any> {
        return await this.post('platform/config/verify/push', {});
    }

    async verifyAiConfig(): Promise<any> {
        return await this.post('platform/config/verify/ai', {});
    }

    async flushSystemCache(): Promise<any> {
        return await this.post('platform/cache/flush', {});
    }

    async flushCache(): Promise<void> {
        await this.flushSystemCache();
    }

    async restartServices(service: string = 'all'): Promise<any> {
        return await this.post('platform/restart', { service });
    }

    async scheduleMaintenance(startTime: string, duration: number): Promise<void> {
        await this.post('platform/maintenance', { startTime, duration });
    }

    async getPlatformLogs(lines: number = 200): Promise<{ logs: string; exists: boolean; size?: number; lastUpdated?: string }> {
        return await this.getSingle<any>(`platform/logs?lines=${lines}`);
    }

    async getFeatureFlags(): Promise<any[]> {
        return await this.fetch('platform/features');
    }

    async updateFeatureFlag(name: string, enabled: boolean): Promise<void> {
        await this.put('platform/features', name, { enabled });
    }

    // --- Analytics ---
    async getKPIs(): Promise<any> {
        return await this.getSingle<any>('analytics/executive/kpis');
    }

    // --- Database Management ---
    async getDatabaseHealth(): Promise<any> {
        return await this.getSingle<any>('platform/database/health');
    }

    async createDatabaseBackup(): Promise<any> {
        return await this.post('platform/database/backup', {});
    }

    async triggerDatabaseBackup(): Promise<any> {
        return await this.createDatabaseBackup();
    }

    async listDatabaseBackups(): Promise<any> {
        return await this.getSingle<any>('platform/database/backups');
    }

    async downloadDatabaseBackup(filename: string): Promise<void> {
        try {
            const response = await fetch(`${API_URL}/platform/database/backups/${filename}/download`, {
                headers: await this.getHeaders()
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Database backup download failed:', error);
            throw error;
        }
    }

    async cleanupDatabase(type: string, days: number): Promise<any> {
        return await this.post('platform/database/cleanup', { type, days });
    }

    // --- Storage Management ---
    async listBuckets(): Promise<any> {
        return await this.getSingle<any>('storage/buckets');
    }

    async getCompanyStorageStats(companyId: string): Promise<any> {
        return await this.getSingle<any>(`storage/company/${companyId}/stats`);
    }

    async updateStorageQuota(companyId: string, quotaGB: number): Promise<any> {
        return await this.put('storage', `company/${companyId}/quota`, { quotaGB });
    }

    async getCustomReport(params: any): Promise<any> {
        const query = new URLSearchParams(params as any).toString();
        return await this.getSingle<any>(`analytics/custom?${query}`);
    }

    async getProjectProgress(): Promise<any[]> {
        const data = await this.getSingle<any>('analytics/projects/progress');
        return data || [];
    }

    async getExecutiveKPIs(): Promise<any> {
        const data = await this.getSingle<any>('analytics/executive/kpis');
        // Default fallback if data is missing, to prevent UI crash
        return (
            (data as any)?.data || {
                activeProjects: 0,
                budgetHealth: { percentageUsed: '0%' },
                safetyScore: 100,
                teamVelocity: 0
            }
        );
    }

    async getFinancialTrends(): Promise<any[]> {
        const data = await this.getSingle<any>('analytics/financial/trends');
        return (data as any)?.data || [];
    }

    async getCostVarianceTrend(): Promise<any[]> {
        const data = await this.getSingle<any>('analytics/financial/variance');
        return (data as any)?.data || [];
    }

    async getResourceUtilization(): Promise<any[]> {
        const data = await this.getSingle<any>('analytics/resources/utilization');
        return (data as any)?.data || [];
    }

    async getSafetyMetrics(): Promise<any[]> {
        const data = await this.getSingle<any>('analytics/safety/metrics');
        return (data as any)?.data || [];
    }

    async getProjectHealth(projectId: string): Promise<any> {
        const data = await this.getSingle<any>(`analytics/projects/${projectId}/health`);
        return (data as any)?.data || { status: 'Unknown', score: 0 };
    }

    // --- Legacy / Missing Methods (Added for Type Compatibility) ---

    // MarketPlace
    async getMarketplaceCategories(): Promise<any[]> {
        return this.fetch('modules/marketplace/categories');
    }
    async getMarketplaceModules(): Promise<any[]> {
        return this.fetch('modules/marketplace');
    }
    async getInstalledModules(companyId: string): Promise<any[]> {
        return this.fetch(`modules/marketplace/installed/${companyId}`);
    }
    async installModule(moduleId: string, companyId: string): Promise<any> {
        return this.post(`modules/marketplace/install/${moduleId}`, { companyId });
    }
    async uninstallModule(moduleId: string, companyId: string): Promise<void> {
        await this.post(`modules/marketplace/uninstall/${moduleId}`, { companyId });
    }
    async configureModule(moduleId: string, companyId: string, config: any): Promise<void> {
        await this.put('modules/marketplace/config', moduleId, { companyId, config });
    }

    // ML / Insights
    async getMLModels(): Promise<MLModel[]> {
        return this.fetch<MLModel>('ml-models');
    }
    async getMLPredictions(): Promise<MLPrediction[]> {
        return this.fetch<MLPrediction>('ml-predictions');
    }
    async savePrediction(modelId: string, prediction: any): Promise<any> {
        return this.post('ml-predictions', { modelId, ...prediction });
    }
    async trainMLModel(modelId: string): Promise<void> {
        await this.post(`ml-models/${modelId}/train`, {});
    }

    // Permissions / Access Control
    async getPermissions(): Promise<string[]> {
        return this.getUserPermissions();
    }
    async getRolePermissions(roleId: string): Promise<string[]> {
        const data = await this.getSingle<any>(`roles/${roleId}/permissions`);
        return data || [];
    }

    // Notifications
    async getNotifications(): Promise<any[]> {
        return this.fetch('notifications');
    }
    async markNotificationAsRead(id: string): Promise<void> {
        await this.put('notifications', `${encodeURIComponent(id)}/read`, {});
    }

    // Integrations
    async getIntegrations(types: string[] = ['procore', 'plangrid', 'autodesk']): Promise<any[]> {
        const results = await Promise.all(
            types.map(async (type) => {
                const data = await this.getSingle<any>(`integrations/${encodeURIComponent(type)}`);
                if (!data) return { type, status: 'disconnected' };
                return { type, ...data };
            })
        );
        return results;
    }
    async toggleIntegration(
        type: string,
        enabled: boolean,
        tokens?: { access: string; refresh?: string }
    ): Promise<void> {
        if (!enabled) {
            throw new Error('Disconnect is not supported by the API');
        }
        if (!tokens?.access) {
            throw new Error('Integration tokens are required to connect');
        }
        await this.post('integrations/connect', { type, tokens });
    }
    async getIntegrationConfig(type: string): Promise<any> {
        return this.getSingle(`integrations/${encodeURIComponent(type)}`);
    }
    async updateIntegrationConfig(type: string, config: any): Promise<void> {
        const tokens = config?.tokens ?? config;
        const access = tokens?.access || tokens?.accessToken;
        const refresh = tokens?.refresh || tokens?.refreshToken;
        if (!access) {
            throw new Error('Integration tokens are required to connect');
        }
        await this.post('integrations/connect', { type, tokens: { access, refresh } });
    }
    async syncIntegration(type: string, externalProjectId?: string): Promise<void> {
        await this.post('integrations/sync', { type, externalProjectId });
    }

    // Team / Invitations
    async resendInvitation(invitationId: string): Promise<void> {
        await this.post(`invitations/${invitationId}/resend`, {});
    }
    async cancelInvitation(invitationId: string): Promise<void> {
        await this.delete('invitations', invitationId);
    }
    async updateMemberRole(userId: string, role: string, companyId?: string): Promise<void> {
        const targetCompanyId = companyId || this.tenantId;
        if (!targetCompanyId) {
            throw new Error('Company ID is required to update a member role');
        }
        await this.put(`companies/${targetCompanyId}/members/${userId}`, 'role', { role });
    }
    async removeMember(userId: string, companyId?: string): Promise<void> {
        const targetCompanyId = companyId || this.tenantId;
        if (!targetCompanyId) {
            throw new Error('Company ID is required to remove a member');
        }
        await this.delete(`companies/${targetCompanyId}/members`, userId);
    }

    // Companies (Legacy names)
    async getCompanyDetails(id: string): Promise<any> {
        return this.getSingle(`companies/${id}/details`);
    }
    async getCompanyMembers(id: string): Promise<any[]> {
        return this.fetch(`companies/${id}/members`);
    }
    async inviteCompanyAdmin(companyId: string, email: string, name: string): Promise<void> {
        await this.post(`companies/${companyId}/admins`, { email, name });
    }
    async updateMyCompany(updates: any): Promise<void> {
        if (this.tenantId) {
            await this.updateCompany(this.tenantId, updates);
        }
    }

    // Compliance / Safety Checklists
    async createSafetyChecklist(data: any): Promise<any> {
        return this.post('compliance/safety-checklists', data);
    }
    async updateSafetyChecklistItem(id: string, updates: any): Promise<void> {
        await this.put('compliance/safety-checklists/items', id, updates);
    }
    async submitSafetyChecklist(id: string): Promise<any> {
        return this.post(`compliance/safety-checklists/${id}/submit`, {});
    }

    // --- Batch 2 Legacy Methods ---

    // Activity Feed
    async markAllNotesAsRead(): Promise<void> {
        await this.post('notifications/mark-all-read', {});
    }

    // Project Finance
    async getInvoices(): Promise<Invoice[]> {
        return this.fetch<Invoice>('financials/invoices');
    }
    async addInvoice(invoice: any): Promise<void> {
        await this.post('financials/invoices', invoice);
    }
    async updateInvoice(id: string, updates: any): Promise<void> {
        await this.put('financials/invoices', id, updates);
    }
    async deleteInvoice(id: string): Promise<void> {
        await this.delete('financials/invoices', id);
    }

    async getExpenseClaims(): Promise<ExpenseClaim[]> {
        return this.fetch<ExpenseClaim>('financials/expenses');
    }
    async addExpenseClaim(claim: any): Promise<void> {
        await this.post('financials/expenses', claim);
    }
    async updateExpenseClaim(id: string, updates: any): Promise<void> {
        await this.put('financials/expenses', id, updates);
    }

    async getCostCodes(): Promise<CostCode[]> {
        return this.fetch<CostCode>('financials/cost-codes');
    }
    async addCostCode(code: any): Promise<void> {
        await this.post('financials/cost-codes', code);
    }
    async updateCostCode(id: string, updates: any): Promise<void> {
        await this.put('financials/cost-codes', id, updates);
    }

    // Tenant / Access
    async getAccessLogs(): Promise<any[]> {
        return this.fetch('access/logs');
    }
    async addAccessLog(log: any): Promise<void> {
        await this.post('access/logs', log);
    }

    // Integrations
    async syncProject(options: any): Promise<void> {
        await this.post('projects', options);
    }
    async registerWebhook(config: any): Promise<any> {
        return this.createWebhook(config);
    }
    async triggerWebhook(id: string, payload: any): Promise<void> {
        return this.testWebhook(id, payload);
    }

    // Team
    async getCompanyInvitations(companyId: string): Promise<any[]> {
        return this.fetch(`invitations/company/${companyId}`);
    }
    async inviteUser(companyId: string, email: string, role: string): Promise<void> {
        await this.post('invitations', { companyId, email, role });
    }

    // --- Batch 3 Legacy Methods ---

    // Auth / Impersonation
    async impersonateUser(userId: string, reason?: string): Promise<{ user: any; token: string }> {
        const res = await this.post<any>('impersonation/start', { userId, reason });
        return res || { user: { id: userId }, token: 'mock-impersonation-token' };
    }
    async stopImpersonation(): Promise<void> {
        await this.post('impersonation/stop', {});
    }

    // Comments
    async getComments(entityId: string, entityType: string): Promise<any[]> {
        return this.fetch(`comments?entityId=${entityId}&entityType=${entityType}`);
    }
    async addComment(comment: any): Promise<any> {
        return this.post('comments', comment);
    }
    async updateComment(id: string, updates: any): Promise<void> {
        await this.put('comments', id, updates);
    }
    async deleteComment(id: string): Promise<void> {
        await this.delete('comments', id);
    }

    // Global Search
    async globalSearch(query: string, global: boolean = true): Promise<any> {
        const q = encodeURIComponent(query);
        return this.getSingle(`search?q=${q}&global=${global}`);
    }

    // Sidebar
    async getSidebarStats(): Promise<any> {
        const data = await this.getSingle<any>('platform/sidebar/stats');
        return data || {};
    }

    // Activity Feed
    async getActivities(options: any = {}): Promise<any[]> {
        const query = new URLSearchParams(options).toString();
        return this.fetch(`activity?${query}`);
    }

    // Notifications (Single)
    async markNoteAsRead(id: string): Promise<void> {
        await this.put('notifications', `${encodeURIComponent(id)}/read`, {});
    }
}

export const db = new DatabaseService();
