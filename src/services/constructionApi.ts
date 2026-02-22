import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${API_BASE_URL}/construction`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Inspection {
    id: string;
    projectId: string;
    companyId: string;
    inspectionNumber: string;
    title: string;
    type: string; // safety, quality, progress, final
    scheduledDate: string;
    inspector: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'passed';
    location?: string;
    checklist?: string; // JSON
    findings?: string; // JSON
    deficiencies?: string; // JSON
    passFailStatus?: 'passed' | 'failed' | 'conditional';
    notes?: string;
    photos?: string; // JSON
    attachments?: string; // JSON
    completedAt?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface InspectionTemplate {
    id: string;
    companyId: string;
    name: string;
    type: string;
    checklist: string; // JSON
    description?: string;
    isActive: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface QualityIssue {
    id: string;
    companyId: string;
    projectId: string;
    inspectionId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: string;
    assignedTo: string;
    status: 'open' | 'in_progress' | 'resolved';
    photos: string[];
    createdAt: string;
    updatedAt: string;
}

export interface MaterialDelivery {
    id: string;
    companyId: string;
    projectId: string;
    material: string;
    quantity: number;
    unit: string;
    supplier: string;
    deliveryDate: string;
    poNumber?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MaterialInventory {
    id: string;
    companyId: string;
    projectId: string;
    material: string;
    quantity: number;
    unit: string;
    location: string;
    minQuantity: number;
    lastUpdated: string;
}

export interface MaterialRequisition {
    id: string;
    companyId: string;
    projectId: string;
    material: string;
    quantity: number;
    unit: string;
    requestedBy: string;
    urgency: 'low' | 'medium' | 'high';
    status: 'pending' | 'approved' | 'ordered' | 'delivered';
    notes?: string;
    createdAt: string;
}

export interface ChangeOrder {
    id: string;
    companyId: string;
    projectId: string;
    pcoId?: string;
    coNumber: string;
    title: string;
    description?: string;
    originalCost: number;
    revisedCost: number;
    costDelta: number;
    originalDays: number;
    revisedDays: number;
    daysDelta: number;
    status: 'pending' | 'approved' | 'rejected' | 'executed';
    approvedBy?: string;
    approvedAt?: string;
    executedAt?: string;
    reasonForChange?: string;
    impact?: string; // JSON
    attachments?: string; // JSON
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface PCO {
    id: string;
    projectId: string;
    companyId: string;
    pcoNumber: string;
    title: string;
    description?: string;
    requestedBy: string;
    requestDate: string;
    estimatedCost?: number;
    estimatedDays?: number;
    status: 'draft' | 'pending' | 'converted' | 'void';
    priority: 'low' | 'medium' | 'high';
    category?: string;
    attachments?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface NCR {
    id: string;
    projectId: string;
    companyId: string;
    ncrNumber: string;
    title: string;
    description: string;
    location?: string;
    discoveredBy: string;
    discoveredDate: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    rootCause?: string;
    correctiveAction?: string;
    preventiveAction?: string;
    assignedTo?: string;
    dueDate?: string;
    closedBy?: string;
    closedAt?: string;
    photos?: string;
    attachments?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChangeOrderItem {
    id: string;
    changeOrderId: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
}

export interface Submittal {
    id: string;
    companyId: string;
    projectId: string;
    number: string;
    title: string;
    type: string; // 'Shop Drawing', 'Product Data', 'Sample', 'Mix Design'
    specSection?: string;
    submittedBy: string;
    dateSubmitted: string;
    dueDate?: string;
    status: 'Draft' | 'Pending Review' | 'Approved' | 'Approved as Noted' | 'Revise and Resubmit' | 'Rejected';
    reviewer?: string;
    reviewedDate?: string;
    notes?: string;
    documentUrl?: string;
    revision: number;
    submitterName?: string;
    reviewerName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SubmittalRevision {
    id: string;
    submittalId: string;
    revision: number;
    dateSubmitted: string;
    submittedBy: string;
    status: string;
    reviewedBy?: string;
    reviewedDate?: string;
    comments?: string;
    documentUrl?: string;
    submitterName?: string;
    reviewerName?: string;
}

export interface ProgressPhoto {
    id: string;
    companyId: string;
    projectId: string;
    title: string;
    description?: string;
    captureDate: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    photoUrl: string;
    is360?: boolean;
    tags: string[];
    createdAt: string;
}

export interface WeatherDelay {
    id: string;
    companyId: string;
    projectId: string;
    date: string;
    weatherType: string;
    severity: 'minor' | 'moderate' | 'severe';
    duration: number;
    affectedActivities: string[];
    costImpact?: number;
    scheduleImpact?: number;
    justification: string;
    createdAt: string;
}

export interface ConcretePour {
    id: string;
    companyId: string;
    projectId: string;
    location: string;
    scheduledDate: string;
    actualDate?: string;
    mixDesign: string;
    volume: number;
    supplier: string;
    temperature: number;
    slump: number;
    status: 'scheduled' | 'completed' | 'cancelled';
    createdAt: string;
}

export interface ConcreteTest {
    id: string;
    pourId: string;
    testDate: string;
    age: number;
    strength: number;
    testType: '7-day' | '14-day' | '28-day' | '56-day';
    passed: boolean;
    notes?: string;
}

export interface SubcontractorInsurance {
    id: string;
    companyId: string;
    subcontractorId: string;
    insuranceType: string;
    policyNumber: string;
    provider: string;
    coverageAmount: number;
    effectiveDate: string;
    expiryDate: string;
    documentUrl?: string;
}

export interface PaymentApplication {
    id: string;
    companyId: string;
    projectId: string;
    subcontractorId: string;
    applicationNumber: number;
    periodStart: string;
    periodEnd: string;
    scheduledValue: number;
    completedValue: number;
    materialsStored: number;
    totalEarned: number;
    previouslyPaid: number;
    currentDue: number;
    retainage: number;
    status: 'submitted' | 'reviewing' | 'approved' | 'paid';
    submittedDate: string;
}

// ============================================
// INSPECTIONS API
// ============================================

export const inspectionsApi = {
    getAll: (projectId?: string) =>
        api.get<{ success: boolean; inspections: Inspection[] }>('/inspections', { params: { projectId } }),

    getOne: (id: string) =>
        api.get<{ success: boolean; inspection: Inspection }>(`/inspections/${id}`),

    create: (data: Partial<Inspection>) =>
        api.post<{ success: boolean; inspection: Inspection }>('/inspections', data),

    update: (id: string, data: Partial<Inspection>) =>
        api.patch<{ success: boolean; inspection: Inspection }>(`/inspections/${id}`, data),

    complete: (id: string, data: { passFailStatus: string; findings: any; deficiencies: any; notes?: string }) =>
        api.post<{ success: boolean; inspection: Inspection }>(`/inspections/${id}/complete`, data),

    templates: {
        getAll: () =>
            api.get<{ success: boolean; templates: InspectionTemplate[] }>('/inspection-templates'),
        create: (data: Partial<InspectionTemplate>) =>
            api.post<{ success: boolean; template: InspectionTemplate }>('/inspection-templates', data),
    }
};

export const qualityIssuesApi = {
    getAll: (inspectionId?: string) =>
        api.get<QualityIssue[]>('/quality-issues', { params: { inspectionId } }),

    create: (data: Omit<QualityIssue, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) =>
        api.post<QualityIssue>('/quality-issues', data),

    update: (id: string, data: Partial<QualityIssue>) =>
        api.put<QualityIssue>(`/quality-issues/${id}`, data),
};

// ============================================
// MATERIALS API
// ============================================

export const materialsApi = {
    deliveries: {
        getAll: (projectId?: string) =>
            api.get<MaterialDelivery[]>('/materials/deliveries', { params: { projectId } }),

        create: (data: Omit<MaterialDelivery, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) =>
            api.post<MaterialDelivery>('/materials/deliveries', data),
    },

    inventory: {
        getAll: (projectId: string) =>
            api.get<MaterialInventory[]>('/materials/inventory', { params: { projectId } }),

        update: (id: string, data: Partial<MaterialInventory>) =>
            api.put<MaterialInventory>(`/materials/inventory/${id}`, data),
    },

    requisitions: {
        getAll: (projectId?: string) =>
            api.get<MaterialRequisition[]>('/materials/requisitions', { params: { projectId } }),

        create: (data: Omit<MaterialRequisition, 'id' | 'companyId' | 'createdAt'>) =>
            api.post<MaterialRequisition>('/materials/requisitions', data),

        update: (id: string, data: Partial<MaterialRequisition>) =>
            api.put<MaterialRequisition>(`/materials/requisitions/${id}`, data),
    },
};

// ============================================
// CHANGE ORDERS API
// ============================================

export const changeOrdersApi = {
    getAll: (projectId?: string) =>
        api.get<{ success: boolean; changeOrders: ChangeOrder[] }>('/change-orders', { params: { projectId } }),

    getOne: (id: string) =>
        api.get<{ success: boolean; changeOrder: ChangeOrder }>(`/change-orders/${id}`),

    create: (data: Partial<ChangeOrder>) =>
        api.post<{ success: boolean; changeOrder: ChangeOrder }>('/change-orders', data),

    update: (id: string, data: Partial<ChangeOrder>) =>
        api.patch<{ success: boolean; changeOrder: ChangeOrder }>(`/change-orders/${id}`, data),

    approve: (id: string) =>
        api.post<{ success: boolean; changeOrder: ChangeOrder }>(`/change-orders/${id}/approve`),

    reject: (id: string) =>
        api.post<{ success: boolean; changeOrder: ChangeOrder }>(`/change-orders/${id}/reject`),

    execute: (id: string) =>
        api.post<{ success: boolean; changeOrder: ChangeOrder }>(`/change-orders/${id}/execute`),

    getItems: (changeOrderId: string) =>
        api.get<ChangeOrderItem[]>(`/change-orders/${changeOrderId}/items`),
};

// ============================================
// SUBMITTALS API
// ============================================

export const submittalsApi = {
    getAll: (projectId?: string) =>
        api.get<Submittal[]>('/submittals', { params: { projectId } }),

    getOne: (id: string) =>
        api.get<Submittal>(`/submittals/${id}`),

    create: (data: Partial<Submittal>) =>
        api.post<Submittal>('/submittals', data),

    update: (id: string, data: Partial<Submittal>) =>
        api.put<Submittal>(`/submittals/${id}`, data),

    submit: (id: string) =>
        api.post<Submittal>(`/submittals/${id}/submit`),

    review: (id: string, status: Submittal['status'], comments?: string) =>
        api.post<Submittal>(`/submittals/${id}/review`, { status, comments }),

    delete: (id: string) =>
        api.delete(`/submittals/${id}`),

    getRevisions: (submittalId: string) =>
        api.get<SubmittalRevision[]>(`/submittals/${submittalId}/revisions`),
};

// ============================================
// PROGRESS PHOTOS API
// ============================================

export const progressPhotosApi = {
    getAll: (projectId?: string) =>
        api.get<ProgressPhoto[]>('/progress-photos', { params: { projectId } }),

    create: (data: Omit<ProgressPhoto, 'id' | 'companyId' | 'createdAt'>) =>
        api.post<ProgressPhoto>('/progress-photos', data),
};

// ============================================
// WEATHER API
// ============================================

export const weatherApi = {
    getDelays: (projectId?: string) =>
        api.get<WeatherDelay[]>('/weather/delays', { params: { projectId } }),

    create: (data: Omit<WeatherDelay, 'id' | 'companyId' | 'createdAt'>) =>
        api.post<WeatherDelay>('/weather/delays', data),
};

// ============================================
// CONCRETE API
// ============================================

export const concreteApi = {
    pours: {
        getAll: (projectId?: string) =>
            api.get<ConcretePour[]>('/concrete/pours', { params: { projectId } }),

        create: (data: Omit<ConcretePour, 'id' | 'companyId' | 'createdAt'>) =>
            api.post<ConcretePour>('/concrete/pours', data),
    },

    tests: {
        getAll: (pourId: string) =>
            api.get<ConcreteTest[]>('/concrete/tests', { params: { pourId } }),

        create: (data: Omit<ConcreteTest, 'id'>) =>
            api.post<ConcreteTest>('/concrete/tests', data),
    },

    getStrengthCurve: (pourId: string) =>
        api.get(`/concrete/pours/${pourId}/strength-curve`),
};

// ============================================
// SUBCONTRACTORS API
// ============================================

export const subcontractorsApi = {
    insurance: {
        getAll: (subcontractorId?: string) =>
            api.get<SubcontractorInsurance[]>('/subcontractors/insurance', { params: { subcontractorId } }),

        create: (data: Omit<SubcontractorInsurance, 'id' | 'companyId'>) =>
            api.post<SubcontractorInsurance>('/subcontractors/insurance', data),
    },

    paymentApplications: {
        getAll: (projectId?: string, subcontractorId?: string) =>
            api.get<PaymentApplication[]>('/subcontractors/payment-applications', {
                params: { projectId, subcontractorId }
            }),

        create: (data: Omit<PaymentApplication, 'id' | 'companyId'>) =>
            api.post<PaymentApplication>('/subcontractors/payment-applications', data),

        update: (id: string, data: Partial<PaymentApplication>) =>
            api.put<PaymentApplication>(`/subcontractors/payment-applications/${id}`, data),
    },
};

export const pcosApi = {
    getAll: (projectId?: string) =>
        api.get<PCO[]>('/pcos', { params: { projectId } }),

    getOne: (id: string) =>
        api.get<PCO>(`/pcos/${id}`),

    create: (data: Partial<PCO>) =>
        api.post<PCO>('/pcos', data),

    update: (id: string, data: Partial<PCO>) =>
        api.patch<PCO>(`/pcos/${id}`, data),

    convertToCO: (id: string) =>
        api.post<ChangeOrder>(`/pcos/${id}/convert`),

    delete: (id: string) =>
        api.delete(`/pcos/${id}`),
};

export const ncrApi = {
    getAll: (projectId?: string) =>
        api.get<NCR[]>('/ncrs', { params: { projectId } }),

    getOne: (id: string) =>
        api.get<NCR>(`/ncrs/${id}`),

    create: (data: Partial<NCR>) =>
        api.post<NCR>('/ncrs', data),

    update: (id: string, data: Partial<NCR>) =>
        api.patch<NCR>(`/ncrs/${id}`, data),

    resolve: (id: string, data: { correctiveAction: string; rootCause?: string }) =>
        api.post<NCR>(`/ncrs/${id}/resolve`, data),

    close: (id: string) =>
        api.post<NCR>(`/ncrs/${id}/close`),

    delete: (id: string) =>
        api.delete(`/ncrs/${id}`),
};

export default {
    inspections: inspectionsApi,
    qualityIssues: qualityIssuesApi,
    materials: materialsApi,
    changeOrders: changeOrdersApi,
    submittals: submittalsApi,
    progressPhotos: progressPhotosApi,
    weather: weatherApi,
    concrete: concreteApi,
    subcontractors: subcontractorsApi,
    pcos: pcosApi,
    ncrs: ncrApi,
};
