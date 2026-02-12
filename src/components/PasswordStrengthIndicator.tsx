import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
    password: string;
    onStrengthChange?: (score: number) => void;
}

interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const calculateStrength = (password: string): number => {
    if (!password) return 0;

    let score = 0;
    requirements.forEach((req) => {
        if (req.test(password)) score++;
    });

    return (score / requirements.length) * 100;
};

const getStrengthLabel = (score: number): { text: string; color: string } => {
    if (score < 40) return { text: 'Weak', color: 'text-red-600' };
    if (score < 80) return { text: 'Medium', color: 'text-yellow-600' };
    return { text: 'Strong', color: 'text-green-600' };
};

const getBarColor = (score: number): string => {
    if (score < 40) return 'bg-red-500';
    if (score < 80) return 'bg-yellow-500';
    return 'bg-green-500';
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
    password,
    onStrengthChange,
}) => {
    const strength = calculateStrength(password);
    const { text, color } = getStrengthLabel(strength);
    const barColor = getBarColor(strength);

    React.useEffect(() => {
        onStrengthChange?.(strength);
    }, [strength, onStrengthChange]);

    if (!password) return null;

    return (
        <div className="space-y-3">
            {/* Strength Bar */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600">Password Strength</span>
                    <span className={`text-xs font-bold ${color}`}>{text}</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${strength}%` }}
                    />
                </div>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-1.5">
                {requirements.map((req, index) => {
                    const isMet = req.test(password);
                    return (
                        <div
                            key={index}
                            className={`flex items-center gap-2 text-xs transition-colors ${isMet ? 'text-green-600' : 'text-zinc-400'
                                }`}
                        >
                            {isMet ? (
                                <Check size={14} strokeWidth={3} className="flex-shrink-0" />
                            ) : (
                                <X size={14} strokeWidth={2} className="flex-shrink-0" />
                            )}
                            <span>{req.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PasswordStrengthIndicator;
