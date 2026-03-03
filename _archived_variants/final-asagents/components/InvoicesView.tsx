import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { api } from '../services/mockApi';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { InvoiceStatusBadge } from './ui/StatusBadge';
import { Tag } from './ui/Tag';
import { Client, Invoice, InvoiceStatus, Project, User } from '../types';
import { formatCurrency, getInvoiceFinancials, getDerivedStatus } from '../utils/finance';

interface InvoicesViewProps {
    user: User;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type StatusFilter = 'ALL' | InvoiceStatus;

type SummaryTone = 'default' | 'warning' | 'success' | 'danger';

type StatusBreakdown = Record<InvoiceStatus, { count: number; total: number; overdue: number }>;

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
    { id: 'ALL', label: 'All' },
    { id: InvoiceStatus.DRAFT, label: 'Draft' },
    { id: InvoiceStatus.SENT, label: 'Sent' },
    { id: InvoiceStatus.OVERDUE, label: 'Overdue' },
    { id: InvoiceStatus.PAID, label: 'Paid' },
    { id: InvoiceStatus.CANCELLED, label: 'Cancelled' },
];

const formatDate = (value?: string): string => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, 'd MMM yyyy');
};

const getDueDateValue = (invoice: Invoice): number | null => {
    const raw = invoice.dueAt || invoice.dueDate;
    if (!raw) return null;
    const timestamp = new Date(raw).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
};

const getAgingLabel = (invoice: Invoice) => {
    const dueValue = getDueDateValue(invoice);
    if (dueValue === null) {
        return { label: 'No due date', tone: 'default' as SummaryTone };
    }

    const today = new Date();
    const diff = differenceInCalendarDays(new Date(dueValue), today);

    if (diff > 0) {
        if (diff <= 3) {
            return { label: `${diff} day${diff === 1 ? '' : 's'} remaining`, tone: 'warning' as SummaryTone };
        }
        return { label: `${diff} day${diff === 1 ? '' : 's'} remaining`, tone: 'success' as SummaryTone };
    }

    if (diff === 0) {
        return { label: 'Due today', tone: 'warning' as SummaryTone };
    }

    const overdueDays = Math.abs(diff);
    return {
        label: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
        tone: overdueDays > 7 ? 'danger' : 'warning',
    };
};

const SummaryCard: React.FC<{ title: string; value: string; helper?: string; tone?: SummaryTone }> = ({
    title,
    value,
    helper,
    tone = 'default',
}) => {
    const toneBar: Record<SummaryTone, string> = {
        default: 'bg-primary/30',
        warning: 'bg-yellow-400/80',
        success: 'bg-green-500/80',
        danger: 'bg-red-500/80',
    };

    return (
        <Card className="relative overflow-hidden">
            <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${toneBar[tone]}`} />
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
            {helper && <p className="mt-2 text-xs text-muted-foreground">{helper}</p>}
        </Card>
    );
};

const buildStatusBreakdown = (invoices: Invoice[]): StatusBreakdown => {
    const initial: StatusBreakdown = {
        [InvoiceStatus.DRAFT]: { count: 0, total: 0, overdue: 0 },
        [InvoiceStatus.SENT]: { count: 0, total: 0, overdue: 0 },
        [InvoiceStatus.OVERDUE]: { count: 0, total: 0, overdue: 0 },
        [InvoiceStatus.PAID]: { count: 0, total: 0, overdue: 0 },
        [InvoiceStatus.CANCELLED]: { count: 0, total: 0, overdue: 0 },
    };

    invoices.forEach(invoice => {
        const derived = getDerivedStatus(invoice);
        const bucket = initial[derived];
        if (!bucket) return;
        const { total, balance } = getInvoiceFinancials(invoice);
        bucket.count += 1;
        bucket.total += total;
        const dueValue = getDueDateValue(invoice);
        if (dueValue !== null && dueValue < Date.now() && balance > 0) {
            bucket.overdue += 1;
        }
    });

    return initial;
};

export const InvoicesView: React.FC<InvoicesViewProps> = ({ user, addToast }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        if (!user.companyId) {
            setInvoices([]);
            setProjects([]);
            setClients([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [invoiceData, projectData, clientData] = await Promise.all([
                api.getInvoicesByCompany(user.companyId),
                api.getProjectsByCompany(user.companyId),
                api.getClientsByCompany(user.companyId),
            ]);
            setInvoices(invoiceData);
            setProjects(projectData);
            setClients(clientData);
        } catch (error) {
            console.error('Failed to load invoices', error);
            addToast('Failed to load invoices.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user.companyId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const projectMap = useMemo(() => new Map(projects.map(project => [project.id, project])), [projects]);
    const clientMap = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);

    const filteredInvoices = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return invoices.filter(invoice => {
            if (statusFilter !== 'ALL' && getDerivedStatus(invoice) !== statusFilter) {
                return false;
            }

            if (!normalizedSearch) return true;

            const project = projectMap.get(invoice.projectId);
            const client = clientMap.get(invoice.clientId);

            return [
                invoice.invoiceNumber,
                project?.name,
                client?.name,
            ]
                .filter(Boolean)
                .some(value => value!.toLowerCase().includes(normalizedSearch));
        });
    }, [invoices, statusFilter, searchTerm, projectMap, clientMap]);

    const statusBreakdown = useMemo(() => buildStatusBreakdown(invoices), [invoices]);

    const totalOutstanding = useMemo(() => {
        return invoices.reduce((acc, invoice) => {
            const { balance } = getInvoiceFinancials(invoice);
            return acc + balance;
        }, 0);
    }, [invoices]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Invoices</h1>
                    <p className="text-muted-foreground">Track outstanding balances, statuses, and cash flow.</p>
                </div>
                <Button onClick={() => addToast('Invoice creation coming soon.', 'info')}>
                    Create Invoice
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SummaryCard title="Outstanding" value={formatCurrency(totalOutstanding)} helper="Total balance across all invoices" tone={totalOutstanding > 0 ? 'warning' : 'default'} />
                <SummaryCard title="Overdue" value={`${statusBreakdown[InvoiceStatus.OVERDUE]?.count ?? 0}`}
                    helper={`${formatCurrency(statusBreakdown[InvoiceStatus.OVERDUE]?.total ?? 0)} overdue`} tone={statusBreakdown[InvoiceStatus.OVERDUE]?.count ? 'danger' : 'default'} />
                <SummaryCard title="Paid" value={`${statusBreakdown[InvoiceStatus.PAID]?.count ?? 0}`}
                    helper={`${formatCurrency(statusBreakdown[InvoiceStatus.PAID]?.total ?? 0)} collected`} tone="success" />
            </div>

            <Card>
                <div className="flex flex-col gap-4 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {STATUS_FILTERS.map(filter => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() => setStatusFilter(filter.id)}
                                    className={`rounded-full border px-3 py-1 text-sm transition ${
                                        statusFilter === filter.id
                                            ? 'border-transparent bg-primary text-primary-foreground shadow-sm'
                                            : 'border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={event => setSearchTerm(event.target.value)}
                            placeholder="Search by number, project, or client"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 md:w-64"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">Invoice</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">Issued</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">Due</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">Aging</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                            Loading invoices…
                                        </td>
                                    </tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                            No invoices match the selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map(invoice => {
                                        const project = projectMap.get(invoice.projectId);
                                        const client = clientMap.get(invoice.clientId);
                                        const financials = getInvoiceFinancials(invoice);
                                        const aging = getAgingLabel(invoice);
                                        const derived = getDerivedStatus(invoice);

                                        return (
                                            <tr key={invoice.id} className="hover:bg-muted/40">
                                                <td className="whitespace-nowrap px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{client?.name ?? '—'}</span>
                                                        {client?.contactPerson && (
                                                            <span className="text-xs text-muted-foreground">{client.contactPerson}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">{project?.name ?? '—'}</td>
                                                <td className="px-4 py-3">{formatDate(invoice.issuedAt || invoice.issueDate)}</td>
                                                <td className="px-4 py-3">{formatDate(invoice.dueAt || invoice.dueDate)}</td>
                                                <td className="px-4 py-3">
                                                    <InvoiceStatusBadge status={derived} />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-semibold">{formatCurrency(financials.total)}</span>
                                                        {financials.balance > 0 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Balance {formatCurrency(financials.balance)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Tag
                                                        label={aging.label}
                                                        color={aging.tone === 'danger' ? 'red' : aging.tone === 'success' ? 'green' : 'yellow'}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default InvoicesView;
