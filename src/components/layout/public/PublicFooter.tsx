import React from 'react';
import { Page } from '@/types';
import { BrainCircuit, Twitter, Linkedin, Github, Mail } from 'lucide-react';

interface PublicFooterProps {
    setPage: (page: Page) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ setPage }) => {
    const footerLinks = {
        Product: [
            { label: 'Intelligence', page: Page.NEURAL_NETWORK },
            { label: 'Features', page: Page.PLATFORM_FEATURES },
            { label: 'Integrations', page: Page.CONNECTIVITY },
            { label: 'Marketplace', page: Page.PLATFORM_FEATURES },
        ],
        Company: [
            { label: 'About Us', page: Page.CORTEX_BUILD_HOME },
            { label: 'Developers', page: Page.DEVELOPER_PLATFORM },
            { label: 'Privacy Policy', page: Page.LOGIN },
            { label: 'Terms of Service', page: Page.LOGIN },
        ],
        Resources: [
            { label: 'Documentation', page: Page.DEVELOPER_PLATFORM },
            { label: 'API Reference', page: Page.DEVELOPER_PLATFORM },
            { label: 'Support Center', page: Page.GET_STARTED },
            { label: 'System Status', page: Page.CONNECTIVITY },
        ]
    };

    return (
        <footer className="bg-white border-t border-gray-100 pt-24 pb-12 relative z-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="lg:col-span-2 md:col-span-3">
                        <div
                            className="flex items-center gap-3 mb-8 cursor-pointer group"
                            onClick={() => {
                                setPage(Page.CORTEX_BUILD_HOME);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300">
                                <BrainCircuit size={24} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-gray-900 text-2xl tracking-tight">Cortex<span className="text-indigo-600">Build</span></span>
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] leading-none">Intelligence Platform</span>
                            </div>
                        </div>
                        <p className="text-gray-600 text-base font-medium leading-relaxed max-w-md mb-8">
                            Transforming construction through AI-powered intelligence, real-time collaboration, and seamless integration. Build smarter, faster, and more efficiently.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { Icon: Twitter, label: 'Twitter' },
                                { Icon: Linkedin, label: 'LinkedIn' },
                                { Icon: Github, label: 'GitHub' },
                                { Icon: Mail, label: 'Email' }
                            ].map(({ Icon, label }, i) => (
                                <button
                                    key={i}
                                    aria-label={label}
                                    title={label}
                                    className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-sans"
                                >
                                    <Icon size={20} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns - Product */}
                    <div>
                        <h4 className="text-gray-900 font-black text-xs uppercase tracking-[0.2em] mb-8">Product</h4>
                        <ul className="flex flex-col gap-4">
                            {footerLinks.Product.map((link) => (
                                <li key={link.label}>
                                    <button
                                        onClick={() => {
                                            setPage(link.page);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="text-gray-500 hover:text-indigo-600 font-bold text-sm transition-colors text-left"
                                    >
                                        {link.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Link Columns - Company */}
                    <div>
                        <h4 className="text-gray-900 font-black text-xs uppercase tracking-[0.2em] mb-8">Company</h4>
                        <ul className="flex flex-col gap-4">
                            {footerLinks.Company.map((link) => (
                                <li key={link.label}>
                                    <button
                                        onClick={() => {
                                            setPage(link.page);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="text-gray-500 hover:text-indigo-600 font-bold text-sm transition-colors text-left"
                                    >
                                        {link.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Link Columns - Resources */}
                    <div>
                        <h4 className="text-gray-900 font-black text-xs uppercase tracking-[0.2em] mb-8">Resources</h4>
                        <ul className="flex flex-col gap-4">
                            {footerLinks.Resources.map((link) => (
                                <li key={link.label}>
                                    <button
                                        onClick={() => {
                                            setPage(link.page);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="text-gray-500 hover:text-indigo-600 font-bold text-sm transition-colors text-left"
                                    >
                                        {link.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em]">
                        © 2025 CortexBuild Pro • Designed by AI Global Network
                    </div>
                    <div className="flex gap-8 text-xs font-black text-gray-400 uppercase tracking-widest">
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors">Security</span>
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors">Compliance</span>
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors">Cookies</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
