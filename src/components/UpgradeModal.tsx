import { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    daysRemaining?: number;
    storageUsedPercent?: number;
}

export function UpgradeModal({ isOpen, onClose, daysRemaining = 0, storageUsedPercent = 0 }: UpgradeModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<string>('pro');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        setLoading(true);
        // Simulate API call to create Stripe Checkout session
        setTimeout(() => {
            setLoading(false);
            alert(`Redirecting to Stripe Checkout for ${plans.find(p => p.id === selectedPlan)?.name} plan...`);
            onClose();
        }, 1500);
    };

    const plans = [
        {
            id: 'starter',
            name: 'Starter',
            price: 29,
            storage: '50GB',
            database: '50GB',
            users: '25',
            features: [
                'Unlimited projects',
                '50GB file storage',
                '50GB database storage',
                'Up to 25 users',
                'Email support',
                'Basic analytics'
            ]
        },
        {
            id: 'pro',
            name: 'Professional',
            price: 99,
            storage: '200GB',
            database: '200GB',
            users: '100',
            popular: true,
            features: [
                'Everything in Starter',
                '200GB file storage',
                '200GB database storage',
                'Up to 100 users',
                'Priority support',
                'Advanced analytics',
                'Custom integrations',
                'API access'
            ]
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 299,
            storage: 'Unlimited',
            database: 'Unlimited',
            users: 'Unlimited',
            features: [
                'Everything in Professional',
                'Unlimited storage',
                'Unlimited users',
                '24/7 dedicated support',
                'Custom SLAs',
                'White-label option',
                'Advanced security',
                'Dedicated account manager'
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Upgrade Your Plan</h2>
                            {daysRemaining <= 3 && (
                                <p className="text-blue-100">
                                    {daysRemaining === 0
                                        ? 'Your trial expires today! Upgrade to continue using all features.'
                                        : `Only ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your trial.`
                                    }
                                </p>
                            )}
                            {storageUsedPercent >= 90 && (
                                <p className="text-blue-100 mt-1">
                                    You&apos;re using {storageUsedPercent}% of your trial storage.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Plans */}
                <div className="p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${selectedPlan === plan.id
                                    ? 'border-blue-600 shadow-lg scale-105'
                                    : 'border-gray-200 hover:border-blue-300'
                                    } ${plan.popular ? 'ring-2 ring-blue-600' : ''}`}
                                onClick={() => setSelectedPlan(plan.id)}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                                        <span className="text-gray-600">/month</span>
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => setSelectedPlan(plan.id)}
                                    disabled={loading}
                                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${selectedPlan === plan.id
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className={`inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <Zap className="w-5 h-5" />
                            )}
                            {loading ? 'Processing...' : `Upgrade to ${plans.find(p => p.id === selectedPlan)?.name} Plan`}
                        </button>
                        <p className="text-sm text-gray-600 mt-3">
                            30-day money-back guarantee • No credit card required to start
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
