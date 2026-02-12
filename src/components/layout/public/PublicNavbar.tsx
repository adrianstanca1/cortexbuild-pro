import React, { useState, useEffect } from 'react';
import { Page } from '@/types';
import {
    Menu, X, ChevronDown, ArrowRight, Cpu,
    BrainCircuit, LayoutGrid, Zap, Code2,
    Building2, HardHat, Users, BookOpen,
    FileText, MessageSquare, LogIn
} from 'lucide-react';

interface PublicNavbarProps {
    currentPage: Page;
    setPage: (page: Page) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ currentPage, setPage }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = () => setActiveDropdown(null);
        if (activeDropdown) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [activeDropdown]);

    const toggleDropdown = (dropdown: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
    };

    const productsMenu = [
        { label: 'Neural Network AI', page: Page.NEURAL_NETWORK, icon: BrainCircuit, desc: 'AI-powered intelligence' },
        { label: 'Platform Features', page: Page.PLATFORM_FEATURES, icon: LayoutGrid, desc: 'Complete feature set' },
        { label: 'Connectivity Hub', page: Page.CONNECTIVITY, icon: Zap, desc: 'Seamless integrations' },
        { label: 'Developer Platform', page: Page.DEVELOPER_PLATFORM, icon: Code2, desc: 'APIs and SDKs' },
    ];

    const solutionsMenu = [
        { label: 'For Enterprise', icon: Building2, desc: 'Large-scale operations' },
        { label: 'For Contractors', icon: HardHat, desc: 'Field teams' },
        { label: 'For Developers', icon: Code2, desc: 'Custom integrations' },
    ];

    const resourcesMenu = [
        { label: 'Documentation', icon: BookOpen, desc: 'Guides and tutorials' },
        { label: 'API Reference', icon: FileText, desc: 'Complete API docs' },
        { label: 'Support', icon: MessageSquare, desc: '24/7 assistance' },
    ];

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? 'py-3' : 'py-6'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className={`
            flex items-center justify-between px-4 sm:px-6 py-3 rounded-2xl transition-all duration-300
            ${isScrolled
                            ? 'bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-lg'
                            : 'bg-white/70 backdrop-blur-md border border-white/20 shadow-sm'}
          `}>
                        {/* Logo */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => {
                                setPage(Page.CORTEX_BUILD_HOME);
                                setIsMobileMenuOpen(false);
                            }}
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110">
                                <Cpu size={18} strokeWidth={2.5} />
                            </div>
                            <div className="hidden sm:block">
                                <span className="font-black text-base tracking-tight text-gray-900">CORTEXBUILD</span>
                                <span className="block text-[9px] font-bold text-indigo-600 uppercase tracking-[0.2em] -mt-1">Pro</span>
                            </div>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden lg:flex items-center gap-1">
                            {/* Products Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={(e) => toggleDropdown('products', e)}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${activeDropdown === 'products'
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Products <ChevronDown size={16} className={`transition-transform ${activeDropdown === 'products' ? 'rotate-180' : ''}`} />
                                </button>

                                {activeDropdown === 'products' && (
                                    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-fade-in">
                                        {productsMenu.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    if (item.page) setPage(item.page);
                                                    setActiveDropdown(null);
                                                }}
                                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-indigo-50 cursor-pointer transition-all group"
                                            >
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <item.icon size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm text-gray-900">{item.label}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Solutions Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={(e) => toggleDropdown('solutions', e)}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${activeDropdown === 'solutions'
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Solutions <ChevronDown size={16} className={`transition-transform ${activeDropdown === 'solutions' ? 'rotate-180' : ''}`} />
                                </button>

                                {activeDropdown === 'solutions' && (
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-fade-in">
                                        {solutionsMenu.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-indigo-50 cursor-pointer transition-all group"
                                            >
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <item.icon size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm text-gray-900">{item.label}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Resources Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={(e) => toggleDropdown('resources', e)}
                                    className={`flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${activeDropdown === 'resources'
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Resources <ChevronDown size={16} className={`transition-transform ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
                                </button>

                                {activeDropdown === 'resources' && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 animate-fade-in">
                                        {resourcesMenu.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-indigo-50 cursor-pointer transition-all group"
                                            >
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <item.icon size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm text-gray-900">{item.label}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pricing */}
                            <button
                                onClick={() => setPage(Page.PLATFORM_PLANS)}
                                className="px-4 py-2 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                Pricing
                            </button>
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden lg:flex items-center gap-3">
                            <button
                                onClick={() => setPage(Page.LOGIN)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                <LogIn size={16} /> Login
                            </button>
                            <button
                                onClick={() => setPage(Page.GET_STARTED)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
                            >
                                Get Started <ArrowRight size={16} />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[99] lg:hidden">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 max-h-[calc(100vh-6rem)] overflow-y-auto animate-fade-in">
                        {/* Products Section */}
                        <div className="mb-4">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Products</div>
                            {productsMenu.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        if (item.page) setPage(item.page);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 cursor-pointer transition-all mb-1"
                                >
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                        <item.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-gray-900">{item.label}</div>
                                        <div className="text-xs text-gray-500">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Solutions Section */}
                        <div className="mb-4">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Solutions</div>
                            {solutionsMenu.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 cursor-pointer transition-all mb-1"
                                >
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                        <item.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-gray-900">{item.label}</div>
                                        <div className="text-xs text-gray-500">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Resources Section */}
                        <div className="mb-4">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Resources</div>
                            {resourcesMenu.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 cursor-pointer transition-all mb-1"
                                >
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                        <item.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-gray-900">{item.label}</div>
                                        <div className="text-xs text-gray-500">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pricing */}
                        <button
                            onClick={() => {
                                setPage(Page.PLATFORM_PLANS);
                                setIsMobileMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-3 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-all mb-4"
                        >
                            Pricing
                        </button>

                        {/* Mobile CTAs */}
                        <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setPage(Page.LOGIN);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                            >
                                <LogIn size={16} /> Login
                            </button>
                            <button
                                onClick={() => {
                                    setPage(Page.GET_STARTED);
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md"
                            >
                                Get Started <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
