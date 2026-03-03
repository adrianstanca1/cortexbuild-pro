import React, { useState, useEffect, useRef } from 'react';
import { User, Project, SafetyIncident, Expense, View } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ViewHeader } from '../layout/ViewHeader';
import { constructionAI, AIAnalysisResult, AIRecommendation, ProjectOptimization, SafetyAnalysis } from '../../services/constructionAI';
import { api } from '../../services/mockApi';
import {
    Bot,
    Send,
    FileText,
    Shield,
    TrendingUp,
    AlertTriangle,
    DollarSign,
    Clock,
    CheckCircle,
    User as UserIcon,
    Sparkles,
    Lightbulb,
    BarChart3,
    Target,
    Settings,
    RefreshCw,
    Download,
    Eye
} from 'lucide-react';

interface AIAssistantProps {
    user: User;
    addToast: (message: string, type: 'success' | 'error' | 'warning') => void;
    setActiveView: (view: View) => void;
}

interface ChatMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
    analysis?: AIAnalysisResult;
    recommendations?: AIRecommendation[];
}

interface AnalysisTab {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    type: 'document' | 'safety' | 'project' | 'cost' | 'general';
}

const RecommendationCard: React.FC<{
    recommendation: AIRecommendation;
    onView: () => void;
}> = ({ recommendation, onView }) => {
    const priorityColors = {
        LOW: 'bg-green-100 text-green-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        HIGH: 'bg-orange-100 text-orange-800',
        CRITICAL: 'bg-red-100 text-red-800',
    };

    const priorityIcons = {
        LOW: CheckCircle,
        MEDIUM: Clock,
        HIGH: AlertTriangle,
        CRITICAL: AlertTriangle,
    };

    const PriorityIcon = priorityIcons[recommendation.priority];

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[recommendation.priority]}`}>
                            {recommendation.priority}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                </div>
                <PriorityIcon className="w-5 h-5 text-gray-400 ml-2" />
            </div>

            <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Target className="w-4 h-4" />
                    <span>Expected Impact: {recommendation.estimatedImpact}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <BarChart3 className="w-4 h-4" />
                    <span>Confidence: {recommendation.confidence}%</span>
                </div>
            </div>

            {recommendation.actionItems.length > 0 && (
                <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Action Items:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        {recommendation.actionItems.slice(0, 3).map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{item}</span>
                            </li>
                        ))}
                        {recommendation.actionItems.length > 3 && (
                            <li className="text-blue-600 text-xs">
                                +{recommendation.actionItems.length - 3} more actions
                            </li>
                        )}
                    </ul>
                </div>
            )}

            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={onView}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                </Button>
            </div>
        </Card>
    );
};

const ChatInterface: React.FC<{
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}> = ({ messages, onSendMessage, isLoading }) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <div className="flex flex-col h-96">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">AI Construction Assistant</p>
                        <p className="text-sm">Ask me about safety, project optimization, cost analysis, or any construction-related questions.</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-lg ${message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    {message.type === 'ai' && <Bot className="w-4 h-4 mt-0.5 text-blue-600" />}
                                    {message.type === 'user' && <UserIcon className="w-4 h-4 mt-0.5" />}
                                    <div className="flex-1">
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        <p className="text-xs opacity-75 mt-1">
                                            {new Date(message.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-blue-600" />
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask a construction-related question..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={!inputValue.trim() || isLoading}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
};

const QuickAnalysisPanel: React.FC<{
    onAnalyze: (type: string) => void;
    projects: Project[];
    isLoading: boolean;
}> = ({ onAnalyze, projects, isLoading }) => {
    const analysisOptions = [
        {
            id: 'safety',
            title: 'Safety Analysis',
            description: 'Analyze current safety incidents and get recommendations',
            icon: Shield,
            color: 'bg-red-50 text-red-700 border-red-200'
        },
        {
            id: 'cost',
            title: 'Cost Optimization',
            description: 'Find opportunities to reduce costs and improve efficiency',
            icon: DollarSign,
            color: 'bg-green-50 text-green-700 border-green-200'
        },
        {
            id: 'project',
            title: 'Project Insights',
            description: 'Get recommendations for project optimization',
            icon: TrendingUp,
            color: 'bg-blue-50 text-blue-700 border-blue-200'
        },
        {
            id: 'schedule',
            title: 'Schedule Analysis',
            description: 'Optimize timelines and identify bottlenecks',
            icon: Clock,
            color: 'bg-purple-50 text-purple-700 border-purple-200'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisOptions.map((option) => {
                const Icon = option.icon;
                return (
                    <Card key={option.id} className={`p-4 border-2 hover:shadow-md transition-all cursor-pointer ${option.color}`}>
                        <div
                            className="flex items-start gap-3"
                            onClick={() => !isLoading && onAnalyze(option.id)}
                        >
                            <Icon className="w-6 h-6 mt-1" />
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1">{option.title}</h3>
                                <p className="text-sm opacity-80">{option.description}</p>
                                {isLoading && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span className="text-xs">Analyzing...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

export const AIAssistant: React.FC<AIAssistantProps> = ({
    user,
    addToast,
    setActiveView
}) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'analysis' | 'recommendations'>('chat');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null);
    const [showRecommendationModal, setShowRecommendationModal] = useState(false);

    useEffect(() => {
        loadProjects();
        loadInitialRecommendations();
    }, []);

    const loadProjects = async () => {
        try {
            const projectData = await api.getProjects();
            setProjects(projectData);
        } catch (error) {
            console.error('Failed to load projects:', error);
        }
    };

    const loadInitialRecommendations = async () => {
        try {
            setIsLoading(true);
            const initialRecommendations = await constructionAI.generateProjectInsights('general');
            setRecommendations(initialRecommendations);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
            addToast('Failed to load AI recommendations', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (message: string) => {
        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            type: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const aiResponse = await constructionAI.askConstructionQuestion(message, {
                userId: user.id,
                projects: projects.length,
                timestamp: new Date().toISOString()
            });

            const aiMessage: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                type: 'ai',
                content: aiResponse,
                timestamp: new Date().toISOString()
            };

            setChatMessages(prev => [...prev, aiMessage]);
            addToast('AI response generated', 'success');
        } catch (error) {
            console.error('Failed to get AI response:', error);
            addToast('Failed to get AI response', 'error');

            const errorMessage: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                type: 'ai',
                content: 'I apologize, but I encountered an error processing your question. Please try again.',
                timestamp: new Date().toISOString()
            };

            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAnalysis = async (analysisType: string) => {
        setIsLoading(true);

        try {
            let analysisResult: AIAnalysisResult | null = null;

            switch (analysisType) {
                case 'safety':
                    // Analyze safety incidents
                    const incidents = await api.getSafetyIncidents();
                    if (incidents.length > 0) {
                        analysisResult = await constructionAI.analyzeDocument(
                            JSON.stringify(incidents),
                            'safety-incidents'
                        );
                    }
                    break;

                case 'cost':
                    // Analyze expenses
                    const expenses = await api.getExpenses();
                    if (expenses.length > 0) {
                        analysisResult = await constructionAI.analyzeDocument(
                            JSON.stringify(expenses),
                            'expenses'
                        );
                    }
                    break;

                case 'project':
                    // Analyze projects
                    if (projects.length > 0) {
                        const optimization = await constructionAI.optimizeProject(projects[0]);
                        addToast('Project optimization completed', 'success');
                    }
                    break;

                case 'schedule':
                    // Analyze schedule
                    analysisResult = await constructionAI.analyzeDocument(
                        JSON.stringify(projects),
                        'project-schedules'
                    );
                    break;
            }

            if (analysisResult) {
                setRecommendations(prev => [...prev, ...analysisResult.recommendations]);
                addToast(`${analysisType} analysis completed`, 'success');
                setActiveTab('recommendations');
            }
        } catch (error) {
            console.error('Analysis failed:', error);
            addToast(`Failed to complete ${analysisType} analysis`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewRecommendation = (recommendation: AIRecommendation) => {
        setSelectedRecommendation(recommendation);
        setShowRecommendationModal(true);
    };

    const isDemoMode = constructionAI.getDemoMode();

    return (
        <div className="p-6 space-y-6">
            <ViewHeader
                title="AI Construction Assistant"
                description={isDemoMode ? "Demo mode - powered by mock AI responses" : "Powered by Google Gemini AI"}
                actions={
                    <div className="flex items-center gap-2">
                        {isDemoMode && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Demo Mode
                            </span>
                        )}
                        <Button variant="outline" onClick={loadInitialRecommendations}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                }
            />

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'chat'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('chat')}
                >
                    <Bot className="w-4 h-4 inline mr-2" />
                    AI Chat
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analysis'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('analysis')}
                >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Quick Analysis
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'recommendations'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('recommendations')}
                >
                    <Lightbulb className="w-4 h-4 inline mr-2" />
                    Recommendations ({recommendations.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
                {activeTab === 'chat' && (
                    <Card className="h-full">
                        <ChatInterface
                            messages={chatMessages}
                            onSendMessage={handleSendMessage}
                            isLoading={isLoading}
                        />
                    </Card>
                )}

                {activeTab === 'analysis' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Quick Analysis Tools</h3>
                            <QuickAnalysisPanel
                                onAnalyze={handleQuickAnalysis}
                                projects={projects}
                                isLoading={isLoading}
                            />
                        </div>

                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-blue-500" />
                                <h3 className="text-lg font-semibold">AI Capabilities</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h4 className="font-medium mb-2">✓ Safety Analysis</h4>
                                    <ul className="text-gray-600 space-y-1">
                                        <li>• Incident pattern analysis</li>
                                        <li>• Risk assessment</li>
                                        <li>• Compliance checking</li>
                                        <li>• Safety recommendations</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">✓ Project Optimization</h4>
                                    <ul className="text-gray-600 space-y-1">
                                        <li>• Cost reduction opportunities</li>
                                        <li>• Schedule optimization</li>
                                        <li>• Resource allocation</li>
                                        <li>• Quality improvements</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">✓ Document Analysis</h4>
                                    <ul className="text-gray-600 space-y-1">
                                        <li>• Contract review</li>
                                        <li>• Specification analysis</li>
                                        <li>• Compliance verification</li>
                                        <li>• Risk identification</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">✓ Expert Consultation</h4>
                                    <ul className="text-gray-600 space-y-1">
                                        <li>• Construction best practices</li>
                                        <li>• Industry standards</li>
                                        <li>• Regulatory guidance</li>
                                        <li>• Technical assistance</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'recommendations' && (
                    <div className="space-y-6">
                        {recommendations.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Run an analysis or ask the AI assistant for personalized recommendations
                                </p>
                                <Button onClick={() => setActiveTab('analysis')}>
                                    Start Analysis
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {recommendations.map((recommendation) => (
                                    <RecommendationCard
                                        key={recommendation.id}
                                        recommendation={recommendation}
                                        onView={() => handleViewRecommendation(recommendation)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recommendation Detail Modal */}
            {showRecommendationModal && selectedRecommendation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Recommendation Details</h2>
                            <Button variant="outline" onClick={() => setShowRecommendationModal(false)}>
                                ×
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">{selectedRecommendation.title}</h3>
                                <p className="text-gray-700">{selectedRecommendation.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y">
                                <div>
                                    <span className="text-sm text-gray-500">Priority</span>
                                    <p className="font-medium">{selectedRecommendation.priority}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Category</span>
                                    <p className="font-medium">{selectedRecommendation.category}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Confidence</span>
                                    <p className="font-medium">{selectedRecommendation.confidence}%</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Estimated Impact</span>
                                    <p className="font-medium">{selectedRecommendation.estimatedImpact}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-3">Action Items</h4>
                                <ul className="space-y-2">
                                    {selectedRecommendation.actionItems.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                {index + 1}
                                            </span>
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowRecommendationModal(false)}>
                                Close
                            </Button>
                            <Button onClick={() => {
                                addToast('Recommendation marked for implementation', 'success');
                                setShowRecommendationModal(false);
                            }}>
                                Mark for Implementation
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};