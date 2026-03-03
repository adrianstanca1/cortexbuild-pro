import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Search, Filter, TrendingUp, AlertTriangle, CheckCircle, Calendar, MapPin, DollarSign } from 'lucide-react';
import { procurementAI, TenderOpportunity, BidOptimizationResult, MarketIntelligence, ComplianceAssessment } from '../../services/procurementAI';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ProcurementDashboardProps {
  companyProfile?: {
    specializations: string[];
    turnover: number;
    location: string;
    certifications: string[];
    pastProjects: string[];
    teamSize: number;
  };
}

export const ProcurementDashboard: React.FC<ProcurementDashboardProps> = ({ companyProfile }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [tenders, setTenders] = useState<TenderOpportunity[]>([]);
  const [marketIntel, setMarketIntel] = useState<MarketIntelligence | null>(null);
  const [selectedTender, setSelectedTender] = useState<TenderOpportunity | null>(null);
  const [bidOptimization, setBidOptimization] = useState<BidOptimizationResult | null>(null);
  const [compliance, setCompliance] = useState<ComplianceAssessment | null>(null);
  const [activeTab, setActiveTab] = useState('opportunities');

  // Default company profile for demo purposes
  const defaultProfile = {
    specializations: ['Cladding', 'External Walls', 'Insulation'],
    turnover: 750000,
    location: 'Manchester, UK',
    certifications: ['ISO 9001', 'CHAS', 'Constructionline'],
    pastProjects: ['School renovation', 'Office building cladding', 'Residential insulation'],
    teamSize: 12
  };

  const profile = companyProfile || defaultProfile;

  useEffect(() => {
    loadTenderOpportunities();
    loadMarketIntelligence();
  }, []);

  const loadTenderOpportunities = async () => {
    try {
      setLoading(true);
      const opportunities = await procurementAI.findMatchingTenders(profile, {
        focusOnCladding: true,
        maxContractValue: 1000000
      });
      setTenders(opportunities);
    } catch (error) {
      console.error('Error loading tenders:', error);
      addToast('Failed to load tender opportunities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMarketIntelligence = async () => {
    try {
      const intel = await procurementAI.generateMarketIntelligence('cladding', 'UK');
      setMarketIntel(intel);
    } catch (error) {
      console.error('Error loading market intelligence:', error);
    }
  };

  const optimizeBid = async (tender: TenderOpportunity) => {
    try {
      setLoading(true);
      setSelectedTender(tender);

      const tenderDetails = {
        title: tender.title,
        description: tender.description,
        contractValue: tender.contractValue,
        requirements: tender.complianceRequirements,
        location: tender.location,
        deadline: tender.deadline
      };

      const companyInfo = {
        capabilities: profile.specializations,
        pastPerformance: profile.pastProjects,
        resources: [`${profile.teamSize} team members`, 'Local presence', ...profile.certifications],
        costs: { labor: 350, materials: 35, overhead: 15 }
      };

      const optimization = await procurementAI.optimizeBid(tenderDetails, companyInfo);
      setBidOptimization(optimization);

      // Also check compliance
      const complianceAssessment = await procurementAI.assessCompliance({
        contractValue: tender.contractValue,
        procurementType: tender.procurementType,
        description: tender.description,
        authority: tender.contractingAuthority,
        isCladdingWork: tender.title.toLowerCase().includes('cladding')
      });
      setCompliance(complianceAssessment);

      setActiveTab('optimization');
      addToast('Bid optimization completed', 'success');
    } catch (error) {
      console.error('Error optimizing bid:', error);
      addToast('Failed to optimize bid', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'CRITICAL': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Procurement Intelligence</h1>
          <p className="text-gray-600 mt-1">AI-powered tender matching and bid optimization</p>
        </div>
        <Button onClick={loadTenderOpportunities} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
          Refresh Opportunities
        </Button>
      </div>

      {/* Key Metrics */}
      {marketIntel && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Cladding Contract</p>
                  <p className="text-2xl font-bold text-green-600">
                    £{marketIntel.averageContractValues['Cladding Works']?.toLocaleString() || '350,000'}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Opportunities</p>
                  <p className="text-2xl font-bold text-blue-600">{tenders.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Matches</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {tenders.filter(t => t.matchScore > 80).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-orange-600">
                    £{tenders.reduce((sum, t) => sum + t.contractValue, 0).toLocaleString()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="opportunities" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="optimization">Bid Optimization</TabsTrigger>
          <TabsTrigger value="intelligence">Market Intelligence</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matched Tender Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Loading opportunities...</span>
                </div>
              ) : tenders.length > 0 ? (
                <div className="space-y-4">
                  {tenders.map((tender) => (
                    <Card key={tender.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{tender.title}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{tender.description}</p>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {tender.location}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Deadline: {new Date(tender.deadline).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                £{tender.contractValue.toLocaleString()}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge className={getRiskBadgeColor(tender.riskLevel)}>
                                {tender.riskLevel} Risk
                              </Badge>
                              <Badge className={getRiskBadgeColor(tender.estimatedCompetition)}>
                                {tender.estimatedCompetition} Competition
                              </Badge>
                              {tender.cpvCodes.map(code => (
                                <Badge key={code} variant="outline" className="text-xs">
                                  CPV: {code}
                                </Badge>
                              ))}
                            </div>

                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Authority:</strong> {tender.contractingAuthority}
                            </p>
                            <p className="text-sm text-gray-700">
                              <strong>Analysis:</strong> {tender.suitabilityAnalysis}
                            </p>
                          </div>

                          <div className="ml-4 text-right">
                            <div className={`text-3xl font-bold mb-2 ${getMatchScoreColor(tender.matchScore)}`}>
                              {tender.matchScore}%
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Match Score</p>

                            <Button
                              onClick={() => optimizeBid(tender)}
                              disabled={loading}
                              size="sm"
                            >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Optimize Bid
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tender opportunities found matching your profile.</p>
                  <Button onClick={loadTenderOpportunities} className="mt-4" variant="outline">
                    Search Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          {selectedTender && bidOptimization ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Bid Optimization for: {selectedTender.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price Recommendation */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">Recommended Bid Price</h3>
                    <div className="text-3xl font-bold text-green-700 mb-2">
                      £{bidOptimization.recommendedPrice.toLocaleString()}
                    </div>
                    <p className="text-sm text-green-700">{bidOptimization.priceJustification}</p>
                    <div className="mt-3">
                      <Badge className="bg-green-100 text-green-800">
                        {bidOptimization.winProbability}% Win Probability
                      </Badge>
                    </div>
                  </div>

                  {/* Competitive Advantages */}
                  <div>
                    <h3 className="font-semibold mb-3">Competitive Advantages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bidOptimization.competitiveAdvantages.map((advantage, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{advantage}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Improvement Areas */}
                  <div>
                    <h3 className="font-semibold mb-3">Areas for Improvement</h3>
                    <div className="space-y-2">
                      {bidOptimization.improvementAreas.map((area, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Recommendations */}
                  <div>
                    <h3 className="font-semibold mb-3">Strategic Recommendations</h3>
                    <div className="space-y-2">
                      {bidOptimization.strategicRecommendations.map((rec, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                          <p className="text-sm text-blue-800">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compliance Checklist */}
                  <div>
                    <h3 className="font-semibold mb-3">Compliance Checklist</h3>
                    <div className="space-y-2">
                      {bidOptimization.complianceChecklist.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" title="Compliance item" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a tender opportunity to view bid optimization recommendations.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          {marketIntel ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Trends</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Emerging Opportunities</h4>
                    <ul className="space-y-1">
                      {marketIntel.trendAnalysis.emerging.map((trend, index) => (
                        <li key={index} className="text-sm flex items-center">
                          <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                          {trend}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Declining Areas</h4>
                    <ul className="space-y-1">
                      {marketIntel.trendAnalysis.declining.map((trend, index) => (
                        <li key={index} className="text-sm flex items-center">
                          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                          {trend}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Competitor Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Competitor Landscape</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketIntel.competitorAnalysis.map((competitor, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{competitor.name}</h4>
                          <Badge>{competitor.marketShare}% share</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-green-700 font-medium">Strengths:</p>
                            <ul className="text-gray-600">
                              {competitor.strengths.map((strength, i) => (
                                <li key={i}>• {strength}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-red-700 font-medium">Weaknesses:</p>
                            <ul className="text-gray-600">
                              {competitor.weaknesses.map((weakness, i) => (
                                <li key={i}>• {weakness}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Strategic Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-blue-700 mb-3">Opportunity Areas</h4>
                      <div className="space-y-2">
                        {marketIntel.opportunityAreas.map((opportunity, index) => (
                          <div key={index} className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                            <p className="text-sm text-blue-800">{opportunity}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-orange-700 mb-3">Action Items</h4>
                      <div className="space-y-2">
                        {marketIntel.recommendations.map((rec, index) => (
                          <div key={index} className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                            <p className="text-sm text-orange-800">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading market intelligence...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {compliance && selectedTender ? (
            <div className="space-y-6">
              {/* Compliance Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Assessment: {selectedTender.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {compliance.overallScore}/100
                      </div>
                      <p className="text-gray-600">Overall Compliance Score</p>
                    </div>
                    <Badge className={`${getRiskBadgeColor(compliance.riskLevel)} text-lg px-3 py-1`}>
                      {compliance.riskLevel} Risk
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Required Actions</h4>
                      <div className="space-y-2">
                        {compliance.requiredActions.map((action, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Key Deadlines</h4>
                      <div className="space-y-2">
                        {compliance.deadlines.map((deadline, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm font-medium">{deadline.action}</span>
                            <span className="text-sm text-gray-600">{deadline.deadline}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {compliance.claddingSpecificRequirements && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Cladding-Specific Requirements</h4>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1">
                            {compliance.claddingSpecificRequirements.map((req, index) => (
                              <li key={index} className="text-sm">{req}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Documentation Checklist</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {compliance.documentationNeeded.map((doc, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" title="Documentation item" />
                          <span className="text-sm">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a tender and run bid optimization to view compliance assessment.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};