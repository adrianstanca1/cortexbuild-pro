import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    BookOpen, CreditCard, Receipt, Users, Building2, FileText, TrendingUp,
    TrendingDown, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight,
    RefreshCw, Plus, Search, Filter, ChevronDown, ChevronRight, X, Check,
    Send, Link2, Unlink, Download, Upload, Clock, Bell, PoundSterling,
    Landmark, Calculator, Briefcase, ExternalLink, Zap, BarChart3,
    Shield, Wallet, PieChart, ArrowRight, CheckCircle2, XCircle, Info
} from 'lucide-react';
import { useProjects } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { accountingApi } from '@/services/accountingService';
import type {
    GLAccount, JournalEntry, BankAccount, BankTransaction,
    PayrollRun, PayrollItem, TaxReturn, IntegrationCredential,
    InvoiceChaser, JobCostingProject, JobCostingSummary,
    POBillingSummary, ReceivablesAgingReport, FinancialAlert
} from '@/services/accountingService';

type AccountingTab = 'LEDGER' | 'BANK_FEEDS' | 'PAYROLL' | 'TAX_HMRC' | 'JOB_COSTING' | 'INTEGRATIONS' | 'CHASERS' | 'RECEIVABLES' | 'ALERTS' | 'PO_MATCHING';

const AccountingHubView: React.FC = () => {
    const { projects, transactions, invoices, costCodes } = useProjects();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<AccountingTab>('JOB_COSTING');
    const [isLoading, setIsLoading] = useState(false);

    // ─── Data State ─────────────────────────────────────────────────────────
    const [glAccounts, setGLAccounts] = useState<GLAccount[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);
    const [integrations, setIntegrations] = useState<IntegrationCredential[]>([]);
    const [invoiceChasers, setInvoiceChasers] = useState<InvoiceChaser[]>([]);
    const [jobCostingData, setJobCostingData] = useState<{ summary: JobCostingSummary; projects: JobCostingProject[] } | null>(null);
    const [poBillingSummary, setPOBillingSummary] = useState<POBillingSummary[]>([]);
    const [receivablesAging, setReceivablesAging] = useState<ReceivablesAgingReport | null>(null);
    const [financialAlerts, setFinancialAlerts] = useState<FinancialAlert[]>([]);

    // ─── UI State ───────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPayrollRun, setSelectedPayrollRun] = useState<string | null>(null);
    const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);

    // ─── Data Loading ───────────────────────────────────────────────────────
    const loadTabData = useCallback(async (tab: AccountingTab) => {
        setIsLoading(true);
        try {
            switch (tab) {
                case 'LEDGER':
                    const [accounts, entries] = await Promise.all([
                        accountingApi.getGLAccounts().catch(() => []),
                        accountingApi.getJournalEntries().catch(() => [])
                    ]);
                    if (Array.isArray(accounts)) setGLAccounts(accounts);
                    if (Array.isArray(entries)) setJournalEntries(entries);
                    break;
                case 'BANK_FEEDS':
                    const [bAccounts, bTxns] = await Promise.all([
                        accountingApi.getBankAccounts().catch(() => []),
                        accountingApi.getBankTransactions().catch(() => [])
                    ]);
                    if (Array.isArray(bAccounts)) setBankAccounts(bAccounts);
                    if (Array.isArray(bTxns)) setBankTransactions(bTxns);
                    break;
                case 'PAYROLL':
                    const runs = await accountingApi.getPayrollRuns().catch(() => []);
                    if (Array.isArray(runs)) setPayrollRuns(runs);
                    break;
                case 'TAX_HMRC':
                    const returns = await accountingApi.getTaxReturns().catch(() => []);
                    if (Array.isArray(returns)) setTaxReturns(returns);
                    break;
                case 'INTEGRATIONS':
                    const ints = await accountingApi.getIntegrations().catch(() => []);
                    if (Array.isArray(ints)) setIntegrations(ints);
                    break;
                case 'CHASERS':
                    const chasers = await accountingApi.getInvoiceChasers().catch(() => []);
                    if (Array.isArray(chasers)) setInvoiceChasers(chasers);
                    break;
                case 'JOB_COSTING':
                    const jcData = await accountingApi.getJobCosting().catch(() => null);
                    if (jcData) setJobCostingData(jcData);
                    break;
                case 'PO_MATCHING':
                    const poData = await accountingApi.getPOBillingSummary().catch(() => []);
                    if (Array.isArray(poData)) setPOBillingSummary(poData);
                    break;
                case 'RECEIVABLES':
                    const agingData = await accountingApi.getReceivablesAging().catch(() => null);
                    if (agingData) setReceivablesAging(agingData);
                    break;
                case 'ALERTS':
                    const alertsData = await accountingApi.getFinancialAlerts().catch(() => ({ count: 0, alerts: [] }));
                    if (alertsData) setFinancialAlerts((alertsData as any)?.alerts || []);
                    break;
            }
        } catch (err) {
            console.warn('[Accounting] Failed to load data:', err);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => { loadTabData(activeTab); }, [activeTab, loadTabData]);

    // ─── Computed Values ────────────────────────────────────────────────────
    const financialSummary = useMemo(() => {
        const totalRevenue = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
        const totalExpenses = transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
        const netProfit = totalRevenue - totalExpenses;
        const overdueInvoices = invoices.filter(i => i.status === 'Pending' && new Date(i.dueDate) < new Date());
        const overdueAmount = overdueInvoices.reduce((s, i) => s + (i.total || i.amount), 0);
        return { totalRevenue, totalExpenses, netProfit, margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0, overdueCount: overdueInvoices.length, overdueAmount };
    }, [transactions, invoices]);

    const unmatchedCount = bankTransactions.filter(t => t.reconciliationStatus === 'unmatched').length;

    // ─── Handlers ───────────────────────────────────────────────────────────
    const handleGenerateChasers = async () => {
        try {
            const result = await accountingApi.generateInvoiceChasers();
            addToast(`Generated ${(result as any)?.generated || 0} invoice reminders`, 'success');
            loadTabData('CHASERS');
        } catch { addToast('Failed to generate chasers', 'error'); }
    };

    const handleCalculateVAT = async () => {
        const now = new Date();
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0).toISOString().split('T')[0];
        try {
            await accountingApi.calculateVATReturn(quarterStart, quarterEnd);
            addToast('VAT return calculated', 'success');
            loadTabData('TAX_HMRC');
        } catch { addToast('Failed to calculate VAT return', 'error'); }
    };

    const handleSubmitTaxReturn = async (id: string) => {
        try {
            const result = await accountingApi.submitTaxReturn(id);
            addToast(`Submitted to HMRC (Ref: ${(result as any)?.hmrcCorrelationId})`, 'success');
            loadTabData('TAX_HMRC');
        } catch { addToast('HMRC submission failed', 'error'); }
    };

    const handleReconcile = async (txnId: string, projectId: string) => {
        try {
            await accountingApi.reconcileBankTransaction(txnId, { projectId });
            addToast('Transaction reconciled', 'success');
            loadTabData('BANK_FEEDS');
        } catch { addToast('Reconciliation failed', 'error'); }
    };

    const handleSeedAccounts = async () => {
        try {
            const result = await accountingApi.seedDefaultGLAccounts();
            addToast(`${(result as any)?.accountsCreated || 0} construction GL accounts created`, 'success');
            loadTabData('LEDGER');
        } catch { addToast('Failed to seed accounts', 'error'); }
    };

    const handleAutoCategorize = async () => {
        try {
            const result = await accountingApi.autoCategorizeTransactions();
            addToast(`AI categorized ${(result as any)?.categorized || 0} of ${(result as any)?.total || 0} transactions`, 'success');
            loadTabData('BANK_FEEDS');
        } catch { addToast('Auto-categorization failed', 'error'); }
    };

    const handleSyncBudgets = async () => {
        try {
            const result = await accountingApi.syncProjectBudgets();
            addToast(`${(result as any)?.costCodesUpdated || 0} cost codes synced`, 'success');
            loadTabData('JOB_COSTING');
        } catch { addToast('Budget sync failed', 'error'); }
    };

    // ─── Tab Config ─────────────────────────────────────────────────────────
    const tabs: { id: AccountingTab; label: string; icon: any; badge?: string }[] = [
        { id: 'JOB_COSTING', label: 'Job Costing', icon: BarChart3 },
        { id: 'LEDGER', label: 'General Ledger', icon: BookOpen },
        { id: 'BANK_FEEDS', label: 'Bank Feeds', icon: Landmark, badge: unmatchedCount > 0 ? `${unmatchedCount}` : undefined },
        { id: 'RECEIVABLES', label: 'Receivables', icon: Receipt },
        { id: 'PO_MATCHING', label: 'PO Matching', icon: FileText },
        { id: 'PAYROLL', label: 'Payroll', icon: Users },
        { id: 'TAX_HMRC', label: 'Tax & HMRC', icon: Shield },
        { id: 'CHASERS', label: 'Invoice Chasers', icon: Bell },
        { id: 'ALERTS', label: 'Alerts', icon: AlertTriangle, badge: financialAlerts.filter(a => a.severity === 'critical').length > 0 ? `${financialAlerts.filter(a => a.severity === 'critical').length}` : undefined },
        { id: 'INTEGRATIONS', label: 'Integrations', icon: Link2 },
    ];

    // ─── Format helpers ─────────────────────────────────────────────────────
    const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
    const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

    return (
        <div className="p-8 max-w-[1600px] mx-auto h-full flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Accounting Hub</h1>
                <p className="text-zinc-500 mt-1">Unified financial management, tax compliance & job costing</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <SummaryCard icon={<TrendingUp size={20} />} label="Revenue" value={fmt(financialSummary.totalRevenue)} color="emerald" />
                <SummaryCard icon={<TrendingDown size={20} />} label="Expenses" value={fmt(financialSummary.totalExpenses)} color="red" />
                <SummaryCard icon={<PoundSterling size={20} />} label="Net Profit" value={fmt(financialSummary.netProfit)} color={financialSummary.netProfit >= 0 ? 'emerald' : 'red'} sub={fmtPct(financialSummary.margin)} />
                <SummaryCard icon={<AlertTriangle size={20} />} label="Overdue" value={fmt(financialSummary.overdueAmount)} color="amber" sub={`${financialSummary.overdueCount} invoices`} />
                <SummaryCard icon={<Landmark size={20} />} label="Bank Feeds" value={`${unmatchedCount} unmatched`} color="blue" sub={`${bankAccounts.length} accounts`} />
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-zinc-200 mb-6 overflow-x-auto pb-px">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        {tab.badge && <span className="ml-1 px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">{tab.badge}</span>}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw size={24} className="animate-spin text-zinc-400" />
                    <span className="ml-3 text-zinc-500">Loading...</span>
                </div>
            )}

            {/* Tab Content */}
            {!isLoading && activeTab === 'JOB_COSTING' && <JobCostingTab data={jobCostingData} projects={projects} fmt={fmt} fmtPct={fmtPct} onSyncBudgets={handleSyncBudgets} />}
            {!isLoading && activeTab === 'LEDGER' && <LedgerTab accounts={glAccounts} entries={journalEntries} fmt={fmt} onSeedDefaults={handleSeedAccounts} />}
            {!isLoading && activeTab === 'BANK_FEEDS' && <BankFeedsTab accounts={bankAccounts} transactions={bankTransactions} projects={projects} fmt={fmt} onReconcile={handleReconcile} onAutoCategorize={handleAutoCategorize} />}
            {!isLoading && activeTab === 'RECEIVABLES' && <ReceivablesTab data={receivablesAging} fmt={fmt} />}
            {!isLoading && activeTab === 'PO_MATCHING' && <POMatchingTab data={poBillingSummary} fmt={fmt} />}
            {!isLoading && activeTab === 'PAYROLL' && <PayrollTab runs={payrollRuns} selectedRun={selectedPayrollRun} items={payrollItems} fmt={fmt} onSelectRun={async (id) => { setSelectedPayrollRun(id); try { const items = await accountingApi.getPayrollItems(id); if (Array.isArray(items)) setPayrollItems(items); } catch { setPayrollItems([]); } }} />}
            {!isLoading && activeTab === 'TAX_HMRC' && <TaxHMRCTab returns={taxReturns} fmt={fmt} onCalculateVAT={handleCalculateVAT} onSubmit={handleSubmitTaxReturn} />}
            {!isLoading && activeTab === 'CHASERS' && <InvoiceChasersTab chasers={invoiceChasers} fmt={fmt} onGenerate={handleGenerateChasers} />}
            {!isLoading && activeTab === 'ALERTS' && <AlertsTab alerts={financialAlerts} fmt={fmt} />}
            {!isLoading && activeTab === 'INTEGRATIONS' && <IntegrationsTab integrations={integrations} />}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SummaryCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string; sub?: string }> = ({ icon, label, value, color, sub }) => {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        red: 'bg-red-50 text-red-600 border-red-200',
        amber: 'bg-amber-50 text-amber-600 border-amber-200',
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
    };
    return (
        <div className={`p-5 rounded-2xl border ${colors[color] || colors.blue}`}>
            <div className="flex items-center gap-2 mb-2 opacity-80">{icon}<span className="text-xs font-semibold uppercase tracking-wider">{label}</span></div>
            <p className="text-xl font-black">{value}</p>
            {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
        </div>
    );
};

// ─── Job Costing Tab ────────────────────────────────────────────────────────

const JobCostingTab: React.FC<{ data: { summary: JobCostingSummary; projects: JobCostingProject[] } | null; projects: any[]; fmt: (n: number) => string; fmtPct: (n: number) => string; onSyncBudgets: () => void }> = ({ data, projects, fmt, fmtPct, onSyncBudgets }) => {
    if (!data) return <EmptyState icon={<BarChart3 size={40} />} title="Job Costing" description="Financial data will appear here as projects and transactions are added." />;
    const { summary } = data;
    const jobProjects = data.projects.length > 0 ? data.projects : projects.map(p => ({
        projectId: p.id, projectName: p.name, status: p.status, budget: p.budget || 0,
        totalRevenue: 0, totalCosts: 0, paidInvoices: 0, outstandingInvoices: 0,
        profit: 0, profitMargin: 0, budgetUtilization: 0, budgetRemaining: p.budget || 0,
        isOverBudget: false, isLosingMoney: false
    }));

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-zinc-200">
                    <p className="text-xs font-semibold text-zinc-500 uppercase">Total Profit</p>
                    <p className={`text-2xl font-black mt-1 ${(summary?.totalProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(summary?.totalProfit || 0)}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-zinc-200">
                    <p className="text-xs font-semibold text-zinc-500 uppercase">Avg Margin</p>
                    <p className="text-2xl font-black mt-1 text-zinc-900">{(summary?.avgProfitMargin || 0).toFixed(1)}%</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-zinc-200">
                    <p className="text-xs font-semibold text-zinc-500 uppercase">Over Budget</p>
                    <p className="text-2xl font-black mt-1 text-amber-600">{summary?.overBudgetProjects || 0} <span className="text-sm font-normal text-zinc-400">projects</span></p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-zinc-200">
                    <p className="text-xs font-semibold text-zinc-500 uppercase">Losing Money</p>
                    <p className="text-2xl font-black mt-1 text-red-600">{summary?.losingMoneyProjects || 0} <span className="text-sm font-normal text-zinc-400">projects</span></p>
                </div>
            </div>

            {/* Project Table */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900">Project Profitability</h3>
                    <button onClick={onSyncBudgets} className="px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-200 flex items-center gap-1.5"><RefreshCw size={14} /> Sync Budgets</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-zinc-50 text-zinc-500 text-xs uppercase">
                            <th className="text-left p-3 font-semibold">Project</th>
                            <th className="text-right p-3 font-semibold">Budget</th>
                            <th className="text-right p-3 font-semibold">Revenue</th>
                            <th className="text-right p-3 font-semibold">Costs</th>
                            <th className="text-right p-3 font-semibold">Profit</th>
                            <th className="text-right p-3 font-semibold">Margin</th>
                            <th className="text-right p-3 font-semibold">Budget Used</th>
                            <th className="text-center p-3 font-semibold">Status</th>
                        </tr></thead>
                        <tbody className="divide-y divide-zinc-100">
                            {jobProjects.map(p => (
                                <tr key={p.projectId} className="hover:bg-zinc-50 transition-colors">
                                    <td className="p-3 font-medium text-zinc-900">{p.projectName}</td>
                                    <td className="p-3 text-right text-zinc-600">{fmt(p.budget)}</td>
                                    <td className="p-3 text-right text-emerald-600 font-medium">{fmt(p.totalRevenue)}</td>
                                    <td className="p-3 text-right text-red-600 font-medium">{fmt(p.totalCosts)}</td>
                                    <td className={`p-3 text-right font-bold ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(p.profit)}</td>
                                    <td className={`p-3 text-right font-medium ${p.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{p.profitMargin.toFixed(1)}%</td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-20 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${p.budgetUtilization > 100 ? 'bg-red-500' : p.budgetUtilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(p.budgetUtilization, 100)}%` }} />
                                            </div>
                                            <span className="text-xs text-zinc-500">{p.budgetUtilization.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        {p.isOverBudget && <span className="px-2 py-1 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">OVER BUDGET</span>}
                                        {p.isLosingMoney && !p.isOverBudget && <span className="px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">LOSS</span>}
                                        {!p.isOverBudget && !p.isLosingMoney && <span className="px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">HEALTHY</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── General Ledger Tab ─────────────────────────────────────────────────────

const LedgerTab: React.FC<{ accounts: GLAccount[]; entries: JournalEntry[]; fmt: (n: number) => string; onSeedDefaults: () => void }> = ({ accounts, entries, fmt, onSeedDefaults }) => {
    const accountTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    const typeColors: Record<string, string> = { asset: 'bg-blue-100 text-blue-700', liability: 'bg-red-100 text-red-700', equity: 'bg-purple-100 text-purple-700', revenue: 'bg-emerald-100 text-emerald-700', expense: 'bg-amber-100 text-amber-700' };

    return (
        <div className="space-y-6">
            {/* Chart of Accounts */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
                    <h3 className="font-bold text-zinc-900">Chart of Accounts</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400">{accounts.length} accounts</span>
                        {accounts.length === 0 && <button onClick={onSeedDefaults} className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 flex items-center gap-1.5"><Plus size={14} /> Seed Construction Accounts</button>}
                    </div>
                </div>
                {accounts.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                        {accounts.map(acc => (
                            <div key={acc.id} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded ${typeColors[acc.type] || 'bg-zinc-100 text-zinc-700'}`}>{acc.type.toUpperCase()}</span>
                                    <div>
                                        <span className="font-mono text-xs text-zinc-400 mr-2">{acc.code}</span>
                                        <span className="font-medium text-zinc-900">{acc.name}</span>
                                    </div>
                                </div>
                                <span className={`font-bold ${acc.balance >= 0 ? 'text-zinc-900' : 'text-red-600'}`}>{fmt(acc.balance)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={<BookOpen size={32} />} title="No GL Accounts" description="General Ledger accounts will be created as financial transactions are recorded." />
                )}
            </div>

            {/* Recent Journal Entries */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-100"><h3 className="font-bold text-zinc-900">Journal Entries</h3></div>
                {entries.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                        {entries.slice(0, 20).map(e => (
                            <div key={e.id} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                                <div>
                                    <span className="font-mono text-xs text-zinc-400 mr-2">{e.entryNumber}</span>
                                    <span className="text-sm text-zinc-700">{e.description || 'Journal Entry'}</span>
                                    <p className="text-xs text-zinc-400 mt-1">{new Date(e.date).toLocaleDateString('en-GB')} {e.reference && `| Ref: ${e.reference}`}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-zinc-900">{fmt(e.totalDebit)}</p>
                                    <p className="text-[10px] text-zinc-400">DR = CR</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={<FileText size={32} />} title="No Journal Entries" description="Double-entry journal entries will appear here." />
                )}
            </div>
        </div>
    );
};

// ─── Bank Feeds Tab ─────────────────────────────────────────────────────────

const BankFeedsTab: React.FC<{ accounts: BankAccount[]; transactions: BankTransaction[]; projects: any[]; fmt: (n: number) => string; onReconcile: (txnId: string, projectId: string) => void; onAutoCategorize: () => void }> = ({ accounts, transactions, projects, fmt, onReconcile, onAutoCategorize }) => {
    const [filterStatus, setFilterStatus] = useState('all');
    const filtered = transactions.filter(t => filterStatus === 'all' || t.reconciliationStatus === filterStatus);

    return (
        <div className="space-y-6">
            {/* Bank Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accounts.map(acc => (
                    <div key={acc.id} className="bg-white p-5 rounded-xl border border-zinc-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Landmark size={20} className="text-blue-600" /></div>
                            <div>
                                <p className="font-bold text-zinc-900">{acc.bankName}</p>
                                <p className="text-xs text-zinc-400">{acc.accountName || acc.accountNumber}</p>
                            </div>
                        </div>
                        <p className="text-2xl font-black text-zinc-900">{fmt(acc.currentBalance)}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={`w-2 h-2 rounded-full ${acc.connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                            <span className="text-xs text-zinc-500">{acc.connectionStatus === 'connected' ? 'Connected' : 'Not connected'}</span>
                            {acc.lastSyncedAt && <span className="text-xs text-zinc-400 ml-auto">Synced {new Date(acc.lastSyncedAt).toLocaleDateString('en-GB')}</span>}
                        </div>
                    </div>
                ))}
                {accounts.length === 0 && (
                    <div className="col-span-3">
                        <EmptyState icon={<Landmark size={40} />} title="No Bank Accounts" description="Connect your bank accounts via Open Banking to import transactions automatically." />
                    </div>
                )}
            </div>

            {/* Transaction Feed */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900">Bank Transactions</h3>
                    <div className="flex gap-2">
                        <button onClick={onAutoCategorize} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-1.5"><Zap size={14} /> AI Categorize</button>
                        {['all', 'unmatched', 'matched'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${filterStatus === s ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
                                {s === 'all' ? 'All' : s === 'unmatched' ? 'Unmatched' : 'Matched'}
                            </button>
                        ))}
                    </div>
                </div>
                {filtered.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                        {filtered.slice(0, 30).map(txn => (
                            <div key={txn.id} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${txn.amount >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                        {txn.amount >= 0 ? <ArrowDownRight size={16} className="text-emerald-600" /> : <ArrowUpRight size={16} className="text-red-600" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900">{txn.counterparty || txn.description || 'Transaction'}</p>
                                        <p className="text-xs text-zinc-400">{new Date(txn.date).toLocaleDateString('en-GB')} {txn.reference && `| ${txn.reference}`}</p>
                                        {txn.aiSuggestedCategory && (
                                            <p className="text-[10px] text-blue-500 mt-0.5 flex items-center gap-1"><Zap size={10} /> AI: {txn.aiSuggestedCategory} ({Math.round((txn.aiConfidence || 0) * 100)}%)</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`font-bold ${txn.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(txn.amount)}</span>
                                    {txn.reconciliationStatus === 'unmatched' && projects.length > 0 && (
                                        <select onChange={(e) => { if (e.target.value) onReconcile(txn.id, e.target.value); }} className="text-xs border border-zinc-200 rounded-lg px-2 py-1 text-zinc-600">
                                            <option value="">Match to project...</option>
                                            {projects.slice(0, 10).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    )}
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${txn.reconciliationStatus === 'matched' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {txn.reconciliationStatus === 'matched' ? 'MATCHED' : 'UNMATCHED'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={<CreditCard size={32} />} title="No Transactions" description="Import bank transactions to begin reconciliation." />
                )}
            </div>
        </div>
    );
};

// ─── Payroll Tab ────────────────────────────────────────────────────────────

const PayrollTab: React.FC<{ runs: PayrollRun[]; selectedRun: string | null; items: PayrollItem[]; fmt: (n: number) => string; onSelectRun: (id: string) => void }> = ({ runs, selectedRun, items, fmt, onSelectRun }) => (
    <div className="space-y-6">
        {/* Payroll Runs */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-100"><h3 className="font-bold text-zinc-900">Payroll Runs</h3></div>
            {runs.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                    {runs.map(run => (
                        <div key={run.id} onClick={() => onSelectRun(run.id)} className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${selectedRun === run.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-zinc-50'}`}>
                            <div>
                                <p className="font-medium text-zinc-900">Pay Date: {new Date(run.payDate).toLocaleDateString('en-GB')}</p>
                                <p className="text-xs text-zinc-400">{new Date(run.periodStart).toLocaleDateString('en-GB')} - {new Date(run.periodEnd).toLocaleDateString('en-GB')} | {run.employeeCount} employees</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-zinc-900">{fmt(run.totalNet)}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-zinc-400">PAYE: {fmt(run.totalPAYE)}</span>
                                    <span className="text-[10px] text-zinc-400">NI: {fmt(run.totalEmployeeNI)}</span>
                                    {run.totalCIS > 0 && <span className="text-[10px] text-amber-600">CIS: {fmt(run.totalCIS)}</span>}
                                </div>
                                <span className={`mt-1 inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${run.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : run.status === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>{run.status.toUpperCase()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon={<Users size={32} />} title="No Payroll Runs" description="Create a payroll run to calculate PAYE, NI, CIS, and pension deductions for your construction team." />
            )}
        </div>

        {/* Selected Run Details */}
        {selectedRun && items.length > 0 && (
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-100"><h3 className="font-bold text-zinc-900">Payslip Breakdown</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-zinc-50 text-zinc-500 text-xs uppercase">
                            <th className="text-left p-3 font-semibold">Employee</th>
                            <th className="text-right p-3 font-semibold">Hours</th>
                            <th className="text-right p-3 font-semibold">Gross</th>
                            <th className="text-right p-3 font-semibold">PAYE</th>
                            <th className="text-right p-3 font-semibold">Emp NI</th>
                            <th className="text-right p-3 font-semibold">CIS</th>
                            <th className="text-right p-3 font-semibold">Pension</th>
                            <th className="text-right p-3 font-semibold">Net Pay</th>
                        </tr></thead>
                        <tbody className="divide-y divide-zinc-100">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-zinc-50">
                                    <td className="p-3">
                                        <span className="font-medium text-zinc-900">{item.employeeName}</span>
                                        {item.isCIS && <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded">CIS</span>}
                                    </td>
                                    <td className="p-3 text-right text-zinc-600">{item.hoursWorked}{item.overtimeHours > 0 ? ` +${item.overtimeHours} OT` : ''}</td>
                                    <td className="p-3 text-right font-medium text-zinc-900">{fmt(item.grossPay)}</td>
                                    <td className="p-3 text-right text-red-600">{fmt(item.paye)}</td>
                                    <td className="p-3 text-right text-red-600">{fmt(item.employeeNI)}</td>
                                    <td className="p-3 text-right text-amber-600">{fmt(item.cisDeduction)}</td>
                                    <td className="p-3 text-right text-zinc-500">{fmt(item.pensionEmployee)}</td>
                                    <td className="p-3 text-right font-bold text-emerald-600">{fmt(item.netPay)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
);

// ─── Tax & HMRC Tab ─────────────────────────────────────────────────────────

const TaxHMRCTab: React.FC<{ returns: TaxReturn[]; fmt: (n: number) => string; onCalculateVAT: () => void; onSubmit: (id: string) => void }> = ({ returns, fmt, onCalculateVAT, onSubmit }) => (
    <div className="space-y-6">
        {/* HMRC Status */}
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><Shield size={24} /></div>
                <div>
                    <h3 className="text-lg font-bold">HMRC Digital Tax</h3>
                    <p className="text-sm text-zinc-400">Making Tax Digital compliant. VAT, Corporation Tax & PAYE filing.</p>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={onCalculateVAT} className="px-4 py-2 bg-white text-zinc-900 rounded-lg text-sm font-bold hover:bg-zinc-100 flex items-center gap-2"><Calculator size={16} /> Calculate VAT Return</button>
            </div>
        </div>

        {/* Tax Returns */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-100"><h3 className="font-bold text-zinc-900">Tax Returns</h3></div>
            {returns.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                    {returns.map(tr => (
                        <div key={tr.id} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                            <div>
                                <p className="font-medium text-zinc-900">{tr.type} Return</p>
                                <p className="text-xs text-zinc-400">Period: {new Date(tr.periodStart).toLocaleDateString('en-GB')} - {new Date(tr.periodEnd).toLocaleDateString('en-GB')}</p>
                                {tr.dueDate && <p className="text-xs text-zinc-400 mt-0.5">Due: {new Date(tr.dueDate).toLocaleDateString('en-GB')}</p>}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="font-bold text-zinc-900">{fmt(tr.amountDue)}</p>
                                    <p className="text-[10px] text-zinc-400">Output: {fmt(tr.totalOutput)} | Input: {fmt(tr.totalInput)}</p>
                                </div>
                                {tr.status === 'draft' && (
                                    <button onClick={() => onSubmit(tr.id)} className="px-3 py-2 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 flex items-center gap-1"><Send size={14} /> Submit to HMRC</button>
                                )}
                                {tr.status === 'submitted' && (
                                    <span className="px-3 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-1"><CheckCircle2 size={14} /> Submitted</span>
                                )}
                                {tr.hmrcReceiptId && <span className="text-[10px] text-zinc-400">Ref: {tr.hmrcReceiptId}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon={<Shield size={32} />} title="No Tax Returns" description="Click 'Calculate VAT Return' to generate your first Making Tax Digital return." />
            )}
        </div>

        {/* VAT Boxes Preview */}
        {returns.length > 0 && returns[0].boxes && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <h3 className="font-bold text-zinc-900 mb-4">VAT Return Boxes</h3>
                <div className="grid grid-cols-3 gap-4">
                    {Object.entries(returns[0].boxes).map(([key, val]) => (
                        <div key={key} className="bg-zinc-50 p-3 rounded-lg">
                            <p className="text-xs text-zinc-500 uppercase font-semibold">Box {key.replace('box', '')}</p>
                            <p className="text-lg font-bold text-zinc-900">{fmt(val as number)}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

// ─── Invoice Chasers Tab ────────────────────────────────────────────────────

const InvoiceChasersTab: React.FC<{ chasers: InvoiceChaser[]; fmt: (n: number) => string; onGenerate: () => void }> = ({ chasers, fmt, onGenerate }) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-zinc-900">Automated Invoice Reminders</h3>
                <p className="text-sm text-zinc-500">Auto-chase overdue invoices with escalating reminders</p>
            </div>
            <button onClick={onGenerate} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold hover:bg-zinc-800 flex items-center gap-2"><Zap size={16} /> Generate Chasers</button>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {chasers.length > 0 ? (
                <div className="divide-y divide-zinc-100">
                    {chasers.map(ch => (
                        <div key={ch.id} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ch.reminderType === 'friendly' ? 'bg-blue-100' : ch.reminderType === 'firm' ? 'bg-amber-100' : 'bg-red-100'}`}>
                                    <Bell size={16} className={ch.reminderType === 'friendly' ? 'text-blue-600' : ch.reminderType === 'firm' ? 'text-amber-600' : 'text-red-600'} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-900">{ch.subject || `Reminder for Invoice ${ch.invoiceNumber}`}</p>
                                    <p className="text-xs text-zinc-400">{ch.invoiceVendor} | {ch.daysOverdue} days overdue</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-zinc-900">{fmt(ch.invoiceAmount || 0)}</span>
                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${ch.reminderType === 'friendly' ? 'bg-blue-100 text-blue-700' : ch.reminderType === 'firm' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{ch.reminderType.toUpperCase()}</span>
                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${ch.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>{ch.status.toUpperCase()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon={<Bell size={32} />} title="No Invoice Chasers" description="Click 'Generate Chasers' to automatically create reminders for overdue invoices." />
            )}
        </div>
    </div>
);

// ─── Integrations Tab ───────────────────────────────────────────────────────

const IntegrationsTab: React.FC<{ integrations: IntegrationCredential[] }> = ({ integrations }) => {
    const availableIntegrations = [
        { provider: 'xero', name: 'Xero', description: 'Cloud accounting, invoicing and bank reconciliation', color: 'bg-[#13B5EA]', logo: 'X' },
        { provider: 'quickbooks', name: 'QuickBooks', description: 'Small business accounting and payroll', color: 'bg-[#2CA01C]', logo: 'QB' },
        { provider: 'hmrc', name: 'HMRC MTD', description: 'Making Tax Digital - VAT, PAYE & Corporation Tax filing', color: 'bg-[#005EA5]', logo: 'HMRC' },
        { provider: 'stripe', name: 'Stripe', description: 'Online payment processing and billing', color: 'bg-[#635BFF]', logo: 'S' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-zinc-900">External Integrations</h3>
                <p className="text-sm text-zinc-500">Connect your existing accounting tools for seamless data flow</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableIntegrations.map(int => {
                    const connected = integrations.find(i => i.provider === int.provider);
                    return (
                        <div key={int.provider} className="bg-white p-6 rounded-xl border border-zinc-200 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 ${int.color} rounded-xl flex items-center justify-center text-white font-black text-sm`}>{int.logo}</div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-zinc-900">{int.name}</h4>
                                    <p className="text-xs text-zinc-500">{int.description}</p>
                                </div>
                            </div>
                            {connected ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        <span className="text-xs font-medium text-emerald-600">Connected</span>
                                        {connected.organisationName && <span className="text-xs text-zinc-400">| {connected.organisationName}</span>}
                                    </div>
                                    <button className="text-xs text-red-500 hover:text-red-700 font-medium">Disconnect</button>
                                </div>
                            ) : (
                                <button className="w-full py-2.5 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-bold hover:bg-zinc-200 flex items-center justify-center gap-2"><Link2 size={16} /> Connect</button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Receivables Aging Tab ───────────────────────────────────────────────────

const ReceivablesTab: React.FC<{ data: ReceivablesAgingReport | null; fmt: (n: number) => string }> = ({ data, fmt }) => {
    if (!data) return <EmptyState icon={<Receipt size={40} />} title="Receivables Aging" description="Invoice data will populate the aging report as invoices are created." />;
    const bucketLabels = [
        { key: 'current', label: 'Current', color: 'bg-emerald-500' },
        { key: '1-30', label: '1-30 Days', color: 'bg-blue-500' },
        { key: '31-60', label: '31-60 Days', color: 'bg-amber-500' },
        { key: '61-90', label: '61-90 Days', color: 'bg-orange-500' },
        { key: '90+', label: '90+ Days', color: 'bg-red-500' },
    ];
    const maxBucket = Math.max(...Object.values(data.buckets), 1);

    return (
        <div className="space-y-6">
            {/* Overview */}
            <div className="bg-white p-6 rounded-xl border border-zinc-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-sm font-semibold text-zinc-500 uppercase">Total Outstanding</p>
                        <p className="text-3xl font-black text-zinc-900 mt-1">{fmt(data.totalOutstanding)}</p>
                        <p className="text-sm text-zinc-400 mt-1">{data.invoiceCount} unpaid invoices</p>
                    </div>
                </div>
                {/* Aging Bars */}
                <div className="space-y-3">
                    {bucketLabels.map(b => {
                        const val = data.buckets[b.key as keyof typeof data.buckets] || 0;
                        const pct = maxBucket > 0 ? (val / maxBucket) * 100 : 0;
                        return (
                            <div key={b.key} className="flex items-center gap-4">
                                <span className="text-xs font-medium text-zinc-500 w-20">{b.label}</span>
                                <div className="flex-1 h-6 bg-zinc-100 rounded-lg overflow-hidden">
                                    <div className={`h-full ${b.color} rounded-lg transition-all`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-sm font-bold text-zinc-900 w-28 text-right">{fmt(val)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Invoice List */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="p-4 border-b border-zinc-100"><h3 className="font-bold text-zinc-900">Outstanding Invoices</h3></div>
                {data.items.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                        {data.items.map(inv => (
                            <div key={inv.invoiceId} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                                <div>
                                    <span className="font-medium text-zinc-900">{inv.invoiceNumber || 'Invoice'}</span>
                                    <span className="text-sm text-zinc-500 ml-3">{inv.vendor}</span>
                                    <p className="text-xs text-zinc-400 mt-0.5">Due: {new Date(inv.dueDate).toLocaleDateString('en-GB')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-zinc-900">{fmt(inv.amount)}</span>
                                    {inv.daysOverdue > 0 && (
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${inv.daysOverdue > 60 ? 'bg-red-100 text-red-700' : inv.daysOverdue > 30 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {inv.daysOverdue}d overdue
                                        </span>
                                    )}
                                    {inv.daysOverdue === 0 && <span className="px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">CURRENT</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={<Receipt size={32} />} title="No Outstanding Invoices" description="All invoices are paid." />
                )}
            </div>
        </div>
    );
};

// ─── PO Matching Tab ────────────────────────────────────────────────────────

const POMatchingTab: React.FC<{ data: POBillingSummary[]; fmt: (n: number) => string }> = ({ data, fmt }) => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-bold text-zinc-900">Purchase Order Billing</h3>
            <p className="text-sm text-zinc-500">Track vendor bills against POs to prevent overbilling</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {data.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-zinc-50 text-zinc-500 text-xs uppercase">
                            <th className="text-left p-3 font-semibold">PO Number</th>
                            <th className="text-left p-3 font-semibold">Vendor</th>
                            <th className="text-right p-3 font-semibold">PO Amount</th>
                            <th className="text-right p-3 font-semibold">Billed</th>
                            <th className="text-right p-3 font-semibold">Remaining</th>
                            <th className="text-right p-3 font-semibold">Utilization</th>
                            <th className="text-center p-3 font-semibold">Status</th>
                        </tr></thead>
                        <tbody className="divide-y divide-zinc-100">
                            {data.map(po => (
                                <tr key={po.id} className="hover:bg-zinc-50">
                                    <td className="p-3 font-mono font-medium text-zinc-900">{po.poNumber}</td>
                                    <td className="p-3 text-zinc-700">{po.vendor}</td>
                                    <td className="p-3 text-right text-zinc-900 font-medium">{fmt(po.poAmount)}</td>
                                    <td className="p-3 text-right text-zinc-600">{fmt(po.totalBilled)}</td>
                                    <td className={`p-3 text-right font-medium ${po.remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(po.remaining)}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${po.utilizationPercent > 100 ? 'bg-red-500' : po.utilizationPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(po.utilizationPercent, 100)}%` }} />
                                            </div>
                                            <span className="text-xs text-zinc-500">{po.utilizationPercent.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        {po.isOverbilled && <span className="px-2 py-1 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">OVERBILLED</span>}
                                        {!po.isOverbilled && po.utilizationPercent > 80 && <span className="px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">HIGH USAGE</span>}
                                        {!po.isOverbilled && po.utilizationPercent <= 80 && <span className="px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">OK</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState icon={<FileText size={32} />} title="No Purchase Orders" description="Create purchase orders to track vendor billing and prevent overbilling." />
            )}
        </div>
    </div>
);

// ─── Financial Alerts Tab ───────────────────────────────────────────────────

const AlertsTab: React.FC<{ alerts: FinancialAlert[]; fmt: (n: number) => string }> = ({ alerts, fmt }) => {
    const severityConfig: Record<string, { bg: string; border: string; icon: string; text: string }> = {
        critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', text: 'text-red-800' },
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', text: 'text-amber-800' },
        info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', text: 'text-blue-800' },
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900">Financial Alerts</h3>
                    <p className="text-sm text-zinc-500">Real-time alerts for budget overruns, cost spikes, and cash flow issues</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-700 rounded-lg">{alerts.filter(a => a.severity === 'critical').length} Critical</span>
                    <span className="px-3 py-1.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg">{alerts.filter(a => a.severity === 'warning').length} Warnings</span>
                    <span className="px-3 py-1.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg">{alerts.filter(a => a.severity === 'info').length} Info</span>
                </div>
            </div>
            {alerts.length > 0 ? (
                <div className="space-y-3">
                    {alerts.map((alert, idx) => {
                        const cfg = severityConfig[alert.severity] || severityConfig.info;
                        return (
                            <div key={idx} className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 ${cfg.icon}`}>
                                        {alert.severity === 'critical' ? <XCircle size={20} /> : alert.severity === 'warning' ? <AlertTriangle size={20} /> : <Info size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium ${cfg.text}`}>{alert.message}</p>
                                        <div className="flex gap-4 mt-2 text-xs">
                                            {alert.projectName && <span className="text-zinc-600">Project: {alert.projectName}</span>}
                                            {alert.budget !== undefined && <span className="text-zinc-600">Budget: {fmt(alert.budget)}</span>}
                                            {alert.spent !== undefined && <span className="text-zinc-600">Spent: {fmt(alert.spent)}</span>}
                                            {alert.utilization !== undefined && <span className="text-zinc-600">Utilization: {alert.utilization.toFixed(1)}%</span>}
                                            {alert.count !== undefined && <span className="text-zinc-600">Count: {alert.count}</span>}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>{alert.severity.toUpperCase()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
                    <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                    <h4 className="font-bold text-emerald-800">All Clear</h4>
                    <p className="text-sm text-emerald-600 mt-1">No financial alerts at this time. All projects are within budget.</p>
                </div>
            )}
        </div>
    );
};

// ─── Empty State ────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-zinc-300 mb-4">{icon}</div>
        <h4 className="font-bold text-zinc-700 mb-1">{title}</h4>
        <p className="text-sm text-zinc-400 max-w-sm">{description}</p>
    </div>
);

export default AccountingHubView;
