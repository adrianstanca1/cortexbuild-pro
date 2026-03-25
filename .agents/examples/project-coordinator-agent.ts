import { SuperAgent } from '../../../lib/ai/system/superagent';
import { CoordinationStrategy } from '../../../lib/ai/system/interfaces';
import { documentAnalysisAgent } from './document-analysis-agent';
import { costEstimationAgent } from './cost-estimation-agent';
import { safetyComplianceAgent } from './safety-compliance-agent';

/**
 * Project Coordinator Agent - Superagent that orchestrates multiple specialized agents
 * Demonstrates how to use the SuperAgent class to coordinate workflows
 */
export class ProjectCoordinatorAgent extends SuperAgent {
  constructor() {
    super(
      'project-coordinator-agent-001',
      'Project Coordinator Agent',
      'Orchestrates document analysis, cost estimation, and safety compliance agents for comprehensive project review',
      '1.0.0'
    );
    
    // Add subagents
    this.addSubagent(documentAnalysisAgent);
    this.addSubagent(costEstimationAgent);
    this.addSubagent(safetyComplianceAgent);
    
    // Set coordination strategy
    this.coordinationStrategy = CoordinationStrategy.PARALLEL;
  }
  
  /**
   * Execute the coordinated project review workflow
   */
  public async execute(context: { 
    projectId: string;
    documentPath?: string;
    projectScope: string;
    location: string;
    squareFootage?: number;
    specialty?: string;
    siteConditions?: Array<string>;
    equipmentUsed?: Array<string>;
    workActivities?: Array<string>;
  }): Promise<any> {
    this.status = 'busy';
    
    try {
      console.log(`Starting coordinated project review for project: ${context.projectId}`);
      
      // Execute all subagents in parallel
      const results = await super.execute({
        ...context,
        // Add timestamps for tracking
        workflowStartedAt: new Date().toISOString()
      });
      
      // Process results
      const documentAnalysisResult = results.find(r => r.agentId === documentAnalysisAgent.id);
      const costEstimationResult = results.find(r => r.agentId === costEstimationAgent.id);
      const safetyComplianceResult = results.find(r => r.agentId === safetyComplianceAgent.id);
      
      // Compile final coordinated result
      const finalResult = {
        projectId: context.projectId,
        workflowType: 'coordinated-project-review',
        coordinationStrategy: this.coordinationStrategy,
        startedAt: context.workflowStartedAt,
        completedAt: new Date().toISOString(),
        
        // Individual agent results
        documentAnalysis: documentAnalysisResult?.success ? documentAnalysisResult.result : {
          error: documentAnalysisResult?.error,
          success: false
        },
        costEstimation: costEstimationResult?.success ? costEstimationResult.result : {
          error: costEstimationResult?.error,
          success: false
        },
        safetyCompliance: safetyComplianceResult?.success ? safetyComplianceResult.result : {
          error: safetyComplianceResult?.error,
          success: false
        },
        
        // Integrated insights
        integratedInsights: this.generateIntegratedInsights(
          documentAnalysisResult,
          costEstimationResult,
          safetyComplianceResult
        ),
        
        // Overall project health score
        projectHealthScore: this.calculateProjectHealthScore(
          documentAnalysisResult,
          costEstimationResult,
          safetyComplianceResult
        ),
        
        // Priority recommendations
        priorityRecommendations: this.generatePriorityRecommendations(
          documentAnalysisResult,
          costEstimationResult,
          safetyComplianceResult
        ),
        
        // Next steps
        nextSteps: this.generateNextSteps(
          documentAnalysisResult,
          costEstimationResult,
          safetyComplianceResult
        ),
        
        agentId: this.id
      };
      
      this.status = 'completed';
      return finalResult;
    } catch (error) {
      this.status = 'error';
      console.error(`Project Coordinator Agent failed:`, error);
      throw error;
    }
  }
  
  /**
   * Generate integrated insights from all agent results
   */
  private generateIntegratedInsights(
    docResult: any,
    costResult: any,
    safetyResult: any
  ): any {
    const insights = {
      correlations: [],
      conflicts: [],
      recommendations: []
    };
    
    // Check for correlations between document analysis and cost estimation
    if (docResult?.success && costResult?.success) {
      const docAnalysis = docResult.result;
      const costEst = costResult.result;
      
      // Example correlation: if document mentions foundation issues, check cost impact
      if (docAnalysis.baseAnalysis?.keyTopics?.includes('foundation') && 
          costEst.baseEstimation?.total > 500000) {
        insights.correlations.push({
          type: 'document-cost',
          description: 'Document analysis indicates foundation considerations which may impact budget',
          evidence: ['Foundation mentioned in documents', 'High total project cost']
        });
      }
    }
    
    // Check for conflicts between safety compliance and other factors
    if (safetyResult?.success && costResult?.success) {
      const safety = safetyResult.result;
      const costEst = costResult.result;
      
      // Example conflict: safety violations may require additional spending
      if (safety.complianceStatus === 'critical' || safety.complianceStatus === 'non-compliant') {
        insights.conflicts.push({
          type: 'safety-budget',
          description: 'Safety compliance issues may require additional budget allocation for remediation',
          evidence: [
            `Safety status: ${safety.complianceStatus}`,
            `Violation count: ${safety.violations.length}`,
            `Estimated project cost: $${costEst.baseEstimation?.total.toLocaleString()}`
          ]
        });
      }
    }
    
    // Generate integrated recommendations
    insights.recommendations = [
      'Address safety compliance issues before proceeding with major work phases',
      'Review document findings for potential cost implications',
      'Establish integrated change control process',
      'Schedule weekly coordination meetings between project teams',
      'Implement digital document management with version control',
      'Create risk register that combines document, cost, and safety risks'
    ];
    
    return insights;
  }
  
  /**
   * Calculate overall project health score (0-100)
   */
  private calculateProjectHealthScore(
    docResult: any,
    costResult: any,
    safetyResult: any
  ): number {
    let score = 100;
    let factors = 0;
    
    // Document analysis factor (25% weight)
    if (docResult?.success) {
      factors++;
      const docScore = docResult.result.baseAnalysis?.completenessScore || 80;
      score = score - (25 - (docScore * 0.25));
    }
    
    // Cost estimation factor (25% weight)
    if (costResult?.success) {
      factors++;
      const costConfidence = costResult.result.confidenceLevel || 75;
      score = score - (25 - (costConfidence * 0.25));
    }
    
    // Safety compliance factor (25% weight)
    if (safetyResult?.success) {
      factors++;
      const safetyScore = safetyResult.result.overallScore || 80;
      score = score - (25 - (safetyScore * 0.25));
    }
    
    // Coordination factor (25% weight) - based on how many agents succeeded
    const successRate = factors / 3;
    score = score - (25 - (successRate * 25));
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Generate priority recommendations based on agent results
   */
  private generatePriorityRecommendations(
    docResult: any,
    costResult: any,
    safetyResult: any
  ): string[] {
    const priorities = [];
    
    // Critical safety issues get top priority
    if (safetyResult?.success && 
        (safetyResult.result.complianceStatus === 'critical' || 
         safetyResult.result.complianceStatus === 'non-compliant')) {
      priorities.push('🚨 CRITICAL: Address all safety violations immediately - work may need to be stopped');
    }
    
    // High-cost items from document analysis
    if (docResult?.success && 
        docResult.result.baseAnalysis?.risks?.some((r: any) => 
          r.description.toLowerCase().includes('cost') || 
          r.description.toLowerCase().includes('budget'))) {
      priorities.push('💰 HIGH: Review document-identified cost risks and develop mitigation strategies');
    }
    
    // Low confidence estimates
    if (costResult?.success && 
        (costResult.result.confidenceLevel || 100) < 60) {
      priorities.push('📊 MEDIUM: Improve cost estimate accuracy with detailed quantity takeoffs and vendor quotes');
    }
    
    // Incomplete documentation
    if (docResult?.success && 
        (docResult.result.baseAnalysis?.completenessScore || 100) < 70) {
      priorities.push('📄 MEDIUM: Enhance project documentation with missing details identified in analysis');
    }
    
    // General recommendations if no critical issues
    if (priorities.length === 0) {
      priorities.push('✅ LOW: Continue with planned project execution and regular monitoring');
      priorities.push('🔄 LOW: Schedule weekly progress reviews and bi-weekly risk assessments');
    }
    
    return priorities;
  }
  
  /**
   * Generate next steps based on agent results
   */
  private generateNextSteps(
    docResult: any,
    costResult: any,
    safetyResult: any
  ): string[] {
    const steps = [];
    
    // Immediate actions (next 24 hours)
    if (safetyResult?.success && 
        safetyResult.result.complianceStatus === 'critical') {
      steps.push('🚨 IMMEDIATE (0-24 hrs): Stop work in affected areas and address critical safety violations');
    }
    
    // Short-term actions (next week)
    steps.push('📅 SHORT-TERM (this week):');
    if (docResult?.success) {
      steps.push('  - Distribute document analysis report to project team');
    }
    if (costResult?.success) {
      steps.push('  - Review cost estimate with stakeholders and financiers');
    }
    if (safetyResult?.success) {
      steps.push('  - Develop and begin implementing safety corrective action plan');
    }
    
    // Medium-term actions (next month)
    steps.push('📅 MEDIUM-TERM (this month):');
    steps.push('  - Implement document management system with version control');
    steps.push('  - Establish regular cost tracking and variance reporting');
    steps.push('  - Schedule monthly safety training sessions');
    steps.push('  - Set up change order tracking and approval process');
    
    // Long-term actions (ongoing)
    steps.push('📅 LONG-TERM (ongoing):');
    steps.push('  - Continue daily safety briefings and weekly toolbox talks');
    steps.push('  - Maintain updated project documentation');
    steps.push('  - Monitor cost variances and implement corrective actions as needed');
    steps.push('  - Conduct quarterly comprehensive project reviews');
    
    return steps;
  }
}

// Export instance for easy use
export const projectCoordinatorAgent = new ProjectCoordinatorAgent();
