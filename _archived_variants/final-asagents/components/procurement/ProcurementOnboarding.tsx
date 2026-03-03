import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
// Progress component - will implement inline or use existing component
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, ArrowRight, HelpCircle, BookOpen, Play, FileText, Users, Target } from 'lucide-react';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    content: React.ReactNode;
    completed: boolean;
}

interface ProcurementOnboardingProps {
    onComplete: () => void;
}

export const ProcurementOnboarding: React.FC<ProcurementOnboardingProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

    const steps: OnboardingStep[] = [
        {
            id: 'introduction',
            title: 'Welcome to UK Public Procurement',
            description: 'Understanding the basics of public sector contracting',
            completed: completedSteps.has('introduction'),
            content: (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                        <h3 className="text-xl font-semibold text-blue-800 mb-4">What is Public Procurement?</h3>
                        <p className="text-blue-700 mb-4">
                            Public procurement is the process by which public sector organizations (like councils, schools, and hospitals)
                            buy goods, services, and works from private companies. This represents a massive opportunity worth over £300 billion annually in the UK.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded border">
                                <h4 className="font-semibold text-blue-800 mb-2">For Cladding Contractors</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• School building upgrades</li>
                                    <li>• Hospital renovations</li>
                                    <li>• Social housing improvements</li>
                                    <li>• Council office refurbishments</li>
                                </ul>
                            </div>
                            <div className="bg-white p-4 rounded border">
                                <h4 className="font-semibold text-blue-800 mb-2">Why It Matters</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Steady, predictable income</li>
                                    <li>• Fair payment terms (30 days)</li>
                                    <li>• Less marketing needed</li>
                                    <li>• Professional development</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <Alert>
                        <BookOpen className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Did you know?</strong> Small and medium enterprises (SMEs) like yours are actively encouraged
                            in public procurement. The government has a target of 33% of spending going to SMEs.
                        </AlertDescription>
                    </Alert>
                </div>
            )
        },
        {
            id: 'regulations',
            title: 'Understanding UK Procurement Law',
            description: 'Key regulations affecting your business',
            completed: completedSteps.has('regulations'),
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Procurement Act 2023</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">
                                    The new Procurement Act comes into effect in 2024, replacing EU-derived regulations
                                    with a UK-specific framework designed to be more flexible and SME-friendly.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                                        <span className="text-sm">Simplified procedures for smaller contracts</span>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                                        <span className="text-sm">More opportunities for innovation</span>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                                        <span className="text-sm">Better value for money focus</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Building Safety Act 2022</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">
                                    Post-Grenfell legislation that significantly impacts cladding and external wall work,
                                    creating new compliance requirements but also opportunities for qualified contractors.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-orange-500 mt-1" />
                                        <span className="text-sm">Competency requirements for cladding work</span>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-orange-500 mt-1" />
                                        <span className="text-sm">Material certification obligations</span>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <CheckCircle className="w-4 h-4 text-orange-500 mt-1" />
                                        <span className="text-sm">Golden thread documentation</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contract Value Thresholds (2024)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Contract Type</th>
                                            <th className="text-right p-2">Threshold</th>
                                            <th className="text-left p-2">Process Required</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        <tr className="border-b">
                                            <td className="p-2">Small Works (typical cladding jobs)</td>
                                            <td className="p-2 text-right font-semibold">Under £230k</td>
                                            <td className="p-2 text-green-700">Simplified process</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="p-2">Standard Works</td>
                                            <td className="p-2 text-right font-semibold">£230k - £5.75m</td>
                                            <td className="p-2 text-yellow-700">Standard process</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2">Major Works</td>
                                            <td className="p-2 text-right font-semibold">Over £5.75m</td>
                                            <td className="p-2 text-red-700">Full EU procedures</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        },
        {
            id: 'finding-opportunities',
            title: 'Finding the Right Opportunities',
            description: 'Where and how to discover procurement opportunities',
            completed: completedSteps.has('finding-opportunities'),
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                    <Target className="w-5 h-5 mr-2 text-blue-500" />
                                    Official Platforms
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border-l-4 border-blue-400 pl-4">
                                    <h4 className="font-semibold">Find a Tender (FTS)</h4>
                                    <p className="text-sm text-gray-600">The UK's official portal for public procurement opportunities above EU thresholds.</p>
                                    <Badge className="mt-2">High-value contracts</Badge>
                                </div>

                                <div className="border-l-4 border-green-400 pl-4">
                                    <h4 className="font-semibold">Contracts Finder</h4>
                                    <p className="text-sm text-gray-600">For lower-value opportunities, including many suitable for cladding contractors.</p>
                                    <Badge className="mt-2">SME-friendly</Badge>
                                </div>

                                <div className="border-l-4 border-purple-400 pl-4">
                                    <h4 className="font-semibold">Local Authority Websites</h4>
                                    <p className="text-sm text-gray-600">Many councils publish opportunities directly on their procurement pages.</p>
                                    <Badge className="mt-2">Local opportunities</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-green-500" />
                                    Framework Agreements
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600 mb-4">
                                    Pre-qualified supplier lists that make bidding faster and easier. Perfect for regular work.
                                </p>

                                <div className="space-y-3">
                                    <div className="bg-green-50 p-3 rounded border">
                                        <h4 className="font-semibold text-green-800">YORbuild</h4>
                                        <p className="text-sm text-green-700">Yorkshire and Humber construction framework</p>
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded border">
                                        <h4 className="font-semibold text-blue-800">SCAPE</h4>
                                        <p className="text-sm text-blue-700">National public sector construction framework</p>
                                    </div>

                                    <div className="bg-purple-50 p-3 rounded border">
                                        <h4 className="font-semibold text-purple-800">Local Frameworks</h4>
                                        <p className="text-sm text-purple-700">Many councils have their own supplier lists</p>
                                    </div>
                                </div>

                                <Alert>
                                    <HelpCircle className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        <strong>Tip:</strong> Getting on frameworks takes time but provides regular work opportunities
                                        with simplified bidding processes.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Search Strategy for Cladding Contractors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Key Search Terms</h4>
                                    <div className="space-y-1 text-sm">
                                        <Badge variant="outline">Cladding</Badge>
                                        <Badge variant="outline">External walls</Badge>
                                        <Badge variant="outline">Building envelope</Badge>
                                        <Badge variant="outline">Facade</Badge>
                                        <Badge variant="outline">Weatherproofing</Badge>
                                        <Badge variant="outline">Insulation</Badge>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">CPV Codes to Watch</h4>
                                    <div className="space-y-1 text-sm">
                                        <div><code className="bg-gray-100 px-1 rounded">45261210</code> - Facade work</div>
                                        <div><code className="bg-gray-100 px-1 rounded">45261220</code> - Roof work</div>
                                        <div><code className="bg-gray-100 px-1 rounded">45261100</code> - Structural work</div>
                                        <div><code className="bg-gray-100 px-1 rounded">45421130</code> - Insulation work</div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Target Sectors</h4>
                                    <div className="space-y-1 text-sm">
                                        <div>🏫 Education (schools, colleges)</div>
                                        <div>🏥 Healthcare (hospitals, clinics)</div>
                                        <div>🏢 Local government (offices)</div>
                                        <div>🏠 Social housing</div>
                                        <div>🚓 Emergency services</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        },
        {
            id: 'bidding-process',
            title: 'The Bidding Process',
            description: 'Step-by-step guide to successful bidding',
            completed: completedSteps.has('bidding-process'),
            content: (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
                        <h3 className="text-xl font-semibold text-blue-800 mb-4">Typical Bidding Timeline</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">1</div>
                                <h4 className="font-semibold text-sm">Opportunity Published</h4>
                                <p className="text-xs text-gray-600">Day 0</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">2</div>
                                <h4 className="font-semibold text-sm">Clarification Period</h4>
                                <p className="text-xs text-gray-600">Days 1-14</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">3</div>
                                <h4 className="font-semibold text-sm">Bid Preparation</h4>
                                <p className="text-xs text-gray-600">Days 15-28</p>
                            </div>
                            <div className="text-center">
                                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">4</div>
                                <h4 className="font-semibold text-sm">Submission</h4>
                                <p className="text-xs text-gray-600">Day 30</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Essential Bid Components</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-start space-x-3">
                                        <FileText className="w-5 h-5 text-blue-500 mt-1" />
                                        <div>
                                            <h4 className="font-semibold">Technical Proposal</h4>
                                            <p className="text-sm text-gray-600">How you'll deliver the work, methodology, materials</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <FileText className="w-5 h-5 text-green-500 mt-1" />
                                        <div>
                                            <h4 className="font-semibold">Commercial Proposal</h4>
                                            <p className="text-sm text-gray-600">Pricing, payment terms, value for money</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <FileText className="w-5 h-5 text-purple-500 mt-1" />
                                        <div>
                                            <h4 className="font-semibold">Compliance Documentation</h4>
                                            <p className="text-sm text-gray-600">Certifications, insurance, safety policies</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <FileText className="w-5 h-5 text-orange-500 mt-1" />
                                        <div>
                                            <h4 className="font-semibold">Past Performance</h4>
                                            <p className="text-sm text-gray-600">Case studies, references, similar projects</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Evaluation Criteria</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">
                                    Public sector contracts are typically evaluated on:
                                </p>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="font-medium">Price</span>
                                        <span className="text-sm text-gray-600">30-60%</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="font-medium">Quality</span>
                                        <span className="text-sm text-gray-600">30-50%</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="font-medium">Social Value</span>
                                        <span className="text-sm text-gray-600">5-20%</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="font-medium">Environmental</span>
                                        <span className="text-sm text-gray-600">5-15%</span>
                                    </div>
                                </div>

                                <Alert className="mt-4">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        <strong>Most Important:</strong> Public sector buyers must consider "Most Economically Advantageous Tender" (MEAT)
                                        - not just lowest price, but best overall value.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Common Mistakes to Avoid</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-red-700">❌ Don't Do This</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="bg-red-50 p-2 rounded border-l-4 border-red-400">
                                            Submit late (even 1 minute past deadline = automatic rejection)
                                        </div>
                                        <div className="bg-red-50 p-2 rounded border-l-4 border-red-400">
                                            Miss mandatory requirements or documents
                                        </div>
                                        <div className="bg-red-50 p-2 rounded border-l-4 border-red-400">
                                            Use generic proposals without customization
                                        </div>
                                        <div className="bg-red-50 p-2 rounded border-l-4 border-red-400">
                                            Ignore word limits or format requirements
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-semibold text-green-700">✅ Best Practices</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="bg-green-50 p-2 rounded border-l-4 border-green-400">
                                            Submit well before deadline (aim for 24hrs early)
                                        </div>
                                        <div className="bg-green-50 p-2 rounded border-l-4 border-green-400">
                                            Use a checklist to verify all requirements
                                        </div>
                                        <div className="bg-green-50 p-2 rounded border-l-4 border-green-400">
                                            Tailor every proposal to the specific opportunity
                                        </div>
                                        <div className="bg-green-50 p-2 rounded border-l-4 border-green-400">
                                            Get someone else to review before submission
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        },
        {
            id: 'success-tips',
            title: 'Success Tips for Small Contractors',
            description: 'Practical advice for competing effectively',
            completed: completedSteps.has('success-tips'),
            content: (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Your Competitive Advantages as an SME</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold text-green-700 mb-3">Natural Strengths</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-start space-x-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                                            <span className="text-sm">Flexibility and agility in delivery</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                                            <span className="text-sm">Personal service from senior staff</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                                            <span className="text-sm">Local knowledge and relationships</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                                            <span className="text-sm">Lower overheads = competitive pricing</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                                            <span className="text-sm">Innovation and creative solutions</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-blue-700 mb-3">Government Support</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-start space-x-2">
                                            <Target className="w-4 h-4 text-blue-500 mt-1" />
                                            <span className="text-sm">33% SME spend target</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <Target className="w-4 h-4 text-blue-500 mt-1" />
                                            <span className="text-sm">Simplified procedures for smaller contracts</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <Target className="w-4 h-4 text-blue-500 mt-1" />
                                            <span className="text-sm">Contract packaging to suit SMEs</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <Target className="w-4 h-4 text-blue-500 mt-1" />
                                            <span className="text-sm">Early payment initiatives</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <Target className="w-4 h-4 text-blue-500 mt-1" />
                                            <span className="text-sm">Meet the buyer events</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Building Your Track Record</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded border">
                                    <h4 className="font-semibold text-blue-800 mb-2">Start Small, Think Big</h4>
                                    <p className="text-sm text-blue-700">
                                        Begin with smaller contracts to build public sector experience and references.
                                        Even a £20k contract can open doors to larger opportunities.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold">Progression Strategy:</h4>
                                    <div className="text-sm space-y-1">
                                        <div>1. Small maintenance contracts (£10k-£50k)</div>
                                        <div>2. Minor works frameworks (£50k-£250k)</div>
                                        <div>3. Major project subcontracting</div>
                                        <div>4. Direct major contracts (£250k+)</div>
                                    </div>
                                </div>

                                <Alert>
                                    <BookOpen className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        Document everything! Keep detailed records of all public sector work for future bids.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Social Value Opportunities</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Social value is increasingly important in public procurement. Small actions can have big impact:
                                </p>

                                <div className="space-y-3">
                                    <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                                        <h4 className="font-semibold text-green-800">Local Employment</h4>
                                        <p className="text-sm text-green-700">Hire locally, offer apprenticeships, support job creation</p>
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                                        <h4 className="font-semibold text-blue-800">Skills Development</h4>
                                        <p className="text-sm text-blue-700">Training programs, school visits, industry mentoring</p>
                                    </div>

                                    <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
                                        <h4 className="font-semibold text-purple-800">Environmental</h4>
                                        <p className="text-sm text-purple-700">Sustainable materials, waste reduction, carbon footprint</p>
                                    </div>

                                    <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                                        <h4 className="font-semibold text-orange-800">Community Benefits</h4>
                                        <p className="text-sm text-orange-700">Local supply chain, community projects, voluntary work</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Essential Certifications & Accreditations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h4 className="font-semibold mb-3 text-red-700">Essential (Must Have)</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="bg-red-50 p-2 rounded">Public Liability Insurance (min £2m)</div>
                                        <div className="bg-red-50 p-2 rounded">Employers Liability Insurance</div>
                                        <div className="bg-red-50 p-2 rounded">Health & Safety Policy</div>
                                        <div className="bg-red-50 p-2 rounded">HMRC Tax Registration</div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-3 text-yellow-700">Highly Recommended</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="bg-yellow-50 p-2 rounded">Constructionline Registration</div>
                                        <div className="bg-yellow-50 p-2 rounded">CHAS Accreditation</div>
                                        <div className="bg-yellow-50 p-2 rounded">ISO 9001 Quality</div>
                                        <div className="bg-yellow-50 p-2 rounded">CSCS Cards for operatives</div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-3 text-green-700">Cladding Specific</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="bg-green-50 p-2 rounded">Building Safety Act Competency</div>
                                        <div className="bg-green-50 p-2 rounded">Fire Safety Training</div>
                                        <div className="bg-green-50 p-2 rounded">CWCT Membership</div>
                                        <div className="bg-green-50 p-2 rounded">Material Manufacturer Approvals</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }
    ];

    const completeStep = (stepId: string) => {
        setCompletedSteps(prev => new Set([...prev, stepId]));
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            completeStep(steps[currentStep].id);
            setCurrentStep(currentStep + 1);
        } else {
            completeStep(steps[currentStep].id);
            onComplete();
        }
    };

    const previousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const progress = ((completedSteps.size) / steps.length) * 100;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">Procurement Onboarding</h1>
                    <Badge className="text-lg px-3 py-1">
                        {completedSteps.size}/{steps.length} Complete
                    </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                        className={`bg-blue-600 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-gray-600">
                    Master UK public procurement for construction contractors in {steps.length} guided steps
                </p>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
                            <p className="text-gray-600 mt-1">{steps[currentStep].description}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                                {currentStep + 1}/{steps.length}
                            </div>
                            <p className="text-sm text-gray-500">Step</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {steps[currentStep].content}
                </CardContent>
            </Card>

            <div className="flex justify-between">
                <Button
                    onClick={previousStep}
                    variant="outline"
                    disabled={currentStep === 0}
                >
                    Previous
                </Button>

                <Button
                    onClick={nextStep}
                    className="flex items-center space-x-2"
                >
                    <span>{currentStep === steps.length - 1 ? 'Complete Onboarding' : 'Next Step'}</span>
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Step Navigation */}
            <div className="mt-8 border-t pt-6">
                <h3 className="font-semibold mb-4">Quick Navigation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {steps.map((step, index) => (
                        <Button
                            key={step.id}
                            variant={index === currentStep ? "primary" : completedSteps.has(step.id) ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setCurrentStep(index)}
                            className="justify-start"
                        >
                            {completedSteps.has(step.id) && <CheckCircle className="w-4 h-4 mr-2" />}
                            {step.title}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};