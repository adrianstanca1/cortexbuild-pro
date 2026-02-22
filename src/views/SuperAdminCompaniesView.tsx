import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Grid, List, Square, CheckSquare, XCircle, CheckCircle } from 'lucide-react';
import { Page, Company } from '@/types';
import CreateCompanyModal from '@/components/CreateCompanyModal';
import CompanyCard from '@/components/CompanyCard';
import CompanyFilters from '@/components/CompanyFilters';
import CompanyDetailPanel from '@/components/CompanyDetailPanel';
import ConfirmationModal from '@/components/ConfirmationModal';
import { db } from '@/services/db';
import { useToast } from '@/contexts/ToastContext';

// Local Company interface removed in favor of global type from @/types

interface CompanyStats {
    totalCompanies: number;
    activeCompanies: number;
    suspendedCompanies: number;
    totalUsers: number;
    totalProjects: number;
    totalMrr: number;
    recentCompanies: number;
}

interface SuperAdminCompaniesViewProps {
    setPage: (page: Page) => void;
}

const SuperAdminCompaniesView: React.FC<SuperAdminCompaniesViewProps> = ({ setPage }) => {
    const toast = useToast();

    // State
    const [companies, setCompanies] = useState<Company[]>([]);
    const [stats, setStats] = useState<CompanyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'grid' | 'list'>('grid');

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'suspend' | 'activate' | 'delete' | 'bulkSuspend' | 'bulkActivate' | 'updatePlan' | null;
        companyId: string | null;
        data?: any;
    }>({ isOpen: false, type: null, companyId: null });

    // Selection state
    const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [regionFilter, setRegionFilter] = useState('');

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [companiesData, statsData] = await Promise.all([db.getCompanies(), db.getCompanyStats()]);

            setCompanies(Array.isArray(companiesData) ? companiesData : []);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to fetch company data:', error);
            setCompanies([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    // Filter companies
    const filteredCompanies = Array.isArray(companies)
        ? companies.filter((company) => {
            // Search filter
            const matchesSearch =
                !debouncedSearch ||
                company.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                company.slug?.toLowerCase().includes(debouncedSearch.toLowerCase());

            // Status filter
            const matchesStatus = !statusFilter || company.status.toLowerCase() === statusFilter.toLowerCase();

            // Plan filter
            const matchesPlan = !planFilter || company.plan === planFilter;

            // Region filter
            const matchesRegion = !regionFilter || company.region === regionFilter;

            return matchesSearch && matchesStatus && matchesPlan && matchesRegion;
        })
        : [];

    // Actions
    const handleSuspend = (id: string) => {
        setConfirmModal({ isOpen: true, type: 'suspend', companyId: id });
    };

    const handleActivate = (id: string) => {
        setConfirmModal({ isOpen: true, type: 'activate', companyId: id });
    };

    const handleDelete = (id: string) => {
        setConfirmModal({ isOpen: true, type: 'delete', companyId: id });
    };

    const handleConfirmAction = async (reason?: string) => {
        const { type, companyId } = confirmModal;

        try {
            if (type === 'suspend' && companyId) {
                await db.suspendCompany(companyId, reason || 'Suspended by administrator');
                toast.success('Company suspended successfully');
                fetchData();
            } else if (type === 'activate' && companyId) {
                await db.activateCompany(companyId);
                toast.success('Company activated successfully');
                fetchData();
            } else if (type === 'delete' && companyId) {
                await db.deleteCompany(companyId);
                toast.success('Company deleted permanently');
                fetchData();
            } else if (type === 'updatePlan' && companyId && reason) {
                // In this case 'reason' is repurposed as the new plan name for simplicity in the mock/prompt replacement
                await db.updateCompanyLimits(companyId, { plan: reason });
                toast.success(`Plan updated to ${reason}`);
                fetchData();
            } else if (type === 'bulkSuspend') {
                const ids = Array.from(selectedCompanies);
                await db.bulkSuspendCompanies(ids);
                toast.success(`Successfully suspended ${ids.length} companies`);
                setSelectedCompanies(new Set());
                fetchData();
            } else if (type === 'bulkActivate') {
                const ids = Array.from(selectedCompanies);
                await db.bulkActivateCompanies(ids);
                toast.success(`Successfully activated ${ids.length} companies`);
                setSelectedCompanies(new Set());
                fetchData();
            }
        } catch (error: any) {
            console.error(`Failed to ${type} company:`, error);
            toast.error(error.message || `Failed to ${type}. Please try again.`);
        } finally {
            setConfirmModal({ isOpen: false, type: null, companyId: null });
        }
    };

    // Selection handlers
    const handleSelect = (id: string, selected: boolean) => {
        const newSelection = new Set(selectedCompanies);
        if (selected) {
            newSelection.add(id);
        } else {
            newSelection.delete(id);
        }
        setSelectedCompanies(newSelection);
    };

    const handleSelectAll = () => {
        if (selectedCompanies.size === filteredCompanies.length) {
            setSelectedCompanies(new Set());
        } else {
            setSelectedCompanies(new Set(filteredCompanies.map(c => c.id)));
        }
    };

    const handleBulkSuspend = () => {
        setConfirmModal({ isOpen: true, type: 'bulkSuspend', companyId: null });
    };

    const handleBulkActivate = () => {
        setConfirmModal({ isOpen: true, type: 'bulkActivate', companyId: null });
    };

    const handleViewDetails = (id: string) => {
        const company = companies.find((c) => c.id === id);
        if (company) {
            setSelectedCompany(company);
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setPlanFilter('');
        setRegionFilter('');
    };

    const handleUpdatePlan = (id: string, currentPlan: string) => {
        setConfirmModal({
            isOpen: true,
            type: 'updatePlan',
            companyId: id,
            data: { currentPlan }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading company data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 p-6 overflow-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Companies</h1>
                    <p className="text-gray-600">Manage all companies and tenants across the platform</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Create Company
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalCompanies}</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="h-6 w-6 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{stats.recentCompanies} new this month</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Companies</p>
                                <p className="text-2xl font-bold text-green-600 mt-2">{stats.activeCompanies}</p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="h-6 w-6 text-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{stats.suspendedCompanies} suspended</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="h-6 w-6 text-purple-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Across all companies</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total MRR</p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    ${(stats.totalMrr || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="h-6 w-6 text-yellow-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Monthly recurring revenue</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <CompanyFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                planFilter={planFilter}
                onPlanFilterChange={setPlanFilter}
                regionFilter={regionFilter}
                onRegionFilterChange={setRegionFilter}
                onClearFilters={handleClearFilters}
            />

            {/* View Toggle */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                    Showing <span className="font-medium">{filteredCompanies.length}</span> of{' '}
                    <span className="font-medium">{companies.length}</span> companies
                    {selectedCompanies.size > 0 && (
                        <span className="ml-2 text-blue-600 font-medium">
                            • {selectedCompanies.size} selected
                        </span>
                    )}
                </p>
                <div className="flex items-center gap-2">
                    {/* Selection Mode Toggle */}
                    <button
                        onClick={() => {
                            setSelectionMode(!selectionMode);
                            if (selectionMode) setSelectedCompanies(new Set());
                        }}
                        className={`p-2 rounded-lg transition-colors ${selectionMode ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                        title={selectionMode ? 'Exit selection mode' : 'Enter selection mode'}
                    >
                        {selectionMode ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => setView('grid')}
                        className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setView('list')}
                        className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectionMode && selectedCompanies.size > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSelectAll}
                            className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                        >
                            {selectedCompanies.size === filteredCompanies.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-sm text-blue-700">
                            {selectedCompanies.size} {selectedCompanies.size === 1 ? 'company' : 'companies'} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBulkSuspend}
                            className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <XCircle className="w-4 h-4" />
                            Suspend Selected
                        </button>
                        <button
                            onClick={handleBulkActivate}
                            className="px-4 py-2 bg-white text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Activate Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Companies Grid/List */}
            {filteredCompanies.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No companies found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {searchQuery || statusFilter || planFilter || regionFilter
                            ? 'Try adjusting your filters or search term.'
                            : 'Get started by creating your first company.'}
                    </p>
                    {!searchQuery && !statusFilter && !planFilter && !regionFilter && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create Company
                        </button>
                    )}
                </div>
            ) : (
                <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {filteredCompanies.map((company) => (
                        <CompanyCard
                            key={company.id}
                            company={company}
                            onSuspend={handleSuspend}
                            onActivate={handleActivate}
                            onDelete={handleDelete}
                            onViewDetails={handleViewDetails}
                            onUpdatePlan={handleUpdatePlan}
                            selected={selectedCompanies.has(company.id)}
                            onSelect={handleSelect}
                            selectionMode={selectionMode}
                        />
                    ))}
                </div>
            )}

            {/* Create Company Modal */}
            <CreateCompanyModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    fetchData();
                }}
            />

            {/* Company Detail Panel */}
            {selectedCompany && (
                <CompanyDetailPanel
                    company={selectedCompany}
                    isOpen={!!selectedCompany}
                    onClose={() => setSelectedCompany(null)}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, type: null, companyId: null })}
                onConfirm={handleConfirmAction}
                title={
                    confirmModal.type === 'suspend'
                        ? 'Suspend Company'
                        : confirmModal.type === 'activate'
                            ? 'Activate Company'
                            : confirmModal.type === 'delete'
                                ? 'PERMANENTLY Delete Company'
                                : confirmModal.type === 'updatePlan'
                                    ? 'Change Subscription Plan'
                                    : confirmModal.type === 'bulkSuspend'
                                        ? `Suspend ${selectedCompanies.size} Companies`
                                        : `Activate ${selectedCompanies.size} Companies`
                }
                message={
                    confirmModal.type === 'suspend'
                        ? 'Are you sure you want to suspend this company? This action will restrict access for all users in this company.'
                        : confirmModal.type === 'activate'
                            ? 'Are you sure you want to activate this company? Users will regain access to the platform.'
                            : confirmModal.type === 'delete'
                                ? 'DANGER: Are you sure you want to PERMANENTLY delete this company? All data, users, and projects will be erased. This action cannot be undone.'
                                : confirmModal.type === 'updatePlan'
                                    ? `Please specify the new subscription plan for this company. Current plan: ${confirmModal.data?.currentPlan}`
                                    : confirmModal.type === 'bulkSuspend'
                                        ? `Are you sure you want to suspend ${selectedCompanies.size} companies? This action will restrict access for all users in these companies.`
                                        : `Are you sure you want to activate ${selectedCompanies.size} companies? Users will regain access to the platform.`
                }
                confirmText={
                    confirmModal.type === 'suspend' || confirmModal.type === 'bulkSuspend'
                        ? 'Suspend'
                        : confirmModal.type === 'delete'
                            ? 'Delete Permanently'
                            : confirmModal.type === 'updatePlan'
                                ? 'Update Plan'
                                : 'Activate'
                }
                variant={
                    confirmModal.type === 'suspend' || confirmModal.type === 'bulkSuspend' || confirmModal.type === 'delete'
                        ? 'danger'
                        : 'warning'
                }
                requireReason={confirmModal.type === 'suspend' || confirmModal.type === 'delete' || confirmModal.type === 'updatePlan'}
                reasonPlaceholder={confirmModal.type === 'updatePlan' ? 'Enter plan name (Starter, Pro, Enterprise)...' : 'Reason for this action...'}
            />
        </div>
    );
};

export default SuperAdminCompaniesView;
