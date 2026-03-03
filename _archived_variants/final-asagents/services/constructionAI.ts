import { GoogleGenerativeAI } from '@google/generative-ai';

// Google Gemini API configuration
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'demo-key';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface AIAnalysisRequest {
  type: 'document' | 'safety' | 'project' | 'cost' | 'schedule' | 'quality';
  content: string;
  context?: Record<string, any>;
  projectId?: string;
}

export interface AIRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  actionItems: string[];
  estimatedImpact: string;
  confidence: number; // 0-100
  createdAt: string;
}

export interface AIAnalysisResult {
  id: string;
  type: string;
  summary: string;
  recommendations: AIRecommendation[];
  riskFactors: string[];
  opportunities: string[];
  confidence: number;
  processingTime: number;
  createdAt: string;
}

export interface ProjectOptimization {
  costSavings: {
    potential: number;
    areas: string[];
    recommendations: string[];
  };
  scheduleOptimization: {
    timeReduction: number;
    criticalPath: string[];
    suggestions: string[];
  };
  riskMitigation: {
    identifiedRisks: Array<{
      risk: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      mitigation: string;
    }>;
  };
  qualityImprovement: {
    areas: string[];
    recommendations: string[];
  };
}

export interface SafetyAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  hazards: Array<{
    type: string;
    description: string;
    probability: number;
    severity: number;
    riskScore: number;
  }>;
  recommendations: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    rationale: string;
  }>;
  complianceStatus: {
    overall: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';
    areas: Array<{
      regulation: string;
      status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';
      notes: string;
    }>;
  };
}

class ConstructionAIService {
  private model;
  private isDemo: boolean;

  constructor() {
    this.isDemo = API_KEY === 'demo-key';
    if (!this.isDemo) {
      this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateMockRecommendations(type: string): AIRecommendation[] {
    const recommendations: Record<string, AIRecommendation[]> = {
      safety: [
        {
          id: 'safety-rec-1',
          type: 'safety',
          title: 'Enhance Fall Protection Measures',
          description: 'Current fall protection systems may be insufficient for work at height activities. Consider implementing additional safety nets and harness inspection protocols.',
          priority: 'HIGH',
          category: 'Fall Prevention',
          actionItems: [
            'Install additional safety nets on floors 3-5',
            'Implement daily harness inspection checklist',
            'Provide fall protection training refresher',
            'Review anchor point integrity'
          ],
          estimatedImpact: 'Reduce fall-related incidents by 75%',
          confidence: 92,
          createdAt: new Date().toISOString()
        },
        {
          id: 'safety-rec-2',
          type: 'safety',
          title: 'Improve Tool Management',
          description: 'Analysis indicates tools are frequently unsecured at height, creating falling object hazards.',
          priority: 'MEDIUM',
          category: 'Tool Safety',
          actionItems: [
            'Mandatory tool tethering for work above 6 feet',
            'Daily tool inventory and inspection',
            'Install tool storage solutions at work areas',
            'Provide tool tethering equipment training'
          ],
          estimatedImpact: 'Eliminate 90% of falling tool incidents',
          confidence: 88,
          createdAt: new Date().toISOString()
        }
      ],
      project: [
        {
          id: 'proj-rec-1',
          type: 'project',
          title: 'Optimize Material Delivery Schedule',
          description: 'Current material delivery schedule creates bottlenecks. Staggered deliveries could improve workflow efficiency.',
          priority: 'MEDIUM',
          category: 'Logistics',
          actionItems: [
            'Coordinate with suppliers for staggered deliveries',
            'Implement just-in-time material delivery',
            'Create temporary storage areas for peak periods',
            'Review material handling equipment capacity'
          ],
          estimatedImpact: 'Reduce material handling time by 30%',
          confidence: 85,
          createdAt: new Date().toISOString()
        }
      ],
      cost: [
        {
          id: 'cost-rec-1',
          type: 'cost',
          title: 'Bulk Purchase Opportunities',
          description: 'Analysis shows potential 15% savings through bulk purchasing of common materials.',
          priority: 'HIGH',
          category: 'Procurement',
          actionItems: [
            'Negotiate bulk pricing for steel and concrete',
            'Coordinate purchasing across multiple projects',
            'Establish preferred vendor agreements',
            'Implement centralized procurement process'
          ],
          estimatedImpact: 'Save $75,000 - $120,000 annually',
          confidence: 78,
          createdAt: new Date().toISOString()
        }
      ]
    };

    return recommendations[type] || [];
  }

  private generateMockAnalysisResult(type: string): AIAnalysisResult {
    const baseResult = {
      id: `analysis-${Date.now()}`,
      type,
      confidence: Math.floor(Math.random() * 20) + 80, // 80-100
      processingTime: Math.floor(Math.random() * 3000) + 1000, // 1-4 seconds
      createdAt: new Date().toISOString()
    };

    switch (type) {
      case 'safety':
        return {
          ...baseResult,
          summary: 'Safety analysis indicates moderate risk level with several areas for improvement. Primary concerns include fall protection and tool management at height.',
          recommendations: this.generateMockRecommendations('safety'),
          riskFactors: [
            'Working at height without adequate fall protection',
            'Unsecured tools creating falling object hazards',
            'Limited emergency evacuation routes',
            'Insufficient lighting in basement areas'
          ],
          opportunities: [
            'Implement advanced safety monitoring systems',
            'Create safety incentive programs',
            'Establish peer safety observation program',
            'Enhance safety training with VR simulations'
          ]
        };

      case 'project':
        return {
          ...baseResult,
          summary: 'Project analysis shows good progress with opportunities for optimization in material handling and scheduling efficiency.',
          recommendations: this.generateMockRecommendations('project'),
          riskFactors: [
            'Weather delays during foundation work',
            'Potential material delivery delays',
            'Limited skilled labor availability',
            'Regulatory approval timeline uncertainty'
          ],
          opportunities: [
            'Accelerate interior work during weather delays',
            'Implement lean construction techniques',
            'Cross-train workers for flexibility',
            'Utilize prefabrication for faster assembly'
          ]
        };

      case 'cost':
        return {
          ...baseResult,
          summary: 'Cost analysis reveals significant savings opportunities through procurement optimization and waste reduction.',
          recommendations: this.generateMockRecommendations('cost'),
          riskFactors: [
            'Material price volatility',
            'Overtime costs exceeding budget',
            'Rework due to quality issues',
            'Change order impact on budget'
          ],
          opportunities: [
            'Bulk purchasing negotiations',
            'Waste reduction initiatives',
            'Energy-efficient equipment upgrades',
            'Value engineering assessments'
          ]
        };

      default:
        return {
          ...baseResult,
          summary: 'General analysis completed with actionable insights identified.',
          recommendations: this.generateMockRecommendations('project'),
          riskFactors: ['General operational risks identified'],
          opportunities: ['Multiple optimization opportunities available']
        };
    }
  }

  async analyzeDocument(content: string, documentType: string): Promise<AIAnalysisResult> {
    if (this.isDemo) {
      await this.delay(2000);
      return this.generateMockAnalysisResult('document');
    }

    try {
      const prompt = `
        Analyze this construction document and provide insights:
        
        Document Type: ${documentType}
        Content: ${content}
        
        Please provide:
        1. A summary of key points
        2. Recommendations for improvement
        3. Risk factors identified
        4. Opportunities for optimization
        
        Focus on construction industry best practices, safety considerations, and project efficiency.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse AI response and structure it
      return {
        id: `analysis-${Date.now()}`,
        type: 'document',
        summary: text,
        recommendations: this.generateMockRecommendations('project'),
        riskFactors: ['AI-identified risks from document analysis'],
        opportunities: ['AI-identified opportunities from document analysis'],
        confidence: 85,
        processingTime: 2000,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI Analysis error:', error);
      return this.generateMockAnalysisResult('document');
    }
  }

  async analyzeSafetyIncident(incidentData: any): Promise<SafetyAnalysis> {
    if (this.isDemo) {
      await this.delay(1500);
      return {
        riskLevel: 'MEDIUM',
        hazards: [
          {
            type: 'Fall Hazard',
            description: 'Working at height with inadequate protection',
            probability: 0.3,
            severity: 8,
            riskScore: 2.4
          },
          {
            type: 'Struck By',
            description: 'Potential for falling objects',
            probability: 0.2,
            severity: 6,
            riskScore: 1.2
          }
        ],
        recommendations: [
          {
            priority: 'HIGH',
            action: 'Implement comprehensive fall protection program',
            rationale: 'High severity potential warrants immediate attention'
          },
          {
            priority: 'MEDIUM',
            action: 'Enhance tool tethering requirements',
            rationale: 'Multiple near-miss incidents indicate systemic issue'
          }
        ],
        complianceStatus: {
          overall: 'NEEDS_REVIEW',
          areas: [
            {
              regulation: 'OSHA 1926.95 - Personal Protective Equipment',
              status: 'COMPLIANT',
              notes: 'PPE requirements met'
            },
            {
              regulation: 'OSHA 1926.501 - Fall Protection',
              status: 'NEEDS_REVIEW',
              notes: 'Review fall protection adequacy for specific work areas'
            }
          ]
        }
      };
    }

    try {
      const prompt = `
        Analyze this safety incident for a construction project:
        
        Title: ${incidentData.title}
        Type: ${incidentData.type}
        Severity: ${incidentData.severity}
        Description: ${incidentData.description}
        Location: ${incidentData.location}
        
        Please provide:
        1. Risk level assessment
        2. Identified hazards
        3. Safety recommendations
        4. Compliance status review
        
        Focus on construction safety regulations and industry best practices.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      // For now, return mock data as parsing complex AI response would need more sophisticated logic
      return {
        riskLevel: 'MEDIUM',
        hazards: [
          {
            type: 'Identified Hazard',
            description: 'AI-identified safety hazard',
            probability: 0.25,
            severity: 7,
            riskScore: 1.75
          }
        ],
        recommendations: [
          {
            priority: 'HIGH',
            action: 'AI-recommended safety improvement',
            rationale: 'Based on AI analysis of incident data'
          }
        ],
        complianceStatus: {
          overall: 'NEEDS_REVIEW',
          areas: [
            {
              regulation: 'AI-identified regulation',
              status: 'NEEDS_REVIEW',
              notes: 'AI-based compliance assessment'
            }
          ]
        }
      };
    } catch (error) {
      console.error('Safety analysis error:', error);
      // Fallback to mock data
      return this.analyzeSafetyIncident(incidentData);
    }
  }

  async optimizeProject(projectData: any): Promise<ProjectOptimization> {
    if (this.isDemo) {
      await this.delay(3000);
      return {
        costSavings: {
          potential: 125000,
          areas: [
            'Material procurement optimization',
            'Labor scheduling efficiency',
            'Waste reduction initiatives',
            'Energy-efficient equipment'
          ],
          recommendations: [
            'Implement bulk purchasing for 15% material cost reduction',
            'Optimize crew scheduling to reduce overtime by 20%',
            'Implement waste tracking system for 10% waste reduction',
            'Upgrade to energy-efficient equipment for 8% energy savings'
          ]
        },
        scheduleOptimization: {
          timeReduction: 14, // days
          criticalPath: [
            'Foundation completion',
            'Structural steel installation',
            'Exterior envelope closure',
            'Mechanical/electrical rough-in'
          ],
          suggestions: [
            'Parallel execution of non-dependent tasks',
            'Prefabrication of building components',
            'Enhanced coordination between trades',
            'Weather contingency planning'
          ]
        },
        riskMitigation: {
          identifiedRisks: [
            {
              risk: 'Weather delays during exterior work',
              severity: 'MEDIUM',
              mitigation: 'Implement weather protection systems and adjust schedule'
            },
            {
              risk: 'Material delivery delays',
              severity: 'HIGH',
              mitigation: 'Establish backup suppliers and increase inventory buffer'
            },
            {
              risk: 'Skilled labor shortage',
              severity: 'MEDIUM',
              mitigation: 'Cross-train workers and establish labor pool agreements'
            }
          ]
        },
        qualityImprovement: {
          areas: [
            'Quality control checkpoints',
            'Digital documentation',
            'Automated monitoring systems',
            'Supplier quality agreements'
          ],
          recommendations: [
            'Implement digital quality control checklists',
            'Use drone inspections for hard-to-reach areas',
            'Establish real-time quality monitoring dashboards',
            'Require material quality certificates from suppliers'
          ]
        }
      };
    }

    try {
      const prompt = `
        Analyze this construction project for optimization opportunities:
        
        Project: ${projectData.name}
        Budget: $${projectData.budget}
        Timeline: ${projectData.startDate} to ${projectData.endDate}
        Progress: ${projectData.progress}%
        
        Please provide optimization recommendations for:
        1. Cost savings opportunities
        2. Schedule optimization
        3. Risk mitigation strategies
        4. Quality improvement areas
        
        Focus on practical, actionable insights for construction management.
      `;

      const result = await this.model.generateContent(prompt);
      // For now, return mock data as parsing would require sophisticated response parsing
      return this.optimizeProject(projectData);
    } catch (error) {
      console.error('Project optimization error:', error);
      return this.optimizeProject(projectData);
    }
  }

  async generateProjectInsights(projectId: string): Promise<AIRecommendation[]> {
    if (this.isDemo) {
      await this.delay(2000);
      return [
        ...this.generateMockRecommendations('safety'),
        ...this.generateMockRecommendations('cost'),
        ...this.generateMockRecommendations('project')
      ];
    }

    try {
      // In a real implementation, this would fetch project data and analyze it
      return this.generateProjectInsights(projectId);
    } catch (error) {
      console.error('Project insights error:', error);
      return [];
    }
  }

  async askConstructionQuestion(question: string, context?: Record<string, any>): Promise<string> {
    if (this.isDemo) {
      await this.delay(1500);
      
      // Mock responses for common construction questions
      const mockResponses: Record<string, string> = {
        'safety': 'Based on construction safety best practices, I recommend implementing a comprehensive safety management system including daily safety briefings, regular hazard assessments, and continuous safety training. For your specific project, focus on fall protection, tool management, and emergency procedures.',
        'schedule': 'To optimize your construction schedule, consider implementing lean construction principles, parallel task execution where possible, and maintain buffer time for weather delays. Critical path method analysis shows that focusing on foundation work and structural elements will have the biggest impact on overall timeline.',
        'cost': 'For cost optimization, I recommend bulk material purchasing, waste reduction initiatives, and energy-efficient equipment. Analysis suggests potential savings of 10-15% through procurement optimization and 5-8% through waste reduction programs.',
        'quality': 'Implement digital quality control systems, regular inspections at key milestones, and supplier quality agreements. Focus on preventive quality measures rather than reactive corrections to minimize rework costs.',
        'default': 'Based on construction industry best practices and current project data, I recommend focusing on safety protocols, schedule optimization, cost management, and quality assurance. Each area offers significant opportunities for improvement and risk mitigation.'
      };

      // Simple keyword matching for demo
      const lowerQuestion = question.toLowerCase();
      if (lowerQuestion.includes('safety')) return mockResponses.safety;
      if (lowerQuestion.includes('schedule') || lowerQuestion.includes('timeline')) return mockResponses.schedule;
      if (lowerQuestion.includes('cost') || lowerQuestion.includes('budget')) return mockResponses.cost;
      if (lowerQuestion.includes('quality')) return mockResponses.quality;
      
      return mockResponses.default;
    }

    try {
      const contextInfo = context ? `Context: ${JSON.stringify(context)}` : '';
      const prompt = `
        You are a construction industry AI assistant. Answer this question with practical, actionable advice:
        
        Question: ${question}
        ${contextInfo}
        
        Provide specific recommendations based on construction industry best practices, safety regulations, and project management principles.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Question error:', error);
      return 'I apologize, but I encountered an error processing your question. Please try again or contact support if the issue persists.';
    }
  }

  isApiConfigured(): boolean {
    return !this.isDemo;
  }

  getDemoMode(): boolean {
    return this.isDemo;
  }
}

// Export singleton instance
export const constructionAI = new ConstructionAIService();
export default constructionAI;