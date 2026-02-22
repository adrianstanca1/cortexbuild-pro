import React from 'react';
import { Page } from '@/types';
import { PublicLayout } from '@/components/layout/public/PublicLayout';
import { BentoCard } from '@/components/BentoCard';
import {
    Briefcase,
    Building2,
    Target,
    TrendingUp,
    ArrowRight,
    ShieldCheck,
    Users2,
    Globe,
    Zap
} from 'lucide-react';

const SolutionsView: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
    return (
        <PublicLayout currentPage={Page.SOLUTIONS} setPage={setPage}>
            {/* --- HERO --- */}
            <section className="pt-40 pb-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <h1 className="text-6xl lg:text-8xl font-black text-gray-900 tracking-tight leading-[1.05] mb-10">
                            Tailored for <br />
                            <span className="text-indigo-600">Growth.</span>
                        </h1>
                        <p className="text-xl lg:text-2xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                            Whether you&apos;re a growing local builder or a global enterprise, CortexBuild Pro provides the tools you need to scale with precision.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* SMB Solution */}
                        <BentoCard
                            title="For SMBs"
                            description="Accelerate your projects and eliminate manual admin. Get enterprise-level tools without the enterprise complexity."
                            icon={TrendingUp}
                            className="p-16"
                        >
                            <div className="space-y-4 mb-12">
                                {['Automated Daily Logs', 'Project Scheduling', 'Cost Tracking', 'Team Collaboration'].map((item) => (
                                    <div key={item} className="flex items-center gap-3 font-bold text-gray-900">
                                        <ShieldCheck size={20} className="text-green-500" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setPage(Page.GET_STARTED)}
                                className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-3 w-full"
                            >
                                Start SMB Trial <ArrowRight size={20} />
                            </button>
                        </BentoCard>

                        {/* Enterprise Solution */}
                        <BentoCard
                            title="For Enterprise"
                            description="Full-scale intelligence across global portfolios. Advanced analytics, deep integrations, and dedicated support."
                            icon={Zap}
                            variant="dark"
                            className="p-16"
                        >
                            <div className="space-y-4 mb-12 text-gray-300">
                                {['Portfolio Analytics', 'Global Compliance', 'SSO & Multi-tenancy', 'Dedicated Node Deployment'].map((item) => (
                                    <div key={item} className="flex items-center gap-3 font-bold">
                                        <ShieldCheck size={20} className="text-indigo-400" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setPage(Page.GET_STARTED)}
                                className="bg-white text-gray-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-400 transition-all flex items-center justify-center gap-3 w-full"
                            >
                                Contact Sales <ArrowRight size={20} />
                            </button>
                        </BentoCard>
                    </div>
                </div>
            </section>

            {/* --- TRUST SECTION --- */}
            <section className="py-32 bg-gray-50">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white mx-auto mb-12 shadow-2xl">
                        <Target size={40} />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-8 uppercase tracking-tight">Our Commitment</h2>
                    <p className="text-2xl text-gray-500 font-medium leading-relaxed italic">
                        &quot;We don&apos;t just build software; we build the infrastructure for the next generation of physical world development.&quot;
                    </p>
                    <div className="mt-12 flex items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-lg flex items-center justify-center text-gray-500">
                            <Users2 size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-black text-gray-900 leading-tight">CortexBuild Pro</div>
                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Leadership Team</div>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default SolutionsView;
