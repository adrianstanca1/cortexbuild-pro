import React, { useState, useEffect } from 'react';
import { Plus, Shield, DollarSign, TrendingUp } from 'lucide-react';
import { subcontractorsApi, SubcontractorInsurance, PaymentApplication } from '../../services/constructionApi';
import { useProjects } from '../../contexts/ProjectContext';
import SubcontractorForm from '../../components/construction/SubcontractorForm';

const SubcontractorsView: React.FC = () => {
    const { activeProject } = useProjects();
    const [activeTab, setActiveTab] = useState<'insurance' | 'payments'>('insurance');
    const [insurance, setInsurance] = useState<SubcontractorInsurance[]>([]);
    const [payments, setPayments] = useState<PaymentApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeProject, activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'insurance') {
                const res = await subcontractorsApi.insurance.getAll();
                setInsurance(res.data);
            } else {
                const res = await subcontractorsApi.paymentApplications.getAll(activeProject?.id);
                setPayments(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch subcontractor data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateData = async (data: any) => {
        try {
            if (activeTab === 'insurance') {
                await subcontractorsApi.insurance.create(data);
            } else {
                await subcontractorsApi.paymentApplications.create(data);
            }
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create subcontractor data:', error);
        }
    };

    const expiringInsurance = insurance.filter(ins => {
        const expiryDate = new Date(ins.expiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
    });

    const stats = {
        totalInsurance: insurance.length,
        expiring: expiringInsurance.length,
        totalPayments: payments.length,
        pendingPayments: payments.filter(p => p.status === 'submitted' || p.status === 'reviewing').length,
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Subcontractor Management</h1>
                    <p className="text-gray-600 mt-1">Track insurance and payment applications</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add {activeTab === 'insurance' ? 'Insurance' : 'Payment'}
                </button>
            </div>

            {showForm && (
                <SubcontractorForm
                    type={activeTab === 'insurance' ? 'insurance' : 'payment'}
                    projectId={activeProject?.id}
                    onSubmit={handleCreateData}
                    onClose={() => setShowForm(false)}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Insurance Policies</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalInsurance}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Expiring Soon</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.expiring}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Payment Apps</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPayments}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Review</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingPayments}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('insurance')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'insurance'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Insurance Tracking
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 'payments'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Payment Applications
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === 'insurance' && (
                        <div className="space-y-4">
                            {insurance.map((ins) => {
                                const isExpiring = expiringInsurance.some(e => e.id === ins.id);
                                return (
                                    <div key={ins.id} className={`border rounded-lg p-4 ${isExpiring ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{ins.insuranceType}</h3>
                                                <p className="text-sm text-gray-600 mt-1">Policy #{ins.policyNumber} • {ins.provider}</p>
                                                <p className="text-sm text-gray-600">Coverage: ${ins.coverageAmount.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-600">Expires</p>
                                                <p className={`text-sm font-medium ${isExpiring ? 'text-orange-600' : 'text-gray-900'}`}>
                                                    {new Date(ins.expiryDate).toLocaleDateString()}
                                                </p>
                                                {isExpiring && (
                                                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                                                        Expiring Soon
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {insurance.length === 0 && <p className="text-center text-gray-500 py-8">No insurance policies tracked</p>}
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-4">
                            {payments.map((payment) => (
                                <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">Application #{payment.applicationNumber}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Period: {new Date(payment.periodStart).toLocaleDateString()} - {new Date(payment.periodEnd).toLocaleDateString()}
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                                <div>
                                                    <p className="text-xs text-gray-600">Completed Value</p>
                                                    <p className="text-sm font-medium text-gray-900">${payment.completedValue.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">Previously Paid</p>
                                                    <p className="text-sm font-medium text-gray-900">${payment.previouslyPaid.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">Current Due</p>
                                                    <p className="text-sm font-medium text-green-600">${payment.currentDue.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600">Retainage</p>
                                                    <p className="text-sm font-medium text-orange-600">${payment.retainage.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                payment.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                                    payment.status === 'reviewing' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {payment.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {payments.length === 0 && <p className="text-center text-gray-500 py-8">No payment applications</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubcontractorsView;
