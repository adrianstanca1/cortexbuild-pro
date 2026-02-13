/**
 * Accounting Service - API client for the full accounting module:
 * General Ledger, Bank Feeds, Payroll, Tax/HMRC, Integrations, Job Costing
 */

import { apiClient } from './apiClient';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GLAccount {
    id: string;
    companyId: string;
    code: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    category?: string;
    parentId?: string;
    description?: string;
    currency: string;
    isActive: boolean;
    isSystem: boolean;
    balance: number;
    createdAt: string;
}

export interface JournalEntry {
    id: string;
    entryNumber: string;
    date: string;
    description?: string;
    reference?: string;
    sourceType?: string;
    sourceId?: string;
    projectId?: string;
    costCodeId?: string;
    status: string;
    totalDebit: number;
    totalCredit: number;
    createdBy?: string;
    createdAt: string;
}

export interface JournalEntryLine {
    id: string;
    journalEntryId: string;
    accountId: string;
    accountCode?: string;
    accountName?: string;
    description?: string;
    debit: number;
    credit: number;
    projectId?: string;
    costCodeId?: string;
}

export interface BankAccount {
    id: string;
    bankName: string;
    accountName?: string;
    accountNumber?: string;
    sortCode?: string;
    currency: string;
    currentBalance: number;
    availableBalance: number;
    lastSyncedAt?: string;
    connectionStatus: 'connected' | 'disconnected' | 'error';
    isDefault: boolean;
    createdAt: string;
}

export interface BankTransaction {
    id: string;
    bankAccountId: string;
    bankName?: string;
    date: string;
    description?: string;
    amount: number;
    type: 'credit' | 'debit';
    runningBalance?: number;
    category?: string;
    counterparty?: string;
    reference?: string;
    reconciliationStatus: 'unmatched' | 'matched' | 'excluded';
    aiSuggestedCategory?: string;
    aiSuggestedProject?: string;
    aiConfidence?: number;
    projectId?: string;
    costCodeId?: string;
}

export interface PayrollRun {
    id: string;
    periodStart: string;
    periodEnd: string;
    payDate: string;
    status: 'draft' | 'approved' | 'paid' | 'submitted';
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    totalEmployerNI: number;
    totalEmployeeNI: number;
    totalPAYE: number;
    totalCIS: number;
    totalPension: number;
    employeeCount: number;
    submittedToHMRC: boolean;
    createdAt: string;
}

export interface PayrollItem {
    id: string;
    payrollRunId: string;
    employeeId: string;
    employeeName: string;
    projectId?: string;
    hoursWorked: number;
    overtimeHours: number;
    hourlyRate: number;
    overtimeRate: number;
    grossPay: number;
    basicPay: number;
    overtimePay: number;
    allowances: number;
    employeeNI: number;
    employerNI: number;
    paye: number;
    cisDeduction: number;
    pensionEmployee: number;
    pensionEmployer: number;
    studentLoan: number;
    netPay: number;
    taxCode: string;
    isCIS: boolean;
    costCodeId?: string;
}

export interface TaxReturn {
    id: string;
    type: 'VAT' | 'CorporationTax' | 'PAYE';
    periodStart: string;
    periodEnd: string;
    status: 'draft' | 'submitted' | 'accepted' | 'rejected';
    totalOutput: number;
    totalInput: number;
    netAmount: number;
    amountDue: number;
    boxes?: Record<string, number>;
    hmrcCorrelationId?: string;
    hmrcReceiptId?: string;
    submittedAt?: string;
    dueDate?: string;
    createdAt: string;
}

export interface IntegrationCredential {
    id: string;
    provider: 'xero' | 'quickbooks' | 'hmrc' | 'stripe';
    organisationName?: string;
    status: 'connected' | 'disconnected' | 'error';
    lastSyncAt?: string;
    scopes?: string;
    createdAt: string;
}

export interface InvoiceChaser {
    id: string;
    invoiceId: string;
    invoiceNumber?: string;
    invoiceAmount?: number;
    invoiceVendor?: string;
    reminderType: 'friendly' | 'firm' | 'final';
    scheduledDate: string;
    sentAt?: string;
    subject?: string;
    status: 'scheduled' | 'sent' | 'failed';
    daysOverdue: number;
    createdAt: string;
}

export interface JobCostingProject {
    projectId: string;
    projectName: string;
    status: string;
    budget: number;
    totalRevenue: number;
    totalCosts: number;
    paidInvoices: number;
    outstandingInvoices: number;
    profit: number;
    profitMargin: number;
    budgetUtilization: number;
    budgetRemaining: number;
    isOverBudget: boolean;
    isLosingMoney: boolean;
}

export interface JobCostingSummary {
    totalProjects: number;
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    overBudgetProjects: number;
    losingMoneyProjects: number;
    avgProfitMargin: number;
}

export interface POBillingSummary {
    id: string;
    poNumber: string;
    vendor: string;
    projectId?: string;
    date: string;
    poAmount: number;
    totalBilled: number;
    remaining: number;
    utilizationPercent: number;
    isOverbilled: boolean;
    status: string;
}

export interface ReceivablesAgingReport {
    totalOutstanding: number;
    buckets: {
        current: number;
        '1-30': number;
        '31-60': number;
        '61-90': number;
        '90+': number;
    };
    invoiceCount: number;
    items: Array<{
        invoiceId: string;
        invoiceNumber: string;
        vendor: string;
        projectId?: string;
        amount: number;
        dueDate: string;
        daysOverdue: number;
        bucket: string;
        status: string;
    }>;
}

export interface FinancialAlert {
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    projectId?: string;
    projectName?: string;
    budget?: number;
    spent?: number;
    utilization?: number;
    count?: number;
    totalAmount?: number;
}

// ─── API Client ─────────────────────────────────────────────────────────────

export const accountingApi = {
    // General Ledger
    getGLAccounts: () => apiClient.get<GLAccount[]>('/accounting/gl-accounts'),
    createGLAccount: (data: Partial<GLAccount>) => apiClient.post<GLAccount>('/accounting/gl-accounts', data),
    updateGLAccount: (id: string, data: Partial<GLAccount>) => apiClient.put(`/accounting/gl-accounts/${id}`, data),

    // Journal Entries
    getJournalEntries: (params?: { projectId?: string; startDate?: string; endDate?: string }) =>
        apiClient.get<JournalEntry[]>('/accounting/journal-entries', { params }),
    createJournalEntry: (data: { date: string; description?: string; reference?: string; projectId?: string; costCodeId?: string; lines: Array<{ accountId: string; description?: string; debit?: number; credit?: number }> }) =>
        apiClient.post<JournalEntry>('/accounting/journal-entries', data),
    getJournalEntryLines: (id: string) =>
        apiClient.get<JournalEntryLine[]>(`/accounting/journal-entries/${id}/lines`),

    // Bank Accounts & Open Banking
    getBankAccounts: () => apiClient.get<BankAccount[]>('/accounting/bank-accounts'),
    createBankAccount: (data: Partial<BankAccount>) => apiClient.post<BankAccount>('/accounting/bank-accounts', data),
    importBankTransactions: (bankAccountId: string, transactions: any[]) =>
        apiClient.post(`/accounting/bank-accounts/${bankAccountId}/import`, { transactions }),
    getBankTransactions: (params?: { bankAccountId?: string; reconciliationStatus?: string; startDate?: string; endDate?: string }) =>
        apiClient.get<BankTransaction[]>('/accounting/bank-transactions', { params }),
    reconcileBankTransaction: (id: string, data: { matchedTransactionId?: string; matchedInvoiceId?: string; projectId?: string; costCodeId?: string; category?: string }) =>
        apiClient.put(`/accounting/bank-transactions/${id}/reconcile`, data),

    // Payroll
    getPayrollRuns: () => apiClient.get<PayrollRun[]>('/accounting/payroll-runs'),
    createPayrollRun: (data: { periodStart: string; periodEnd: string; payDate: string; notes?: string }) =>
        apiClient.post<PayrollRun>('/accounting/payroll-runs', data),
    getPayrollItems: (runId: string) => apiClient.get<PayrollItem[]>(`/accounting/payroll-runs/${runId}/items`),
    addPayrollItem: (runId: string, data: Partial<PayrollItem>) =>
        apiClient.post<PayrollItem>(`/accounting/payroll-runs/${runId}/items`, data),
    approvePayrollRun: (runId: string) =>
        apiClient.put(`/accounting/payroll-runs/${runId}/approve`, {}),

    // Tax & HMRC
    getTaxReturns: (type?: string) => apiClient.get<TaxReturn[]>('/accounting/tax-returns', { params: type ? { type } : {} }),
    calculateVATReturn: (periodStart: string, periodEnd: string) =>
        apiClient.post<TaxReturn>('/accounting/tax-returns/vat/calculate', { periodStart, periodEnd }),
    submitTaxReturn: (id: string) => apiClient.put(`/accounting/tax-returns/${id}/submit`, {}),

    // Integrations
    getIntegrations: () => apiClient.get<IntegrationCredential[]>('/accounting/integrations'),
    createIntegration: (data: Partial<IntegrationCredential>) =>
        apiClient.post<IntegrationCredential>('/accounting/integrations', data),
    deleteIntegration: (id: string) => apiClient.delete(`/accounting/integrations/${id}`),

    // Invoice Chasers
    getInvoiceChasers: () => apiClient.get<InvoiceChaser[]>('/accounting/invoice-chasers'),
    generateInvoiceChasers: () => apiClient.post('/accounting/invoice-chasers/generate', {}),

    // Job Costing
    getJobCosting: (projectId?: string) =>
        apiClient.get<{ summary: JobCostingSummary; projects: JobCostingProject[] }>('/accounting/job-costing', { params: projectId ? { projectId } : {} }),
    getJobCostingBreakdown: (projectId: string) =>
        apiClient.get(`/accounting/job-costing/${projectId}/breakdown`),

    // Bill-to-PO Matching
    matchBillToPO: (invoiceId: string, purchaseOrderId: string) =>
        apiClient.post('/accounting/bill-po-match', { invoiceId, purchaseOrderId }),
    getPOBillingSummary: () =>
        apiClient.get<POBillingSummary[]>('/accounting/po-billing-summary'),

    // Receivables Aging
    getReceivablesAging: () =>
        apiClient.get<ReceivablesAgingReport>('/accounting/receivables-aging'),

    // Financial Alerts
    getFinancialAlerts: () =>
        apiClient.get<{ count: number; alerts: FinancialAlert[] }>('/accounting/financial-alerts'),

    // Default GL Accounts
    seedDefaultGLAccounts: () =>
        apiClient.post('/accounting/gl-accounts/seed-defaults', {}),

    // AI Auto-Categorization
    autoCategorizeTransactions: () =>
        apiClient.post('/accounting/bank-transactions/auto-categorize', {}),

    // Budget Sync
    syncProjectBudgets: () =>
        apiClient.post('/accounting/sync-project-budgets', {}),
};
