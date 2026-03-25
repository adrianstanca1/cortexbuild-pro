import { BaseAgent } from '../../../lib/ai/system/base-agent';
import { safetyComplianceSkill } from '../../../.agents/skills/safety-compliance.skill';
import { constructionDbTool } from '../../../.agents/tools/construction-db.tool';
import { aiEnhancementPlugin } from '../../../.agents/plugins/ai-enhancement.plugin';
import { constructionDomainPlugin } from '../../../.agents/plugins/construction-domain.plugin';

/**
 * Safety Compliance Agent - Specialized agent for checking safety compliance
 * Demonstrates how to combine skills, tools, and plugins
 */
export class SafetyComplianceAgent extends BaseAgent {
  constructor() {
    super(
      'safety-compliance-agent-001',
      'Safety Compliance Agent',
      'Analyzes construction site conditions, equipment, and activities for OSHA and local safety compliance',
      '1.0.0'
    );
    
    // Add skills
    this.addSkill(safetyComplianceSkill);
    
    // Add tools
    this.addTool(constructionDbTool);
    
    // Add plugins
    this.addPlugin(aiEnhancementPlugin);
    this.addPlugin(constructionDomainPlugin);
  }
  
  /**
   * Execute the safety compliance workflow
   */
  public async execute(context: { 
    siteConditions: Array<string>;
    equipmentUsed: Array<string>;
    workActivities: Array<string>;
    regulations?: Array<string>;
    workforceTraining?: Array<string>;
    specialty?: string;
    location?: string;
  }): Promise<any> {
    this.status = 'busy';
    
    try {
      // Step 1: Get relevant safety regulations from database (if not provided)
      let regulationsToUse = context.regulations;
      if (!regulationsToUse || regulationsToUse.length === 0) {
        console.log('Fetching safety regulations from database...');
        const dbResult = await this.executeTool('construction-db', {
          queryType: 'regulations',
          filters: { category: 'safety' },
          limit: 10
        });
        
        if (dbResult.success) {
          regulationsToUse = dbResult.results.map((reg: any) => reg.code);
        }
      }
      
      // Step 2: Get workforce training requirements from database (if not provided)
      let trainingToUse = context.workforceTraining;
      if (!trainingToUse || trainingToUse.length === 0) {
        console.log('Fetching standard training requirements from database...');
        // In a real implementation, we might query for training databases
        // For now, we'll use some standard construction training
        trainingToUse = [
          'OSHA 10-Hour Construction',
          'Fall Protection Training',
          'Hazard Communication (HAZCOM)',
          'Personal Protective Equipment (PPE)'
        ];
      }
      
      // Step 3: Perform safety compliance check using our skill
      console.log('Performing safety compliance analysis...');
      const complianceResult = await this.executeSkill('safety-compliance', {
        siteConditions: context.siteConditions,
        equipmentUsed: context.equipmentUsed,
        workActivities: context.workActivities,
        regulations: regulationsToUse,
        workforceTraining: trainingToUse
      });
      
      // Step 4: Enhance analysis with AI insights
      console.log('Enhancing compliance analysis with AI...');
      const aiEnhancement = await this.executePlugin('ai-enhancement', {
        prompt: `Review this safety compliance report and provide insights on risk mitigation, training needs, and improvement opportunities:\n\n${JSON.stringify(complianceResult, null, 2)}\n\nFocus on: most critical violations, cost-effective fixes, and preventive measures.`,
        context: {
          ...context,
          safetyCompliance: complianceResult
        }
      });
      
      // Step 5: Apply construction domain knowledge
      console.log('Applying construction domain knowledge...');
      const domainEnhancement = await this.executePlugin('construction-domain', {
        queryType: 'best-practice',
        contextData: {
          ...context,
          complianceResult: complianceResult,
          aiInsights: aiEnhancement.response
        }
      });
      
      // Step 6: Compile final result
      const finalResult = {
        siteInfo: {
          conditions: context.siteConditions,
          equipment: context.equipmentUsed,
          activities: context.workActivities,
          specialty: context.specialty,
          location: context.location,
          analyzedAt: new Date().toISOString()
        },
        baseCompliance: complianceResult,
        aiEnhancement: {
          insights: aiEnhancement.response,
          confidence: aiEnhancement.confidence,
          suggestions: aiEnhancement.suggestions,
          tokensUsed: aiEnhancement.tokensUsed
        },
        domainKnowledge: domainEnhancement.result,
        complianceSummary: {
          status: complianceResult.complianceStatus,
          score: complianceResult.overallScore,
          violationCount: complianceResult.violations.length,
          criticalViolations: complianceResult.violations.filter((v: any) => v.severity === 'critical').length,
          highViolations: complianceResult.violations.filter((v: any) => v.severity === 'high').length
        },
        violations: complianceResult.violations,
        recommendations: [
          ...(complianceResult.complianceStatus === 'critical' ? ['IMMEDIATE ACTION REQUIRED: Stop work until critical hazards are addressed'] : []),
          ...(complianceResult.complianceStatus === 'non-compliant' ? ['Urgent: Address all high and critical violations within 24 hours'] : []),
          ...(complianceResult.recommendations || []),
          ...(aiEnhancement.suggestions || []),
          ...(domainEnhancement.result?.recommendations || []),
          'Schedule daily safety toolbox talks',
          'Implement weekly safety inspections',
          'Establish near-miss reporting system'
        ],
        trainingNeeds: [
          ...(complianceResult.trainingNeeds || []),
          ...(aiEnhancement.suggestions || []).filter((s: string) => s.toLowerCase().includes('training')),
          ...(domainEnhancement.result?.trainingNeeds || [])
        ],
        nextSteps: [
          'Address all critical violations immediately',
          'Develop corrective action plan for high priority violations',
          'Schedule follow-up safety inspection in 3 days',
          'Update site safety plan based on findings',
          'Conduct safety training for identified gaps',
          'Implement daily safety briefings'
        ],
        completedAt: new Date().toISOString(),
        agentId: this.id
      };
      
      this.status = 'completed';
      return finalResult;
    } catch (error) {
      this.status = 'error';
      console.error(`Safety Compliance Agent failed:`, error);
      throw error;
    }
  }
}

// Export instance for easy use
export const safetyComplianceAgent = new SafetyComplianceAgent();
