
import React from 'react';
import { Rocket, UserPlus, Video, MessageSquare, Play, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import { Page } from '@/types';

interface GetStartedViewProps {
    setPage: (page: Page) => void;
}

const GetStartedView: React.FC<GetStartedViewProps> = ({ setPage }) => {
    return (
        <div className="min-h-screen bg-[#000814] text-white font-['Poppins'] selection:bg-cyan-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setPage(Page.CORTEX_BUILD_HOME)}>
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                            <Rocket size={22} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">CortexBuild</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <button onClick={() => setPage(Page.CORTEX_BUILD_HOME)} className="text-sm font-medium text-white/70 hover:text-cyan-400 transition-colors">Home</button>
                        <button onClick={() => setPage(Page.NEURAL_NETWORK)} className="text-sm font-medium text-white/70 hover:text-cyan-400 transition-colors">The Neural Network</button>
                        <button onClick={() => setPage(Page.PLATFORM_FEATURES)} className="text-sm font-medium text-white/70 hover:text-cyan-400 transition-colors">Platform Features</button>
                        <button onClick={() => setPage(Page.CONNECTIVITY)} className="text-sm font-medium text-white/70 hover:text-cyan-400 transition-colors">Connectivity</button>
                        <button onClick={() => setPage(Page.DEVELOPER_PLATFORM)} className="text-sm font-medium text-white/70 hover:text-cyan-400 transition-colors">Developer Platform</button>
                        <button className="text-sm font-semibold text-cyan-400">Get Started</button>
                    </div>

                    <button
                        onClick={() => setPage(Page.PUBLIC_LOGIN)}
                        className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                    >
                        Login
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse-slow" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="animate-fade-in">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-8">
                                Get Started
                            </span>
                            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
                                Experience the <br />
                                <span className="text-cyan-400">Future</span> of Construction
                            </h1>
                            <p className="text-xl text-white/60 leading-relaxed mb-10 max-w-xl">
                                Ready to transform your business? Join CortexBuild today—no commitment required. Explore our platform, meet our team, and see how AI can supercharge your projects.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => setPage(Page.PUBLIC_LOGIN)}
                                    className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-xl shadow-cyan-500/20"
                                >
                                    Create Account <ArrowRight size={20} />
                                </button>
                                <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                                    Contact Sales
                                </button>
                            </div>
                        </div>

                        <div className="relative lg:h-[600px] flex items-center justify-center animate-float">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-3xl" />
                            <div className="w-64 h-64 lg:w-96 lg:h-96 glass-panel rounded-full flex items-center justify-center border-white/10 shadow-2xl relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full animate-pulse-slow" />
                                <Rocket size={120} className="text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]" />
                            </div>

                            {/* Decorative floating elements */}
                            <div className="absolute top-10 right-10 w-16 h-16 glass-card rounded-2xl flex items-center justify-center animate-float">
                                <Zap size={24} className="text-yellow-400" />
                            </div>
                            <div className="absolute bottom-20 left-10 w-20 h-20 glass-card rounded-2xl flex items-center justify-center animate-float">
                                <ShieldCheck size={32} className="text-emerald-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="py-24 px-6 relative bg-white/[0.02]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 animate-fade-in">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6">Start Your Journey</h2>
                        <p className="text-xl text-white/50 max-w-2xl mx-auto">
                            Follow these simple steps to unlock the power of CortexBuild.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: UserPlus,
                                title: 'Create Your Account',
                                desc: 'Sign up for a free trial in just a few clicks. No credit card required.',
                                color: 'from-cyan-400 to-blue-500'
                            },
                            {
                                icon: Video,
                                title: 'Watch a Demo',
                                desc: 'See CortexBuild in action with a guided demo tailored to your needs.',
                                color: 'from-purple-500 to-pink-500'
                            },
                            {
                                icon: MessageSquare,
                                title: 'Talk to Us',
                                desc: 'Schedule a call with our experts to discuss your challenges and learn how we can help.',
                                color: 'from-blue-500 to-indigo-600'
                            },
                            {
                                icon: Play,
                                title: 'Get Building',
                                desc: 'Start using the platform immediately. Import your data, explore features, and transform your projects.',
                                color: 'from-emerald-400 to-cyan-500'
                            }
                        ].map((step, idx) => (
                            <div
                                key={idx}
                                className="glass-card group p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-all hover:-translate-y-2 animate-fade-in"
                            >
                                <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                                    <step.icon size={28} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-4 group-hover:text-cyan-400 transition-colors">{step.title}</h3>
                                <p className="text-white/50 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 overflow-hidden relative">
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-cyan-500/10 to-transparent pointer-events-none" />

                <div className="max-w-5xl mx-auto">
                    <div className="glass-panel p-12 lg:p-20 rounded-[4rem] border border-white/10 relative overflow-hidden text-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />

                        <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-8">
                            JOIN US
                        </span>
                        <h2 className="text-4xl lg:text-6xl font-bold mb-8">Ready to Get Started?</h2>
                        <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
                            Sign up now to begin your free trial or reach out to our team for a personalised walkthrough of the platform.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => setPage(Page.PUBLIC_LOGIN)}
                                className="w-full sm:w-auto px-10 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-cyan-500/20"
                            >
                                Create Account
                            </button>
                            <button className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95">
                                Contact Sales
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 bg-black/40 text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Rocket size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">CortexBuild</span>
                </div>
                <p className="text-white/40 text-sm">
                    &copy; 2025 CortexBuild Pro. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default GetStartedView;
