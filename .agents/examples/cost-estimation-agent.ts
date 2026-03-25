import { BaseAgent } from '../../../lib/ai/system/base-agent';
import { costEstimationSkill } from '../../../.agents/skills/cost-estimation.skill';
import { constructionDbTool } from '../../../.agents/tools/construction-db.tool';
import { aiEnhancementPlugin } from '../../../.agents/plugins/ai-enhancement.plugin';
import { constructionDomainPlugin } from '../../../.agents/plugins/construction-domain.plugin';

/**
 * Cost Estimation Agent - Specialized agent for estimating construction project costs
 * Demonstrates how to combine skills, tools, and plugins
 */
export class CostEstimationAgent extends BaseAgent {
  constructor() {
    super(
      'cost-estimation-agent-001',
      'Cost Estimation Agent',
      'Estimates construction project costs based on scope, materials, labor, and location factors',
      '1.0.0'
    );
    
    // Add skills
    this.addSkill(costEstimationSkill);
    
    // Add tools
    this.addTool(constructionDbTool);
    
    // Add plugins
    this.addPlugin(aiEnhancementPlugin);
    this.addPlugin(constructionDomainPlugin);
  }
  
  /**
   * Execute the cost estimation workflow
   */
  public async execute(context: { 
    projectScope: string;
    location: string;
    squareFootage?: number;
    materials?: Array<{name: string; quantity: number; unit: string}>;
    laborHours?: number;
    specialty?: string;
  }): Promise<any> {
    this.status = 'busy';
    
    try {
      // Step 1: Get current material costs from database (if materials not provided)
      let materialsToUse = context.materials;
      if (!materialsToUse || materialsToUse.length === 0) {
        console.log('Fetching standard materials from database...');
        const dbResult = await this.executeTool('construction-db', {
          queryType: 'materials',
          limit: 10
        });
        
        if (dbResult.success) {
          // Convert database results to material format
          materialsToUse = dbResult.results.map((mat: any) => ({
            name: mat.name,
            quantity: 1, // Default quantity
            unit: mat.unit
          }));
        }
      }
      
      // Step 2: Get labor rates from database (if laborHours not provided)
      let laborHoursToUse = context.laborHours;
      if (!laborHoursToUse || laborHoursToUse === 0) {
        console.log('Fetching standard labor rates from database...');
        const dbResult = await this.executeTool('construction-db', {
          queryType: 'labor-rates',
          filters: { trade: 'Carpenter', level: 'Journeyman' },
          limit: 1
        });
        
        if (dbResult.success && dbResult.results.length > 0) {
          // Calculate hours based on square footage or default
          laborHoursToUse = (context.squareFootage || 1000) * 0.5; // Rough estimate: 0.5 hours per sq ft
        }
      }
      
      // Step 3: Perform cost estimation using our skill
      console.log('Calculating cost estimation...');
      const estimationResult = await this.executeSkill('cost-estimation', {
        projectScope: context.projectScope,
        location: context.location,
        squareFootage: context.squareFootage || 1000,
        materials: materialsToUse || [],
        laborHours: laborHoursToUse || 0
      });
      
      // Step 4: Enhance estimation with AI insights
      console.log('Enhancing estimation with AI...');
      const aiEnhancement = await this.executePlugin('ai-enhancement', {
        prompt: `Review this construction cost estimate and provide insights on accuracy, potential risks, and optimization opportunities:\n\n${JSON.stringify(estimationResult, null, 2)}\n\nConsider: market volatility, seasonal factors, and regional pricing variations.`,
        context: {
          ...context,
          costEstimation: estimationResult
        }
      });
      
      // Step 5: Apply construction domain knowledge
      console.log('Applying construction domain knowledge...');
      const domainEnhancement = await this.executePlugin('construction-domain', {
        queryType: 'risk-assessment',
        contextData: {
          ...context,
          costEstimation: estimationResult,
          aiInsights: aiEnhancement.response
        }
      });
      
      // Step 6: Compile final result
      const finalResult = {
        projectInfo: {
          scope: context.projectScope,
          location: context.location,
          squareFootage: context.squareFootage,
          specialty: context.specialty,
          estimatedAt: new Date().toISOString()
        },
        baseEstimation: estimationResult,
        aiEnhancement: {
          insights: aiEnhancement.response,
          confidence: aiEnhancement.confidence,
          suggestions: aiEnhancement.suggestions,
          tokensUsed: aiEnhancement.tokensUsed
        },
        domainKnowledge: domainEnhancement.result,
        costBreakdown: {
          materials: estimationResult.breakdown.materials,
          labor: estimationResult.breakdown.labor,
          overhead: estimationResult.breakdown.overhead,
          profitMargin: estimationResult.breakdown.profitMargin,
          subtotal: estimationResult.subtotal,
          total: estimationResult.total,
          perSquareFoot: estimationResult.perSquareFoot
        },
        adjustments: {
          aiConfidence: aiEnhancement.confidence,
          domainRiskLevel: domainEnhancement.result?.overallRiskLevel || 'unknown'
        },
        recommendations: [
          ...(estimationResult.breakdown.materials > 50000 ? ['Consider bulk material purchase discounts'] : []),
          ...(estimationResult.breakdown.labor > 30000 ? ['Explore labor optimization strategies'] : []),
          ...(aiEnhancement.suggestions || []),
          ...(domainEnhancement.result?.recommendations || []),
          'Review estimate with project stakeholders',
          'Create contingency plan for unexpected costs',
          'Establish change order process'
        ],
        nextSteps: [
          'Present estimate to client for approval',
          'Lock in material prices where possible',
          'Schedule regular cost reviews during project',
          'Set up change order tracking system'
        ],
        validUntil: estimationResult.validUntil,
        completedAt: new Date().toISOString(),
        agentId: this.id
      };
      
      this.status = 'completed';
      return finalResult;
    } catch (error) {
      this.status = 'error';
      console.error(`Cost Estimation Agent failed:`, error);
      throw error;
    }
  }
}

// Export instance for easy use
export const costEstimationAgent = new CostEstimationAgent();
