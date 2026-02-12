import React, { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

interface ConcreteTestFormProps {
    pourId: string;
    onSubmit: (data: any) => Promise<void>;
    onClose: () => void;
}

const ConcreteTestForm: React.FC<ConcreteTestFormProps> = ({ pourId, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        testDate: new Date().toISOString().split('T')[0],
        age: 7,
        strength: '',
        testType: '7-day',
        passed: true,
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await onSubmit({
                ...formData,
                pourId,
                strength: Number(formData.strength),
                age: Number(formData.age)
            });
        } catch (error) {
            console.error('Error submitting test:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAgeChange = (age: number) => {
        let type = '7-day';
        if (age === 14) type = '14-day';
        if (age === 28) type = '28-day';
        if (age === 56) type = '56-day';

        setFormData(prev => ({ ...prev, age, testType: type }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Log Compression Test</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Close" aria-label="Close">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Test Date</label>
                        <input
                            type="date"
                            required
                            title="Test Date"
                            value={formData.testDate}
                            onChange={e => setFormData({ ...formData, testDate: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Age (Days)</label>
                            <select
                                value={formData.age}
                                title="Age Selection"
                                onChange={e => handleAgeChange(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={3}>3 Days</option>
                                <option value={7}>7 Days</option>
                                <option value={14}>14 Days</option>
                                <option value={28}>28 Days</option>
                                <option value={56}>56 Days</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Strength (PSI)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                title="Strength in PSI"
                                placeholder="e.g. 4500"
                                value={formData.strength}
                                onChange={e => setFormData({ ...formData, strength: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Result Status</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.passed ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="passed"
                                    checked={formData.passed}
                                    onChange={() => setFormData({ ...formData, passed: true })}
                                    className="hidden"
                                />
                                <span className="text-sm font-bold">PASSED</span>
                            </label>
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${!formData.passed ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="passed"
                                    checked={!formData.passed}
                                    onChange={() => setFormData({ ...formData, passed: false })}
                                    className="hidden"
                                />
                                <AlertTriangle size={16} />
                                <span className="text-sm font-bold">FAILED</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Optional observations..."
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? 'Saving...' : <><Save size={18} /> Save Result</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConcreteTestForm;
