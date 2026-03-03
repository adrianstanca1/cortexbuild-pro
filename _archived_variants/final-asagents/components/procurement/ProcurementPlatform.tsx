import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
    Building2,
    Search,
    TrendingUp,
    Users,
    BookOpen,
    Leaf,
    Shield,
    Brain,
    CheckCircle
} from 'lucide-react';

// Import our new procurement components
import { ProcurementDashboard } from './ProcurementDashboard';
import { ProcurementOnboarding } from './ProcurementOnboarding';
import { MarketIntelligenceSystem } from './MarketIntelligenceSystem';

// Import existing components
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ProcurementPlatformProps {
    companyProfile?: {
        specializations: string[];
        turnover: number;
        location: string;
        certifications: string[];
        pastProjects: string[];
        teamSize: number;
    };
}

export const ProcurementPlatform: React.FC<ProcurementPlatformProps> = ({ companyProfile }) => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [activeModule, setActiveModule] = useState('dashboard');

    // Default company profile for demo
    const defaultProfile = {
        specializations: ['Cladding', 'External Walls', 'Insulation', 'Weatherproofing'],
        turnover: 750000,
        location: 'Manchester, UK',
        certifications: ['ISO 9001', 'CHAS', 'Constructionline', 'CSCS'],
        pastProjects: ['School building renovation - £180k', 'Office cladding upgrade - £320k', 'Residential insulation - £95k'],
        teamSize: 12
    };

    const profile = companyProfile || defaultProfile;

    const procurementModules = [
        {
            id: 'dashboard',
            title: 'Procurement Dashboard',
            description: 'AI-powered tender matching and bid optimization',
            icon: Search,
            color: 'blue',
            component: ProcurementDashboard,
            features: ['Tender Matching', 'Bid Optimization', 'Compliance Checking', 'Performance Analytics']
        },
        {
            id: 'intelligence',
            title: 'Market Intelligence',
            description: 'Competitive analysis and market trends',
            icon: TrendingUp,
            color: 'green',
            component: MarketIntelligenceSystem,
            features: ['Competitor Analysis', 'Pricing Intelligence', 'Market Trends', 'Sustainability Tracking']
        },
        {
            id: 'compliance',
            title: 'Compliance Hub',
            description: 'UK Procurement Act 2023 and Building Safety compliance',
            icon: Shield,
            color: 'purple',
            component: () => (
                <Card>
                    <CardHeader>
                        <CardTitle>Compliance Hub</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded border border-green-200">
                                    <h4 className="font-semibold text-green-800 mb-2">UK Procurement Act 2023</h4>
                                    <p className="text-sm text-green-700 mb-3">
                                        Automated compliance checking and documentation generation for the new UK procurement framework.
                                    </p>
                                    <Badge className="bg-green-100 text-green-800">Fully Compliant</Badge>
                                </div>

                                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                                    <h4 className="font-semibold text-blue-800 mb-2">Building Safety Act 2022</h4>
                                    <p className="text-sm text-blue-700 mb-3">
                                        Cladding-specific compliance tools and fire safety documentation management.
                                    </p>
                                    <Badge className="bg-blue-100 text-blue-800">Certified</Badge>
                                </div>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                                <h4 className="font-semibold text-yellow-800 mb-2">CPV Code Validation</h4>
                                <p className="text-sm text-yellow-700">
                                    Automatic validation of Common Procurement Vocabulary codes for accurate tender classification.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ),
            features: ['Automated Compliance Checking', 'Document Generation', 'CPV Code Validation', 'Regulatory Updates']
        },
        {
            id: 'learning',
            title: 'Learning Hub',
            description: 'Guided tutorials and procurement education',
            icon: BookOpen,
            color: 'orange',
            component: () => (
                <Card>
                    <CardHeader>
                        <CardTitle>Learning Hub</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Button
                                onClick={() => setShowOnboarding(true)}
                                className="w-full"
                                size="lg"
                            >
                                <BookOpen className="w-5 h-5 mr-2" />
                                Start Procurement Onboarding
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4">
                                    <h4 className="font-semibold mb-2">Quick Start Guide</h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        5-step guide to your first public sector bid
                                    </p>
                                    <Badge variant="outline">15 min read</Badge>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <h4 className="font-semibold mb-2">Advanced Strategies</h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Competitive positioning for SME contractors
                                    </p>
                                    <Badge variant="outline">25 min read</Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ),
            features: ['Interactive Onboarding', 'Video Tutorials', 'Best Practices', 'Regulatory Guides']
        }
    ];

    const getModuleComponent = (moduleId: string) => {
        const module = procurementModules.find(m => m.id === moduleId);
        if (!module) return null;

        const Component = module.component;
        return <Component companyProfile={profile} />;
    };

    if (showOnboarding) {
        return (
            <ProcurementOnboarding
                onComplete={() => {
                    setShowOnboarding(false);
                    addToast('Onboarding completed! Welcome to UK procurement.', 'success');
                }}
            />
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Building2 className="w-8 h-8 mr-3 text-blue-600" />
                        ASAgents Procurement Platform
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Empowering small construction contractors in UK public procurement
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        UK Compliant
                    </Badge>
                    <Button onClick={() => setShowOnboarding(true)} variant="outline">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Learn Procurement
                    </Button>
                </div>
            </div>

            {/* Company Profile Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-500" />
                        Company Profile: {profile.location.split(',')[0]} Contractor
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Specializations</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {profile.specializations.slice(0, 2).map((spec, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">{spec}</Badge>
                                ))}
                                {profile.specializations.length > 2 && (
                                    <Badge variant="outline" className="text-xs">+{profile.specializations.length - 2} more</Badge>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Annual Turnover</p>
                            <p className="font-semibold text-lg">£{profile.turnover.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Team Size</p>
                            <p className="font-semibold text-lg">{profile.teamSize} people</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Certifications</p>
                            <p className="font-semibold text-lg">{profile.certifications.length} active</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Module Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {procurementModules.map((module) => {
                    const IconComponent = module.icon;
                    const isActive = activeModule === module.id;

                    return (
                        <Card
                            key={module.id}
                            className={`cursor-pointer transition-all hover:shadow-lg ${isActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                }`}
                            onClick={() => setActiveModule(module.id)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg bg-${module.color}-100`}>
                                        <IconComponent className={`w-6 h-6 text-${module.color}-600`} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{module.title}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                                <div className="space-y-1">
                                    {module.features.slice(0, 2).map((feature, index) => (
                                        <div key={index} className="flex items-center text-xs text-gray-500">
                                            <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                                            {feature}
                                        </div>
                                    ))}
                                    {module.features.length > 2 && (
                                        <p className="text-xs text-gray-400">+{module.features.length - 2} more features</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Active Module Content */}
            <div className="mt-8">
                {getModuleComponent(activeModule)}
            </div>

            {/* Key Features Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Brain className="w-5 h-5 mr-2 text-purple-500" />
                        Platform Capabilities
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <h4 className="font-semibold text-blue-700">AI-Powered Intelligence</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>• Automated tender matching</li>
                                <li>• Bid optimization recommendations</li>
                                <li>• Market trend analysis</li>
                                <li>• Competitive intelligence</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-green-700">Compliance & Safety</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>• UK Procurement Act 2023 compliance</li>
                                <li>• Building Safety Act 2022 tools</li>
                                <li>• CPV code validation</li>
                                <li>• Document generation</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold text-purple-700">SME-Focused Design</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>• Guided onboarding process</li>
                                <li>• Small business advantages</li>
                                <li>• Cost-effective pricing</li>
                                <li>• Local market insights</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};