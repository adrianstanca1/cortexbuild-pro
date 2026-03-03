import React, { useState, useEffect, useCallback } from 'react';
import {
    User,
    Expense,
    Project,
    ExpenseStatus,
    ExpenseCategory,
    Permission,
    View
} from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ViewHeader } from '../layout/ViewHeader';
import { hasPermission } from '../../services/auth';
import { api } from '../../services/mockApi';
import {
    Plus,
    Edit,
    Trash2,
    Calendar,
    DollarSign,
    FileText,
    Search,
    Filter,
    CheckCircle,
    Clock,
    XCircle,
    Receipt,
    User as UserIcon,
    FolderOpen
} from 'lucide-react';
import { format } from '../../utils/date';

interface ExpenseManagementProps {
    user: User;
    addToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    setActiveView: (view: View) => void;
}

interface ExpenseFormData {
    description: string;
    amount: number;
    category: ExpenseCategory;
    projectId: string;
    date: string;
    receipt?: string;
    notes?: string;
}

const ExpenseCard: React.FC<{
    expense: Expense;
    project?: Project;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
    onApprove: (expense: Expense) => void;
    onReject: (expense: Expense) => void;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
}> = ({ expense, project, onEdit, onDelete, onApprove, onReject, canEdit, canDelete, canApprove }) => {
    const statusColors = {
        [ExpenseStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
        [ExpenseStatus.APPROVED]: 'bg-green-100 text-green-800',
        [ExpenseStatus.REJECTED]: 'bg-red-100 text-red-800',
        [ExpenseStatus.PAID]: 'bg-blue-100 text-blue-800',
    };

    const statusIcons = {
        [ExpenseStatus.PENDING]: Clock,
        [ExpenseStatus.APPROVED]: CheckCircle,
        [ExpenseStatus.REJECTED]: XCircle,
        [ExpenseStatus.PAID]: DollarSign,
    };

    const categoryColors: Record<string, string> = {
        [ExpenseCategory.MATERIALS]: 'bg-blue-50 text-blue-700',
        [ExpenseCategory.LABOR]: 'bg-green-50 text-green-700',
        [ExpenseCategory.EQUIPMENT]: 'bg-purple-50 text-purple-700',
        [ExpenseCategory.SUBCONTRACTOR]: 'bg-orange-50 text-orange-700',
        [ExpenseCategory.PERMITS]: 'bg-gray-50 text-gray-700',
        [ExpenseCategory.OTHER]: 'bg-gray-50 text-gray-700',
    };

    const StatusIcon = statusIcons[expense.status];
    const expenseDate = new Date(expense.date);

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                        {expense.receipt && (
                            <Receipt className="w-4 h-4 text-blue-500" />
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-medium">${expense.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(expenseDate, 'MMM dd, yyyy')}</span>
                        </div>
                    </div>
                    {project && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <FolderOpen className="w-3 h-3" />
                            <span>Project: {project.name}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <StatusIcon className="w-5 h-5 text-gray-400" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[expense.status]}`}>
                        {expense.status.charAt(0) + expense.status.slice(1).toLowerCase()}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[expense.category]}`}>
                    {expense.category.replace('_', ' ')}
                </span>
                <div className="text-xs text-gray-500">
                    Submitted {format(new Date(expense.submittedAt), 'MMM dd')}
                </div>
            </div>

            {expense.rejectionReason && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Rejection reason:</strong> {expense.rejectionReason}
                </div>
            )}

            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    {expense.status === ExpenseStatus.PENDING && canApprove && (
                        <>
                            <Button size="sm" variant="primary" onClick={() => onApprove(expense)}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => onReject(expense)}>
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                            </Button>
                        </>
                    )}
                </div>

                <div className="flex gap-2">
                    {canEdit && expense.status === ExpenseStatus.PENDING && (
                        <Button variant="outline" size="sm" onClick={() => onEdit(expense)}>
                            <Edit className="w-4 h-4" />
                        </Button>
                    )}
                    {canDelete && expense.status === ExpenseStatus.PENDING && (
                        <Button variant="outline" size="sm" onClick={() => onDelete(expense)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};

const ExpenseModal: React.FC<{
    expense: Expense | null;
    projects: Project[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (expenseData: ExpenseFormData) => void;
    title: string;
}> = ({ expense, projects, isOpen, onClose, onSave, title }) => {
    const [formData, setFormData] = useState<ExpenseFormData>({
        description: '',
        amount: 0,
        category: ExpenseCategory.OTHER,
        projectId: '',
        date: '',
        receipt: '',
        notes: '',
    });

    useEffect(() => {
        if (expense) {
            setFormData({
                description: expense.description,
                amount: expense.amount,
                category: expense.category as ExpenseCategory,
                projectId: expense.projectId,
                date: expense.date?.substring(0, 10) || '',
                receipt: expense.receipt || '',
                notes: '',
            });
        } else {
            setFormData({
                description: '',
                amount: 0,
                category: ExpenseCategory.OTHER,
                projectId: projects[0]?.id || '',
                date: new Date().toISOString().substring(0, 10),
                receipt: '',
                notes: '',
            });
        }
    }, [expense, projects]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <Button variant="outline" onClick={onClose}>
                        ×
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter expense description"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount *
                            </label>
                            <div className="relative">
                                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                    aria-label="Expense amount"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date *
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                aria-label="Expense date"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category *
                            </label>
                            <select
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                                aria-label="Expense category"
                            >
                                <option value={ExpenseCategory.MATERIALS}>Materials</option>
                                <option value={ExpenseCategory.LABOR}>Labor</option>
                                <option value={ExpenseCategory.EQUIPMENT}>Equipment</option>
                                <option value={ExpenseCategory.SUBCONTRACTOR}>Subcontractor</option>
                                <option value={ExpenseCategory.PERMITS}>Permits</option>
                                <option value={ExpenseCategory.OTHER}>Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project *
                            </label>
                            <select
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.projectId}
                                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                                aria-label="Project selection"
                            >
                                <option value="">Select a project</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Receipt URL
                        </label>
                        <input
                            type="url"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.receipt}
                            onChange={(e) => setFormData(prev => ({ ...prev, receipt: e.target.value }))}
                            placeholder="https://example.com/receipt.pdf"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes about this expense..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {expense ? 'Update Expense' : 'Submit Expense'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RejectExpenseModal: React.FC<{
    expense: Expense | null;
    isOpen: boolean;
    onClose: () => void;
    onReject: (reason: string) => void;
}> = ({ expense, isOpen, onClose, onReject }) => {
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onReject(reason);
        setReason('');
        onClose();
    };

    if (!isOpen || !expense) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Reject Expense</h2>
                    <Button variant="outline" onClick={onClose}>
                        ×
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-2">
                            Rejecting expense: <strong>{expense.description}</strong>
                        </p>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for rejection *
                        </label>
                        <textarea
                            required
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please provide a reason for rejecting this expense..."
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="danger">
                            Reject Expense
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ExpenseManagement: React.FC<ExpenseManagementProps> = ({
    user,
    addToast,
    setActiveView
}) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'ALL'>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL');
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

    const canSubmitExpenses = hasPermission(user, Permission.SUBMIT_EXPENSE);
    const canApproveExpenses = hasPermission(user, Permission.MANAGE_FINANCES);
    const canDeleteExpenses = hasPermission(user, Permission.MANAGE_FINANCES);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [expenseData, projectData] = await Promise.all([
                api.getExpenses(),
                api.getProjects()
            ]);
            setExpenses(expenseData);
            setProjects(projectData);
        } catch (error) {
            console.error('Failed to load data:', error);
            addToast('Failed to load expenses and projects', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || expense.status === statusFilter;
        const matchesCategory = categoryFilter === 'ALL' || expense.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    const handleCreateExpense = () => {
        setSelectedExpense(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleEditExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDeleteExpense = async (expense: Expense) => {
        if (window.confirm(`Are you sure you want to delete "${expense.description}"?`)) {
            try {
                setExpenses(prev => prev.filter(e => e.id !== expense.id));
                addToast('Expense deleted successfully', 'success');
            } catch (error) {
                console.error('Failed to delete expense:', error);
                addToast('Failed to delete expense', 'error');
            }
        }
    };

    const handleApproveExpense = async (expense: Expense) => {
        try {
            const updatedExpense = await api.updateExpense(expense.id, {
                status: ExpenseStatus.APPROVED,
                approvedBy: user.id
            }, user.id);
            setExpenses(prev => prev.map(e => e.id === expense.id ? updatedExpense : e));
            addToast('Expense approved successfully', 'success');
        } catch (error) {
            console.error('Failed to approve expense:', error);
            addToast('Failed to approve expense', 'error');
        }
    };

    const handleRejectExpense = async (expense: Expense) => {
        setSelectedExpense(expense);
        setIsRejectModalOpen(true);
    };

    const handleRejectWithReason = async (reason: string) => {
        if (!selectedExpense) return;

        try {
            const updatedExpense = await api.updateExpense(selectedExpense.id, {
                status: ExpenseStatus.REJECTED,
                rejectionReason: reason
            }, user.id);
            setExpenses(prev => prev.map(e => e.id === selectedExpense.id ? updatedExpense : e));
            addToast('Expense rejected', 'warning');
        } catch (error) {
            console.error('Failed to reject expense:', error);
            addToast('Failed to reject expense', 'error');
        }
    };

    const handleSaveExpense = async (expenseData: ExpenseFormData) => {
        try {
            if (modalMode === 'create') {
                const newExpense = await api.createExpense({
                    ...expenseData,
                    status: ExpenseStatus.PENDING,
                    userId: user.id,
                    submittedAt: new Date().toISOString(),
                    date: `${expenseData.date}T00:00:00Z`,
                });
                setExpenses(prev => [...prev, newExpense]);
                addToast('Expense submitted successfully', 'success');
            } else if (selectedExpense) {
                const updatedExpense = await api.updateExpense(selectedExpense.id, {
                    ...expenseData,
                    date: `${expenseData.date}T00:00:00Z`,
                }, user.id);
                setExpenses(prev => prev.map(e => e.id === selectedExpense.id ? updatedExpense : e));
                addToast('Expense updated successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to save expense:', error);
            addToast('Failed to save expense', 'error');
        }
    };

    const expenseStats = {
        total: expenses.length,
        pending: expenses.filter(e => e.status === ExpenseStatus.PENDING).length,
        approved: expenses.filter(e => e.status === ExpenseStatus.APPROVED).length,
        rejected: expenses.filter(e => e.status === ExpenseStatus.REJECTED).length,
        totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
        approvedAmount: expenses.filter(e => e.status === ExpenseStatus.APPROVED).reduce((sum, e) => sum + e.amount, 0),
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <ViewHeader
                title="Expense Management"
                description={`${expenseStats.total} total expenses • $${expenseStats.totalAmount.toLocaleString()} total • $${expenseStats.approvedAmount.toLocaleString()} approved`}
                actions={
                    canSubmitExpenses && (
                        <Button onClick={handleCreateExpense}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Expense
                        </Button>
                    )
                }
            />

            {/* Expense Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Expenses</p>
                            <p className="text-2xl font-bold">{expenseStats.total}</p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold">{expenseStats.pending}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Approved</p>
                            <p className="text-2xl font-bold">{expenseStats.approved}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold">${expenseStats.totalAmount.toLocaleString()}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as ExpenseStatus | 'ALL')}
                            aria-label="Filter by status"
                        >
                            <option value="ALL">All Status</option>
                            <option value={ExpenseStatus.PENDING}>Pending</option>
                            <option value={ExpenseStatus.APPROVED}>Approved</option>
                            <option value={ExpenseStatus.REJECTED}>Rejected</option>
                            <option value={ExpenseStatus.PAID}>Paid</option>
                        </select>
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'ALL')}
                            aria-label="Filter by category"
                        >
                            <option value="ALL">All Categories</option>
                            <option value={ExpenseCategory.MATERIALS}>Materials</option>
                            <option value={ExpenseCategory.LABOR}>Labor</option>
                            <option value={ExpenseCategory.EQUIPMENT}>Equipment</option>
                            <option value={ExpenseCategory.SUBCONTRACTOR}>Subcontractor</option>
                            <option value={ExpenseCategory.PERMITS}>Permits</option>
                            <option value={ExpenseCategory.OTHER}>Other</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Expenses Grid */}
            {filteredExpenses.length === 0 ? (
                <Card className="p-8 text-center">
                    <div className="text-gray-500">
                        {expenses.length === 0 ? (
                            <div>
                                <h3 className="text-lg font-medium mb-2">No expenses yet</h3>
                                <p className="mb-4">Start by submitting your first expense</p>
                                {canSubmitExpenses && (
                                    <Button onClick={handleCreateExpense}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Submit Expense
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-lg font-medium mb-2">No expenses match your search</h3>
                                <p>Try adjusting your search criteria</p>
                            </div>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExpenses.map((expense) => (
                        <ExpenseCard
                            key={expense.id}
                            expense={expense}
                            project={projects.find(p => p.id === expense.projectId)}
                            onEdit={handleEditExpense}
                            onDelete={handleDeleteExpense}
                            onApprove={handleApproveExpense}
                            onReject={handleRejectExpense}
                            canEdit={canSubmitExpenses && expense.userId === user.id}
                            canDelete={canDeleteExpenses}
                            canApprove={canApproveExpenses}
                        />
                    ))}
                </div>
            )}

            {/* Expense Modal */}
            <ExpenseModal
                expense={selectedExpense}
                projects={projects}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveExpense}
                title={modalMode === 'create' ? 'Submit New Expense' : 'Edit Expense'}
            />

            {/* Reject Modal */}
            <RejectExpenseModal
                expense={selectedExpense}
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                onReject={handleRejectWithReason}
            />
        </div>
    );
};