import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/badge';
import { Bell, Brain, CheckCircle2, FileText, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { procurementAI, type TenderOpportunity, type BidOptimizationResult, type MarketIntelligence } from '../services/procurementAI';

interface ProcurementInsights {
    tenders: TenderOpportunity[];
    bid?: BidOptimizationResult;
    intelligence?: MarketIntelligence;
}

export const ProcurementPlatform: React.FC = () => {
    const { user, logout } = useAuth();
    const [insights, setInsights] = useState<ProcurementInsights>({ tenders: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadInsights = async () => {
            try {
                const tenders = await procurementAI.findMatchingTenders({
                    specializations: ['Cladding', 'Insulation', 'Building Envelope'],
                    turnover: 750000,
                    location: 'Manchester, UK',
                    certifications: ['ISO 9001', 'CHAS'],
                    pastProjects: ['Social Housing Retrofit', 'Education Campus Refurbishment'],
                    teamSize: 12,
                });

                const bid = tenders[0]
                    ? await procurementAI.optimizeBid(
                        {
                            title: tenders[0].title,
                            description: tenders[0].description,
                            contractValue: tenders[0].contractValue,
                            requirements: tenders[0].complianceRequirements,
                            location: tenders[0].location,
                            deadline: tenders[0].deadline,
                        },
                        {
                            capabilities: ['Cladding systems', 'Project management', 'Health & Safety'],
                            pastPerformance: ['Tier 1 subcontractor for major housing provider'],
                            resources: ['12 installers', '4 project managers', 'Digital twin tooling'],
                            costs: { labor: 185000, materials: 210000, overhead: 42000 },
                        }
                    )
                    : undefined;

                const intelligence = await procurementAI.generateMarketIntelligence('cladding', 'UK North West');

                setInsights({ tenders, bid, intelligence });
            } catch (err: any) {
                setError(err?.message || 'Unable to load procurement insights.');
            } finally {
                setLoading(false);
            }
        };

        loadInsights();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3 text-slate-600">
                    <Brain className="h-10 w-10 animate-spin" />
                    <p className="text-sm font-medium">Preparing procurement workspace…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white shadow-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Procurement Intelligence Hub</h1>
                        <p className="text-sm text-slate-500">
                            Welcome back{user ? `, ${user.firstName}` : ''}! Track tenders, bids, and compliance in one place.
                        </p>
                    </div>
                    <Button variant="secondary" onClick={logout}>
                        Sign Out
                    </Button>
                </div>
            </header>

            <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <section className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-slate-600">Live Tender Matches</CardTitle>
                            <Search className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {insights.tenders.slice(0, 3).map(tender => (
                                <div key={tender.id} className="rounded border border-slate-200 bg-white p-3">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-slate-900">{tender.title}</p>
                                        <Badge className="bg-blue-50 text-blue-600">{Math.round(tender.matchScore)}% match</Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">{tender.contractingAuthority}</p>
                                    <p className="mt-2 text-sm text-slate-600">£{tender.contractValue.toLocaleString()} · due {tender.deadline}</p>
                                </div>
                            ))}
                            {insights.tenders.length === 0 && (
                                <p className="text-sm text-slate-500">No tenders found for the selected profile.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-slate-600">Bid Optimisation</CardTitle>
                            <FileText className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {insights.bid ? (
                                <>
                                    <p className="text-sm text-slate-600">Recommended price: £{insights.bid.recommendedPrice.toLocaleString()}</p>
                                    <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
                                        {insights.bid.strategicRecommendations.slice(0, 3).map(item => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                    <Badge className="bg-emerald-50 text-emerald-600">Win probability {Math.round(insights.bid.winProbability * 100)}%</Badge>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500">Run the optimiser by selecting a tender.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-slate-600">Market Intelligence</CardTitle>
                            <CheckCircle2 className="h-5 w-5 text-purple-500" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {insights.intelligence ? (
                                <>
                                    <p className="text-sm text-slate-600">Top opportunity areas:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {insights.intelligence.opportunityAreas.slice(0, 4).map(area => (
                                            <Badge key={area} variant="outline">{area}</Badge>
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-600">Emerging trends:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {insights.intelligence.trendAnalysis.emerging.slice(0, 3).map(trend => (
                                            <Badge key={trend} className="bg-purple-50 text-purple-600">{trend}</Badge>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500">Market data will appear here once generated.</p>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-700">
                                <Bell className="h-5 w-5 text-amber-500" />
                                Compliance & Safety Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-slate-700">Procurement Act 2023</h3>
                                <p className="mt-2 text-xs text-slate-500">
                                    Automated documentation, threshold analysis, and CPV validation configured.
                                </p>
                                <Badge className="mt-3 bg-emerald-50 text-emerald-600">Aligned</Badge>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-slate-700">Building Safety Act</h3>
                                <p className="mt-2 text-xs text-slate-500">
                                    Cladding-specific safety requirements and competency evidence tracked.
                                </p>
                                <Badge className="mt-3 bg-blue-50 text-blue-600">Up to date</Badge>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-slate-700">AI Co-Pilot</h3>
                                <p className="mt-2 text-xs text-slate-500">
                                    Gemini-powered tender analysis and bid optimisation active for this workspace.
                                </p>
                                <Badge className="mt-3 bg-indigo-50 text-indigo-600">Enabled</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
};

export default ProcurementPlatform;
