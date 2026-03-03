import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import {
    Leaf,
    TrendingUp,
    TrendingDown,
    Users,
    Building,
    MapPin,
    Calendar,
    BarChart3,
    Eye,
    AlertTriangle,
    CheckCircle,
    Lightbulb,
    DollarSign
} from 'lucide-react';
import { procurementAI, MarketIntelligence } from '../../services/procurementAI';
import { useToast } from '../../contexts/ToastContext';

interface MarketIntelligenceData {
    competitors: Array<{
        id: string;
        name: string;
        marketShare: number;
        recentWins: number;
        averageContractValue: number;
        specializations: string[];
        strengths: string[];
        weaknesses: string[];
        sustainability: {
            score: number;
            certifications: string[];
            greenProjects: number;
        };
        lastUpdate: string;
    }>;
    marketTrends: {
        emerging: Array<{ trend: string; growth: number; impact: string }>;
        declining: Array<{ trend: string; decline: number; impact: string }>;
        stable: Array<{ trend: string; description: string }>;
    };
    pricing: {
        averageRates: { [service: string]: number };
        regionalVariations: { [region: string]: number };
        seasonalTrends: Array<{ month: string; multiplier: number }>;
    };
    sustainability: {
        carbonFootprintTargets: { [year: string]: number };
        greenProcurementWeight: number;
        sustainableMaterialsUsage: number;
        renewableEnergyAdoption: number;
        wasteReductionTargets: number;
    };
    opportunities: Array<{
        area: string;
        description: string;
        potential: string;
        requirements: string[];
        timeframe: string;
    }>;
}

interface MarketIntelligenceSystemProps {
    sector?: 'construction' | 'cladding' | 'general';
    region?: string;
}

export const MarketIntelligenceSystem: React.FC<MarketIntelligenceSystemProps> = ({
    sector = 'cladding',
    region = 'UK'
}) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [marketData, setMarketData] = useState<MarketIntelligenceData | null>(null);
    const [sustainabilityFocus, setSustainabilityFocus] = useState(false);
    const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadMarketIntelligence();
    }, [sector, region]);

    const loadMarketIntelligence = async () => {
        try {
            setLoading(true);

            // In production, this would fetch real market data
            // For now, we'll create comprehensive mock data
            const mockData: MarketIntelligenceData = {
                competitors: [
                    {
                        id: 'comp-1',
                        name: 'Regional Cladding Specialists Ltd',
                        marketShare: 18,
                        recentWins: 7,
                        averageContractValue: 450000,
                        specializations: ['External Cladding', 'Fire-Safe Systems', 'Retrofit'],
                        strengths: ['Building Safety Act expertise', 'Local authority relationships', 'Competitive pricing'],
                        weaknesses: ['Limited capacity', 'Aging workforce', 'Basic digital tools'],
                        sustainability: {
                            score: 72,
                            certifications: ['ISO 14001', 'BREEAM Excellent'],
                            greenProjects: 12
                        },
                        lastUpdate: '2024-12-19'
                    },
                    {
                        id: 'comp-2',
                        name: 'Northwest Construction Group',
                        marketShare: 25,
                        recentWins: 12,
                        averageContractValue: 680000,
                        specializations: ['Commercial Cladding', 'Educational Buildings', 'Healthcare'],
                        strengths: ['Large project capacity', 'Technical expertise', 'Financial stability'],
                        weaknesses: ['Higher pricing', 'Less flexibility', 'Remote decision making'],
                        sustainability: {
                            score: 85,
                            certifications: ['ISO 14001', 'Carbon Trust', 'BREEAM Outstanding'],
                            greenProjects: 28
                        },
                        lastUpdate: '2024-12-19'
                    },
                    {
                        id: 'comp-3',
                        name: 'Green Building Solutions',
                        marketShare: 15,
                        recentWins: 9,
                        averageContractValue: 320000,
                        specializations: ['Sustainable Cladding', 'Retrofit', 'Energy Efficiency'],
                        strengths: ['Sustainability focus', 'Innovation', 'Cost-effective solutions'],
                        weaknesses: ['Limited track record', 'Smaller team', 'Marketing reach'],
                        sustainability: {
                            score: 95,
                            certifications: ['B-Corp', 'ISO 14001', 'Passivhaus', 'BREEAM Outstanding'],
                            greenProjects: 35
                        },
                        lastUpdate: '2024-12-19'
                    }
                ],
                marketTrends: {
                    emerging: [
                        { trend: 'AI-powered project management', growth: 45, impact: 'High - Efficiency gains 20-30%' },
                        { trend: 'Circular economy materials', growth: 38, impact: 'Medium - Cost neutral, compliance bonus' },
                        { trend: 'Modular cladding systems', growth: 42, impact: 'High - 15% faster installation' },
                        { trend: 'Net-zero compliance', growth: 55, impact: 'Critical - Mandatory by 2030' }
                    ],
                    declining: [
                        { trend: 'Traditional combustible materials', decline: -65, impact: 'High - Regulatory ban' },
                        { trend: 'Paper-based documentation', decline: -35, impact: 'Medium - Digital transformation' },
                        { trend: 'Manual measurement processes', decline: -28, impact: 'Low - Accuracy improvements' }
                    ],
                    stable: [
                        { trend: 'Standard insulation work', description: 'Consistent demand for thermal efficiency upgrades' },
                        { trend: 'Maintenance contracts', description: 'Regular inspection and repair services' },
                        { trend: 'Emergency repair services', description: 'Weather damage and urgent fixes' }
                    ]
                },
                pricing: {
                    averageRates: {
                        'External Cladding (per m²)': 185,
                        'Insulation Installation (per m²)': 35,
                        'Fire Safety Upgrade (per m²)': 220,
                        'Maintenance (per m² annually)': 12,
                        'Project Management (daily rate)': 450
                    },
                    regionalVariations: {
                        'London': 1.35,
                        'South East': 1.15,
                        'North West': 0.95,
                        'Yorkshire': 0.90,
                        'Scotland': 0.85,
                        'Wales': 0.80
                    },
                    seasonalTrends: [
                        { month: 'Jan', multiplier: 0.85 },
                        { month: 'Feb', multiplier: 0.90 },
                        { month: 'Mar', multiplier: 1.10 },
                        { month: 'Apr', multiplier: 1.15 },
                        { month: 'May', multiplier: 1.20 },
                        { month: 'Jun', multiplier: 1.25 },
                        { month: 'Jul', multiplier: 1.30 },
                        { month: 'Aug', multiplier: 1.25 },
                        { month: 'Sep', multiplier: 1.15 },
                        { month: 'Oct', multiplier: 1.05 },
                        { month: 'Nov', multiplier: 0.95 },
                        { month: 'Dec', multiplier: 0.80 }
                    ]
                },
                sustainability: {
                    carbonFootprintTargets: {
                        '2024': 100,
                        '2025': 85,
                        '2026': 70,
                        '2027': 55,
                        '2028': 40,
                        '2029': 25,
                        '2030': 0
                    },
                    greenProcurementWeight: 15, // percentage of evaluation criteria
                    sustainableMaterialsUsage: 35, // percentage requirement
                    renewableEnergyAdoption: 60, // percentage of projects
                    wasteReductionTargets: 25 // percentage reduction target
                },
                opportunities: [
                    {
                        area: 'Building Safety Act Compliance',
                        description: 'Expertise in fire-safe cladding systems and competency frameworks',
                        potential: '£2.1M annual market opportunity',
                        requirements: ['BSA competency', 'Fire safety training', 'Material certifications'],
                        timeframe: 'Immediate (2024-2026)'
                    },
                    {
                        area: 'Net Zero Retrofit',
                        description: 'Energy efficiency upgrades for existing buildings',
                        potential: '£15.6M annual market by 2030',
                        requirements: ['EPC assessment capability', 'Thermal bridging expertise', 'PAS 2035 certification'],
                        timeframe: 'Growing (2024-2030)'
                    },
                    {
                        area: 'Modular Construction',
                        description: 'Off-site manufactured cladding systems',
                        potential: '£8.3M annual market by 2028',
                        requirements: ['Design for manufacture expertise', 'Quality assurance systems', 'Logistics capability'],
                        timeframe: 'Medium-term (2026-2030)'
                    }
                ]
            };

            setMarketData(mockData);
            addToast('Market intelligence updated', 'success');
        } catch (error) {
            console.error('Error loading market intelligence:', error);
            addToast('Failed to load market data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getSustainabilityColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getTrendIcon = (growth: number) => {
        if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
        return <TrendingDown className="w-4 h-4 text-red-500" />;
    };

    if (loading || !marketData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-500">Loading market intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Market Intelligence System</h1>
                    <p className="text-gray-600 mt-1">
                        Competitive analysis and market trends for {sector} sector in {region}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant={sustainabilityFocus ? "primary" : "outline"}
                        onClick={() => setSustainabilityFocus(!sustainabilityFocus)}
                        size="sm"
                    >
                        <Leaf className="w-4 h-4 mr-2" />
                        Sustainability Focus
                    </Button>
                    <Button onClick={loadMarketIntelligence} variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Market Size</p>
                                <p className="text-2xl font-bold text-blue-600">£127M</p>
                                <p className="text-xs text-green-600">+12% YoY</p>
                            </div>
                            <Building className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Competitors</p>
                                <p className="text-2xl font-bold text-orange-600">{marketData.competitors.length}</p>
                                <p className="text-xs text-gray-500">Tracked</p>
                            </div>
                            <Users className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Avg Contract Value</p>
                                <p className="text-2xl font-bold text-green-600">
                                    £{Math.round(marketData.competitors.reduce((sum, c) => sum + c.averageContractValue, 0) / marketData.competitors.length / 1000)}k
                                </p>
                                <p className="text-xs text-green-600">+8% vs last year</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Sustainability Score</p>
                                <p className={`text-2xl font-bold ${getSustainabilityColor(80)}`}>80%</p>
                                <p className="text-xs text-green-600">Industry average</p>
                            </div>
                            <Leaf className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="competitors">Competitors</TabsTrigger>
                    <TabsTrigger value="trends">Market Trends</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing Intelligence</TabsTrigger>
                    <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Market Opportunities */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                                    Key Opportunities
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {marketData.opportunities.map((opp, index) => (
                                        <div key={index} className="border-l-4 border-blue-400 pl-4 bg-blue-50 p-3 rounded-r">
                                            <h4 className="font-semibold text-blue-800">{opp.area}</h4>
                                            <p className="text-sm text-blue-700 mb-2">{opp.description}</p>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-green-700">{opp.potential}</span>
                                                <Badge variant="outline">{opp.timeframe}</Badge>
                                            </div>
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-600 mb-1">Requirements:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {opp.requirements.map((req, i) => (
                                                        <Badge key={i} className="text-xs bg-gray-100 text-gray-700">{req}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Market Snapshot</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50 p-3 rounded border">
                                            <div className="text-2xl font-bold text-green-700">
                                                {marketData.marketTrends.emerging.length}
                                            </div>
                                            <p className="text-sm text-green-600">Emerging Trends</p>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded border">
                                            <div className="text-2xl font-bold text-red-700">
                                                {marketData.marketTrends.declining.length}
                                            </div>
                                            <p className="text-sm text-red-600">Declining Areas</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Regional Pricing Variations</h4>
                                        <div className="space-y-2">
                                            {Object.entries(marketData.pricing.regionalVariations)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 3)
                                                .map(([region, multiplier]) => (
                                                    <div key={region} className="flex justify-between items-center">
                                                        <span className="text-sm">{region}</span>
                                                        <Badge className={multiplier > 1.1 ? 'bg-red-100 text-red-800' :
                                                            multiplier < 0.9 ? 'bg-green-100 text-green-800' :
                                                                'bg-yellow-100 text-yellow-800'}>
                                                            {multiplier > 1 ? '+' : ''}{Math.round((multiplier - 1) * 100)}%
                                                        </Badge>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                    <Alert>
                                        <Calendar className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>Seasonal Insight:</strong> Summer months (June-August) show 25-30% higher
                                            activity and pricing due to favorable weather conditions.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="competitors" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {marketData.competitors.map((competitor) => (
                            <Card key={competitor.id} className="overflow-hidden">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl">{competitor.name}</CardTitle>
                                            <div className="flex items-center space-x-4 mt-2">
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    {competitor.marketShare}% Market Share
                                                </Badge>
                                                <Badge className="bg-green-100 text-green-800">
                                                    {competitor.recentWins} Recent Wins
                                                </Badge>
                                                <Badge className={`${getSustainabilityColor(competitor.sustainability.score)} bg-opacity-10`}>
                                                    {competitor.sustainability.score}% Sustainability
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-gray-700">
                                                £{(competitor.averageContractValue / 1000).toFixed(0)}k
                                            </div>
                                            <p className="text-sm text-gray-500">Avg Contract</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Specializations */}
                                        <div>
                                            <h4 className="font-semibold mb-2">Specializations</h4>
                                            <div className="space-y-1">
                                                {competitor.specializations.map((spec, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs block w-fit">
                                                        {spec}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Strengths & Weaknesses */}
                                        <div>
                                            <div className="mb-4">
                                                <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                                                <ul className="space-y-1">
                                                    {competitor.strengths.map((strength, index) => (
                                                        <li key={index} className="text-sm flex items-start">
                                                            <CheckCircle className="w-3 h-3 text-green-500 mt-1 mr-2 flex-shrink-0" />
                                                            {strength}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-red-700 mb-2">Weaknesses</h4>
                                                <ul className="space-y-1">
                                                    {competitor.weaknesses.map((weakness, index) => (
                                                        <li key={index} className="text-sm flex items-start">
                                                            <AlertTriangle className="w-3 h-3 text-red-500 mt-1 mr-2 flex-shrink-0" />
                                                            {weakness}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Sustainability Profile */}
                                        {sustainabilityFocus && (
                                            <div>
                                                <h4 className="font-semibold mb-2">Sustainability Profile</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm">Overall Score</span>
                                                        <span className={`font-semibold ${getSustainabilityColor(competitor.sustainability.score)}`}>
                                                            {competitor.sustainability.score}%
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm">Green Projects</span>
                                                        <span className="font-semibold">{competitor.sustainability.greenProjects}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Certifications:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {competitor.sustainability.certifications.map((cert, i) => (
                                                                <Badge key={i} className="text-xs bg-green-100 text-green-700">{cert}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Emerging Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-700 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2" />
                                    Emerging Opportunities
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {marketData.marketTrends.emerging.map((trend, index) => (
                                        <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-green-800">{trend.trend}</h4>
                                                <Badge className="bg-green-100 text-green-800">+{trend.growth}%</Badge>
                                            </div>
                                            <p className="text-sm text-green-700">{trend.impact}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Declining Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-red-700 flex items-center">
                                    <TrendingDown className="w-5 h-5 mr-2" />
                                    Declining Areas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {marketData.marketTrends.declining.map((trend, index) => (
                                        <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-red-800">{trend.trend}</h4>
                                                <Badge className="bg-red-100 text-red-800">{trend.decline}%</Badge>
                                            </div>
                                            <p className="text-sm text-red-700">{trend.impact}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stable Markets */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-blue-700">Stable Market Areas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {marketData.marketTrends.stable.map((trend, index) => (
                                        <div key={index} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                            <h4 className="font-semibold text-blue-800 mb-2">{trend.trend}</h4>
                                            <p className="text-sm text-blue-700">{trend.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Service Rates */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Average Market Rates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(marketData.pricing.averageRates).map(([service, rate]) => (
                                        <div key={service} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                            <span className="font-medium text-sm">{service}</span>
                                            <span className="font-bold text-blue-600">£{rate}</span>
                                        </div>
                                    ))}
                                </div>
                                <Alert className="mt-4">
                                    <MapPin className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        Rates shown are UK averages. Regional variations apply - see regional pricing for adjustments.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        {/* Regional Variations */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Regional Price Variations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(marketData.pricing.regionalVariations)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([region, multiplier]) => (
                                            <div key={region} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                <span className="font-medium text-sm">{region}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-600">
                                                        {multiplier > 1 ? '+' : ''}{Math.round((multiplier - 1) * 100)}%
                                                    </span>
                                                    <Badge className={
                                                        multiplier > 1.2 ? 'bg-red-100 text-red-800' :
                                                            multiplier > 1.0 ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                    }>
                                                        {multiplier.toFixed(2)}x
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </CardContent>
                        </Card>

                        {/* Seasonal Trends */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Seasonal Pricing Trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-12 gap-2">
                                    {marketData.pricing.seasonalTrends.map((month) => (
                                        <div key={month.month} className="text-center">
                                            <div className="text-xs font-medium text-gray-600 mb-1">{month.month}</div>
                                            <div className={`rounded flex items-end justify-center text-xs font-bold h-12 ${month.multiplier > 1.1 ? 'bg-green-500 text-white' :
                                                    month.multiplier < 0.9 ? 'bg-red-500 text-white' :
                                                        'bg-gray-300 text-gray-700'
                                                }`}>
                                                {month.multiplier.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 mt-4">
                                    Seasonal multipliers show pricing variations throughout the year.
                                    Summer months typically see 20-30% higher rates due to increased activity.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="sustainability" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Carbon Footprint Targets */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Leaf className="w-5 h-5 mr-2 text-green-500" />
                                    Carbon Reduction Targets
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 mb-4">
                                        UK construction industry carbon reduction pathway to net zero by 2030:
                                    </p>
                                    <div className="space-y-3">
                                        {Object.entries(marketData.sustainability.carbonFootprintTargets).map(([year, target]) => (
                                            <div key={year} className="flex justify-between items-center">
                                                <span className="font-medium">{year}</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div className={`h-2 rounded-full transition-all duration-300 ${target === 0 ? 'w-0 bg-green-500' :
                                                                target <= 25 ? 'w-1/4 bg-orange-500' :
                                                                    target <= 50 ? 'w-1/2 bg-yellow-500' :
                                                                        target <= 75 ? 'w-3/4 bg-red-400' :
                                                                            'w-full bg-red-500'
                                                            }`}></div>
                                                    </div>
                                                    <span className="text-sm font-semibold w-8">{target}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sustainability Requirements */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Procurement Requirements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="bg-green-50 p-4 rounded border border-green-200">
                                        <h4 className="font-semibold text-green-800 mb-2">Green Procurement Weight</h4>
                                        <div className="flex items-center justify-between">
                                            <span className="text-green-700">Evaluation criteria</span>
                                            <span className="font-bold text-green-800">{marketData.sustainability.greenProcurementWeight}%</span>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                                        <h4 className="font-semibold text-blue-800 mb-2">Sustainable Materials</h4>
                                        <div className="flex items-center justify-between">
                                            <span className="text-blue-700">Minimum requirement</span>
                                            <span className="font-bold text-blue-800">{marketData.sustainability.sustainableMaterialsUsage}%</span>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded border border-purple-200">
                                        <h4 className="font-semibold text-purple-800 mb-2">Renewable Energy</h4>
                                        <div className="flex items-center justify-between">
                                            <span className="text-purple-700">Project adoption target</span>
                                            <span className="font-bold text-purple-800">{marketData.sustainability.renewableEnergyAdoption}%</span>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 p-4 rounded border border-orange-200">
                                        <h4 className="font-semibold text-orange-800 mb-2">Waste Reduction</h4>
                                        <div className="flex items-center justify-between">
                                            <span className="text-orange-700">Annual target</span>
                                            <span className="font-bold text-orange-800">{marketData.sustainability.wasteReductionTargets}%</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sustainability Competitive Analysis */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Competitor Sustainability Comparison</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {marketData.competitors
                                        .sort((a, b) => b.sustainability.score - a.sustainability.score)
                                        .map((competitor) => (
                                            <div key={competitor.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-semibold">{competitor.name}</h4>
                                                    <Badge className={`${getSustainabilityColor(competitor.sustainability.score)} bg-opacity-10`}>
                                                        {competitor.sustainability.score}% Sustainability Score
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-600 mb-1">Certifications</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {competitor.sustainability.certifications.map((cert, i) => (
                                                                <Badge key={i} variant="outline" className="text-xs">{cert}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600 mb-1">Green Projects</p>
                                                        <p className="font-semibold">{competitor.sustainability.greenProjects} completed</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600 mb-1">Market Share</p>
                                                        <p className="font-semibold">{competitor.marketShare}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};