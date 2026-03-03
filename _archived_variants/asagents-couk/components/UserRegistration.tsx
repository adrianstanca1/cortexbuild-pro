import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { CompanyType, RegistrationPayload, Role } from '../types';
import { AuthEnvironmentNotice } from './auth/AuthEnvironmentNotice';

interface UserRegistrationProps {
  onSwitchToLogin: () => void;
}

interface RegistrationState {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    companySelection: 'create' | 'join' | '';
    companyName: string;
    companyType: CompanyType | '';
    companyEmail: string;
    companyPhone: string;
    companyWebsite: string;
    inviteToken: string;
    role: Role | '';
    updatesOptIn: boolean;
    termsAccepted: boolean;
}

const INITIAL_STATE: RegistrationState = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companySelection: '',
    companyName: '',
    companyType: '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    inviteToken: '',
    role: '',
    updatesOptIn: true,
    termsAccepted: false,
};

type FormErrors = Partial<Record<keyof RegistrationState, string>>;
type Step = 'account' | 'workspace' | 'confirm';

const PasswordStrengthIndicator: React.FC<{ password?: string }> = ({ password = '' }) => {
    const getStrength = () => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };
    
    const strength = getStrength();
    
    let color = 'bg-destructive';
    if (strength >= 5) color = 'bg-green-500';
    else if (strength >= 3) color = 'bg-yellow-500';
    
    let widthClass = 'w-0';
    if (strength === 1) widthClass = 'w-1/5';
    else if (strength === 2) widthClass = 'w-2/5';
    else if (strength === 3) widthClass = 'w-3/5';
    else if (strength === 4) widthClass = 'w-4/5';
    else if (strength === 5) widthClass = 'w-full';

    return (
        <div className="w-full bg-muted rounded-full h-1.5 mt-1">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${color} ${widthClass}`}></div>
        </div>
    );
};

const QuickOptionButton: React.FC<{
    title: string;
    description: string;
    onClick: () => void;
    className?: string;
}> = ({ title, description, onClick, className = '' }) => (
    <button
        onClick={onClick}
        className={`p-4 text-left border border-border rounded-lg hover:border-primary transition-colors ${className}`}
    >
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </button>
);

export const UserRegistration: React.FC<UserRegistrationProps> = ({ onSwitchToLogin }) => {
    const { register, error: authError, loading: isSubmitting } = useAuth();

    const [step, setStep] = useState<Step>('account');
    const [form, setForm] = useState<RegistrationState>(INITIAL_STATE);
    const [errors, setErrors] = useState<FormErrors>({});
    const [generalError, setGeneralError] = useState<string | null>(null);

    useEffect(() => {
        setGeneralError(authError);
    }, [authError]);

    const updateField = <K extends keyof RegistrationState>(field: K, value: RegistrationState[K]) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
        setGeneralError(null);
    };

    const validateStep = (): boolean => {
        const newErrors: FormErrors = {};

        switch (step) {
            case 'account':
                if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
                if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
                if (!form.email.trim()) newErrors.email = 'Email is required';
                else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Please enter a valid email';
                
                if (!form.password) newErrors.password = 'Password is required';
                else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
                
                if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
                else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
                break;

            case 'workspace':
                if (!form.companySelection) newErrors.companySelection = 'Please select an option';
                
                if (form.companySelection === 'create') {
                    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required';
                    if (!form.companyType) newErrors.companyType = 'Company type is required';
                    if (!form.companyEmail.trim()) newErrors.companyEmail = 'Company email is required';
                    else if (!/\S+@\S+\.\S+/.test(form.companyEmail)) newErrors.companyEmail = 'Please enter a valid email';
                }
                
                if (form.companySelection === 'join') {
                    if (!form.inviteToken.trim()) newErrors.inviteToken = 'Invite token is required';
                }
                break;

            case 'confirm':
                if (!form.role) newErrors.role = 'Please select your role';
                if (!form.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions';
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            const stepOrder: Step[] = ['account', 'workspace', 'confirm'];
            const currentIndex = stepOrder.indexOf(step);
            if (currentIndex < stepOrder.length - 1) {
                setStep(stepOrder[currentIndex + 1]);
            }
        }
    };

    const handleBack = () => {
        const stepOrder: Step[] = ['account', 'workspace', 'confirm'];
        const currentIndex = stepOrder.indexOf(step);
        if (currentIndex > 0) {
            setStep(stepOrder[currentIndex - 1]);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        const payload: RegistrationPayload = {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
            phone: form.phone,
            companySelection: form.companySelection as 'create' | 'join',
            inviteToken: form.companySelection === 'join' ? form.inviteToken : undefined,
            companyName: form.companySelection === 'create' ? form.companyName : undefined,
            companyType: form.companySelection === 'create' ? form.companyType as CompanyType : undefined,
            companyEmail: form.companySelection === 'create' ? form.companyEmail : undefined,
            companyPhone: form.companySelection === 'create' ? form.companyPhone : undefined,
            companyWebsite: form.companySelection === 'create' ? form.companyWebsite : undefined,
            role: form.role as Role,
            updatesOptIn: form.updatesOptIn,
            termsAccepted: form.termsAccepted,
        };

        try {
            await register(payload);
        } catch (error) {
            console.error('Registration failed:', error);
        }
    };

    const renderAccountStep = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-center mb-2">Create Account</h2>
                <p className="text-muted-foreground text-center">Let's get started with your basic information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name *</label>
                    <input
                        id="firstName"
                        type="text"
                        value={form.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        className={`w-full p-3 border rounded-md ${errors.firstName ? 'border-destructive' : 'border-border'}`}
                        placeholder="John"
                    />
                    {errors.firstName && <p className="text-destructive text-sm mt-1">{errors.firstName}</p>}
                </div>

                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name *</label>
                    <input
                        id="lastName"
                        type="text"
                        value={form.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        className={`w-full p-3 border rounded-md ${errors.lastName ? 'border-destructive' : 'border-border'}`}
                        placeholder="Smith"
                    />
                    {errors.lastName && <p className="text-destructive text-sm mt-1">{errors.lastName}</p>}
                </div>
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address *</label>
                <div className="relative">
                    <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className={`w-full p-3 border rounded-md pr-10 ${errors.email ? 'border-destructive' : 'border-border'}`}
                        placeholder="john@company.com"
                    />
                </div>
                {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone (optional)</label>
                <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full p-3 border border-border rounded-md"
                    placeholder="(555) 123-4567"
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">Password *</label>
                <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className={`w-full p-3 border rounded-md ${errors.password ? 'border-destructive' : 'border-border'}`}
                    placeholder="Create a strong password"
                />
                <PasswordStrengthIndicator password={form.password} />
                {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm Password *</label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className={`w-full p-3 border rounded-md ${errors.confirmPassword ? 'border-destructive' : 'border-border'}`}
                    placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
        </div>
    );

    const renderWorkspaceStep = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-center mb-2">Workspace Setup</h2>
                <p className="text-muted-foreground text-center">How would you like to set up your workspace?</p>
            </div>

            <div className="space-y-4">
                <QuickOptionButton
                    title="Create New Company"
                    description="I'm setting up a new company account"
                    onClick={() => updateField('companySelection', 'create')}
                    className={form.companySelection === 'create' ? 'border-primary bg-primary/5' : ''}
                />

                <QuickOptionButton
                    title="Join Existing Company"
                    description="I have an invitation to join a company"
                    onClick={() => updateField('companySelection', 'join')}
                    className={form.companySelection === 'join' ? 'border-primary bg-primary/5' : ''}
                />
            </div>

            {errors.companySelection && <p className="text-destructive text-sm">{errors.companySelection}</p>}

            {form.companySelection === 'create' && (
                <div className="mt-6 space-y-4 p-4 border border-border rounded-lg">
                    <h3 className="font-semibold">Company Information</h3>
                    
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium mb-1">Company Name *</label>
                        <input
                            id="companyName"
                            type="text"
                            value={form.companyName}
                            onChange={(e) => updateField('companyName', e.target.value)}
                            className={`w-full p-3 border rounded-md ${errors.companyName ? 'border-destructive' : 'border-border'}`}
                            placeholder="ABC Construction"
                        />
                        {errors.companyName && <p className="text-destructive text-sm mt-1">{errors.companyName}</p>}
                    </div>

                    <div>
                        <label htmlFor="companyType" className="block text-sm font-medium mb-1">Company Type *</label>
                        <select
                            id="companyType"
                            aria-label="Company Type"
                            value={form.companyType}
                            onChange={(e) => updateField('companyType', e.target.value as CompanyType)}
                            className={`w-full p-3 border rounded-md ${errors.companyType ? 'border-destructive' : 'border-border'}`}
                        >
                            <option value="">Select company type</option>
                            <option value="GENERAL_CONTRACTOR">General Contractor</option>
                            <option value="SUBCONTRACTOR">Subcontractor</option>
                            <option value="SUPPLIER">Supplier</option>
                            <option value="CONSULTANT">Consultant</option>
                            <option value="CLIENT">Client</option>
                        </select>
                        {errors.companyType && <p className="text-destructive text-sm mt-1">{errors.companyType}</p>}
                    </div>

                    <div>
                        <label htmlFor="companyEmail" className="block text-sm font-medium mb-1">Company Email *</label>
                        <input
                            id="companyEmail"
                            type="email"
                            value={form.companyEmail}
                            onChange={(e) => updateField('companyEmail', e.target.value)}
                            className={`w-full p-3 border rounded-md ${errors.companyEmail ? 'border-destructive' : 'border-border'}`}
                            placeholder="contact@company.com"
                        />
                        {errors.companyEmail && <p className="text-destructive text-sm mt-1">{errors.companyEmail}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="companyPhone" className="block text-sm font-medium mb-1">Phone</label>
                            <input
                                id="companyPhone"
                                type="tel"
                                value={form.companyPhone}
                                onChange={(e) => updateField('companyPhone', e.target.value)}
                                className="w-full p-3 border border-border rounded-md"
                                placeholder="(555) 123-4567"
                            />
                        </div>

                        <div>
                            <label htmlFor="companyWebsite" className="block text-sm font-medium mb-1">Website</label>
                            <input
                                id="companyWebsite"
                                type="url"
                                value={form.companyWebsite}
                                onChange={(e) => updateField('companyWebsite', e.target.value)}
                                className="w-full p-3 border border-border rounded-md"
                                placeholder="https://www.company.com"
                            />
                        </div>
                    </div>
                </div>
            )}

            {form.companySelection === 'join' && (
                <div className="mt-6 space-y-4 p-4 border border-border rounded-lg">
                    <h3 className="font-semibold">Company Invitation</h3>
                    
                    <div>
                        <label htmlFor="inviteToken" className="block text-sm font-medium mb-1">Invite Token *</label>
                        <input
                            id="inviteToken"
                            type="text"
                            value={form.inviteToken}
                            onChange={(e) => updateField('inviteToken', e.target.value)}
                            className={`w-full p-3 border rounded-md ${errors.inviteToken ? 'border-destructive' : 'border-border'}`}
                            placeholder="Enter your invitation token"
                        />
                        {errors.inviteToken && <p className="text-destructive text-sm mt-1">{errors.inviteToken}</p>}
                    </div>
                </div>
            )}
        </div>
    );

    const renderConfirmStep = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-center mb-2">Select Your Role</h2>
                <p className="text-muted-foreground text-center">What's your primary role in construction projects?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickOptionButton
                    title="Project Manager"
                    description="Oversee projects, manage teams, track progress"
                    onClick={() => updateField('role', Role.PROJECT_MANAGER)}
                    className={form.role === Role.PROJECT_MANAGER ? 'border-primary bg-primary/5' : ''}
                />

                <QuickOptionButton
                    title="Foreman"
                    description="Lead on-site operations and crews"
                    onClick={() => updateField('role', Role.FOREMAN)}
                    className={form.role === Role.FOREMAN ? 'border-primary bg-primary/5' : ''}
                />

                <QuickOptionButton
                    title="Operative"
                    description="Skilled tradesperson or worker"
                    onClick={() => updateField('role', Role.OPERATIVE)}
                    className={form.role === Role.OPERATIVE ? 'border-primary bg-primary/5' : ''}
                />

                <QuickOptionButton
                    title="Owner/Executive"
                    description="Company owner or executive"
                    onClick={() => updateField('role', Role.OWNER)}
                    className={form.role === Role.OWNER ? 'border-primary bg-primary/5' : ''}
                />

                <QuickOptionButton
                    title="Client"
                    description="Project client or stakeholder"
                    onClick={() => updateField('role', Role.CLIENT)}
                    className={form.role === Role.CLIENT ? 'border-primary bg-primary/5' : ''}
                />

                <QuickOptionButton
                    title="Administrator"
                    description="System administrator"
                    onClick={() => updateField('role', Role.ADMIN)}
                    className={form.role === Role.ADMIN ? 'border-primary bg-primary/5' : ''}
                />
            </div>

            {errors.role && <p className="text-destructive text-sm text-center">{errors.role}</p>}

            <div className="space-y-4 mt-8">
                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={form.updatesOptIn}
                        onChange={(e) => updateField('updatesOptIn', e.target.checked)}
                        className="mt-1"
                    />
                    <span className="text-sm">Send me product updates and construction industry insights</span>
                </label>

                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={(e) => updateField('termsAccepted', e.target.checked)}
                        className="mt-1"
                    />
                    <span className="text-sm">
                        I accept the{' '}
                        <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                        {' '}*
                    </span>
                </label>
                {errors.termsAccepted && <p className="text-destructive text-sm">{errors.termsAccepted}</p>}
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (step) {
            case 'account':
                return renderAccountStep();
            case 'workspace':
                return renderWorkspaceStep();
            case 'confirm':
                return renderConfirmStep();
            default:
                return null;
        }
    };

    const stepOrder: Step[] = ['account', 'workspace', 'confirm'];
    const currentStepIndex = stepOrder.indexOf(step);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === stepOrder.length - 1;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <Card className="p-8">
                    <AuthEnvironmentNotice />

                    {/* Progress indicator */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center">
                            {stepOrder.map((stepKey, index) => (
                                <div
                                    key={stepKey}
                                    className={`flex items-center ${index < stepOrder.length - 1 ? 'flex-1' : ''}`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                            index <= currentStepIndex
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {index + 1}
                                    </div>
                                    {index < stepOrder.length - 1 && (
                                        <div
                                            className={`h-0.5 flex-1 mx-2 ${
                                                index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                                            }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>Account</span>
                            <span>Workspace</span>
                            <span>Confirm</span>
                        </div>
                    </div>

                    {generalError && (
                        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-destructive text-sm">{generalError}</p>
                        </div>
                    )}

                    {renderCurrentStep()}

                    <div className="flex justify-between mt-8">
                        <Button
                            variant="outline"
                            onClick={isFirstStep ? onSwitchToLogin : handleBack}
                        >
                            {isFirstStep ? 'Back to Login' : 'Back'}
                        </Button>

                        <Button
                            onClick={isLastStep ? handleSubmit : handleNext}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                        >
                            {isLastStep ? 'Create Account' : 'Next'}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};