import React, { useState } from 'react';
import { X, Shield, DollarSign, Save } from 'lucide-react';

interface SubcontractorFormProps {
    type: 'insurance' | 'payment';
    projectId?: string;
    onSubmit: (data: any) => void;
    onClose: () => void;
}

const SubcontractorForm: React.FC<SubcontractorFormProps> = ({ type, projectId, onSubmit, onClose }) => {
    // Shared state
    const [subcontractorId, setSubcontractorId] = useState('');

    // Insurance states
    const [insuranceData, setInsuranceData] = useState({
        insuranceType: 'General Liability',
        policyNumber: '',
        provider: '',
        coverageAmount: 1000000,
        effectiveDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    });

    // Payment states
    const [paymentData, setPaymentData] = useState({
        applicationNumber: 1,
        periodStart: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        scheduledValue: 0,
        completedValue: 0,
        materialsStored: 0,
        totalEarned: 0,
        previouslyPaid: 0,
        currentDue: 0,
        retainage: 10, // 10% default
        status: 'submitted' as const,
        submittedDate: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (type === 'insurance') {
            onSubmit({
                subcontractorId,
                ...insuranceData,
                coverageAmount: Number(insuranceData.coverageAmount),
            });
        } else {
            onSubmit({
                subcontractorId,
                projectId,
                ...paymentData,
                applicationNumber: Number(paymentData.applicationNumber),
                scheduledValue: Number(paymentData.scheduledValue),
                completedValue: Number(paymentData.completedValue),
                materialsStored: Number(paymentData.materialsStored),
                totalEarned: Number(paymentData.totalEarned),
                previouslyPaid: Number(paymentData.previouslyPaid),
                currentDue: Number(paymentData.currentDue),
                retainage: Number(paymentData.retainage),
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {type === 'insurance' ? 'Add Insurance Policy' : 'New Payment Application'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Subcontractor ID</label>
                        <input
                            required
                            type="text"
                            value={subcontractorId}
                            onChange={(e) => setSubcontractorId(e.target.value)}
                            placeholder="Enter Subcontractor ID or Name"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {type === 'insurance' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Insurance Type</label>
                                    <select
                                        value={insuranceData.insuranceType}
                                        onChange={(e) => setInsuranceData({ ...insuranceData, insuranceType: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option>General Liability</option>
                                        <option>Workers Comp</option>
                                        <option>Excess Liability</option>
                                        <option>Professional Liability</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Policy Number</label>
                                    <input
                                        required
                                        type="text"
                                        value={insuranceData.policyNumber}
                                        onChange={(e) => setInsuranceData({ ...insuranceData, policyNumber: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Provider</label>
                                <input
                                    required
                                    type="text"
                                    value={insuranceData.provider}
                                    onChange={(e) => setInsuranceData({ ...insuranceData, provider: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Coverage Amount ($)</label>
                                    <input
                                        required
                                        type="number"
                                        value={insuranceData.coverageAmount}
                                        onChange={(e) => setInsuranceData({ ...insuranceData, coverageAmount: Number(e.target.value) })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Effective Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={insuranceData.effectiveDate}
                                        onChange={(e) => setInsuranceData({ ...insuranceData, effectiveDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                                    <input
                                        required
                                        type="date"
                                        value={insuranceData.expiryDate}
                                        onChange={(e) => setInsuranceData({ ...insuranceData, expiryDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">App Number</label>
                                    <input
                                        required
                                        type="number"
                                        value={paymentData.applicationNumber}
                                        onChange={(e) => setPaymentData({ ...paymentData, applicationNumber: Number(e.target.value) })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Retainage (%)</label>
                                    <input
                                        required
                                        type="number"
                                        value={paymentData.retainage}
                                        onChange={(e) => setPaymentData({ ...paymentData, retainage: Number(e.target.value) })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Period Start</label>
                                    <input
                                        required
                                        type="date"
                                        value={paymentData.periodStart}
                                        onChange={(e) => setPaymentData({ ...paymentData, periodStart: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Period End</label>
                                    <input
                                        required
                                        type="date"
                                        value={paymentData.periodEnd}
                                        onChange={(e) => setPaymentData({ ...paymentData, periodEnd: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Completed Value ($)</label>
                                    <input
                                        required
                                        type="number"
                                        value={paymentData.completedValue}
                                        onChange={(e) => setPaymentData({ ...paymentData, completedValue: Number(e.target.value) })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Current Due ($)</label>
                                    <input
                                        required
                                        type="number"
                                        value={paymentData.currentDue}
                                        onChange={(e) => setPaymentData({ ...paymentData, currentDue: Number(e.target.value) })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {type === 'insurance' ? 'Save Insurance' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubcontractorForm;
