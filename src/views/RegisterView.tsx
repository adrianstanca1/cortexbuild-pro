import React, { useState } from 'react';
import { HardHat, Check, Mail, Lock, Loader2, Building2, UserCircle, CheckCircle2, Cpu, Sparkles, Shield } from 'lucide-react';
import { Page } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { PhoneInput } from '@/components/PhoneInput';

interface RegisterViewProps {
    setPage: (page: Page) => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ setPage }) => {
    const { signup } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showSuccess, setShowSuccess] = useState(false);

    const validateEmail = (email: string): string | null => {
        if (!email) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Please enter a valid email address';

        // Check for common typos
        const commonTypos: Record<string, string> = {
            'gmail.con': 'gmail.com',
            'gmail.cm': 'gmail.com',
            'yahoo.con': 'yahoo.com',
            'outlook.con': 'outlook.com',
        };

        const domain = email.split('@')[1];
        if (domain && commonTypos[domain]) {
            return `Did you mean ${email.replace(domain, commonTypos[domain])}?`;
        }

        return null;
    };

    const validatePassword = (password: string): string | null => {
        if (!password) return 'Password is required';
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
        if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
        if (!/[0-9]/.test(password)) return 'Password must contain a number';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain a special character';
        return null;
    };

    const handleFieldBlur = (field: string, value: string) => {
        const errors = { ...fieldErrors };

        switch (field) {
            case 'email': {
                const emailError = validateEmail(value);
                if (emailError) errors.email = emailError;
                else delete errors.email;
                break;
            }
            case 'password': {
                const passwordError = validatePassword(value);
                if (passwordError) errors.password = passwordError;
                else delete errors.password;
                break;
            }
            case 'confirmPassword':
                if (value !== password) errors.confirmPassword = 'Passwords do not match';
                else delete errors.confirmPassword;
                break;
            case 'fullName':
                if (!value.trim()) errors.fullName = 'Full name is required';
                else delete errors.fullName;
                break;
            case 'companyName':
                if (!value.trim()) errors.companyName = 'Company name is required';
                else delete errors.companyName;
                break;
        }

        setFieldErrors(errors);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Validate all fields
        const errors: Record<string, string> = {};

        const emailError = validateEmail(email);
        if (emailError) errors.email = emailError;

        const passwordError = validatePassword(password);
        if (passwordError) errors.password = passwordError;

        if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (!fullName.trim()) errors.fullName = 'Full name is required';
        if (!companyName.trim()) errors.companyName = 'Company name is required';
        if (!acceptedTerms) errors.terms = 'You must accept the terms and conditions';

        if (passwordStrength < 80) {
            errors.password = 'Password is not strong enough';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setIsLoading(false);
            return;
        }

        try {
            const { user, error } = await signup(email, password, fullName, companyName);

            if (error) throw error;
            if (!user) throw new Error("Registration succeeded but no user returned");

            // Show success animation
            setShowSuccess(true);

            // Navigate after brief delay
            setTimeout(() => {
                setPage(Page.DASHBOARD);
            }, 1500);

        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = () => {
        return (
            email &&
            password &&
            confirmPassword &&
            password === confirmPassword &&
            fullName &&
            companyName &&
            acceptedTerms &&
            passwordStrength >= 80 &&
            Object.keys(fieldErrors).length === 0
        );
    };

    if (showSuccess) {
        return (
            <div className="flex h-screen w-full bg-slate-900 items-center justify-center">
                <div className="text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="bg-green-500/20 p-4 rounded-full border border-green-500/30">
                            <CheckCircle2 size={64} className="text-green-500 animate-bounce" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome to CortexBuild!</h2>
                    <p className="text-yellow-400 font-medium tracking-wide">Initializing your intelligent workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 overflow-hidden font-sans selection:bg-indigo-400/30">
            {/* Left Panel: Unified Brand Experience */}
            <div className="hidden lg:flex w-[45%] relative flex-col p-16 overflow-hidden border-r border-white/10">
                {/* Animated Background Layers */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070')] bg-cover bg-center opacity-5 scale-110 animate-pulse-slow" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-transparent" />

                <div className="relative z-10 h-full flex flex-col">
                    <div
                        className="flex items-center gap-3 mb-16 cursor-pointer hover:opacity-80 transition-opacity w-fit"
                        onClick={() => setPage(Page.CORTEX_BUILD_HOME)}
                    >
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-500 p-2.5 rounded-xl shadow-lg border border-white/20">
                            <Cpu size={28} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-tighter text-white">CORTEX<span className="text-indigo-400">BUILD</span></span>
                            <span className="text-[10px] font-bold tracking-[0.3em] text-indigo-400/80 uppercase -mt-1">Neural platform</span>
                        </div>
                    </div>

                    <h2 className="text-4xl xl:text-5xl font-black leading-tight mb-8 text-white tracking-tight animate-slide-up">
                        Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Autonomous</span> Construction Era.
                    </h2>

                    <p className="text-xl text-yellow-100/70 mb-12 leading-relaxed max-w-md font-light">
                        Deploy AI-native workflows and predict project outcomes in real-time.
                    </p>

                    <div className="space-y-6 mb-12">
                        <h3 className="text-xs font-black text-yellow-500/50 uppercase tracking-[0.2em] mb-4">Enterprise Features</h3>
                        {[
                            'Real-time Neural Risk Analysis',
                            'Automated Compliance Engine',
                            'Multi-Tenant Fleet Intelligence',
                            'Predictive Resource Allocation'
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-4 text-white group">
                                <div className="bg-yellow-500/20 p-1.5 rounded-lg text-yellow-400 border border-yellow-500/30">
                                    <Sparkles size={14} />
                                </div>
                                <span className="font-bold text-sm tracking-wide text-yellow-100/80">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest">
                            <Shield size={12} className="text-emerald-500" /> SOC2 COMPLIANT
                        </div>
                        <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest">© 2025 CortexBuild Pro</div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Form Area */}
            <div className="flex-1 flex flex-col justify-center p-8 lg:p-20 overflow-y-auto bg-slate-900/50 backdrop-blur-3xl relative">
                <div className="max-w-md w-full mx-auto relative z-10">
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Access Token</h1>
                        <p className="text-yellow-400/80 font-medium italic">Create your credentials for secure deployment.</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm p-1 rounded-3xl border border-white/10 shadow-2xl mb-8">
                        <div className="bg-slate-800/20 p-8 rounded-[22px]">
                            <form onSubmit={handleRegister} className="space-y-5">
                                {/* Name & Company Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-yellow-400 transition-colors">Identity</label>
                                        <div className="relative">
                                            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                onBlur={e => handleFieldBlur('fullName', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-yellow-400 transition-colors">Organization</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Company"
                                                value={companyName}
                                                onChange={e => setCompanyName(e.target.value)}
                                                onBlur={e => handleFieldBlur('companyName', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="group">
                                    <label className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-yellow-400 transition-colors">Communication Path</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-400" size={18} />
                                        <input
                                            type="email"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            onBlur={e => handleFieldBlur('email', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="group">
                                    <label className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-yellow-400 transition-colors">Direct Terminal (optional)</label>
                                    <PhoneInput
                                        value={phoneNumber}
                                        onChange={setPhoneNumber}
                                        className="bg-slate-800/30 text-white border-white/10"
                                    />
                                </div>

                                {/* Password */}
                                <div className="group">
                                    <label className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-yellow-400 transition-colors">Encryption Key</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-400" size={18} />
                                        <input
                                            type="password"
                                            placeholder="Choose strong password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            onBlur={e => handleFieldBlur('password', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    {password && (
                                        <div className="mt-3">
                                            <PasswordStrengthIndicator
                                                password={password}
                                                onStrengthChange={setPasswordStrength}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="group">
                                    <label className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest ml-1 mb-2 block group-focus-within:text-yellow-400 transition-colors">Verify Key</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-400" size={18} />
                                        <input
                                            type="password"
                                            placeholder="Repeat password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            onBlur={e => handleFieldBlur('confirmPassword', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Terms */}
                                <div>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={e => setAcceptedTerms(e.target.checked)}
                                            className="w-4 h-4 mt-0.5 flex-shrink-0 bg-slate-800/50 border-white/10 rounded text-yellow-500 focus:ring-2 focus:ring-yellow-500/20 cursor-pointer"
                                            required
                                        />
                                        <span className="text-xs text-yellow-100/40 leading-relaxed">
                                            Accept the <a href="#" className="text-yellow-400 hover:underline">Neural Terms</a> and <a href="#" className="text-yellow-400 hover:underline">Privacy Logic</a>
                                        </span>
                                    </label>
                                </div>

                                {/* Registry Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading || !isFormValid()}
                                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${isLoading || !isFormValid()
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-yellow-500 text-slate-900 hover:bg-yellow-400 shadow-xl shadow-yellow-500/20'
                                        }`}
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Join the Network'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-yellow-100/20 mb-6">
                            Existing node in network?{' '}
                            <button
                                onClick={() => setPage(Page.LOGIN)}
                                className="text-yellow-500 font-black hover:text-yellow-400 transition-colors"
                            >
                                Authorize Access
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterView;
