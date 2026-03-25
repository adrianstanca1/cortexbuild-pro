import { BaseAgent } from '../../../lib/ai/system/base-agent';
import { AgentStatus } from '../../../lib/ai/system/interfaces';
import { documentAnalysisSkill } from '../../../.agents/skills/document-analysis.skill';
import { documentReaderTool } from '../../../.agents/tools/document-reader.tool';
import { aiEnhancementPlugin } from '../../../.agents/plugins/ai-enhancement.plugin';
import { constructionDomainPlugin } from '../../../.agents/plugins/construction-domain.plugin';

/**
 * Document Analysis Agent - Specialized agent for analyzing construction documents
 * Demonstrates how to combine skills, tools, and plugins
 */
export class DocumentAnalysisAgent extends BaseAgent {
  constructor() {
    super(
      'document-analysis-agent-001',
      'Document Analysis Agent',
      'Analyzes construction documents to extract key information, identify risks, and suggest improvements',
      '1.0.0'
    );
    
    // Add skills
    this.addSkill(documentAnalysisSkill);
    
    // Add tools
    this.addTool(documentReaderTool);
    
    // Add plugins
    this.addPlugin(aiEnhancementPlugin);
    this.addPlugin(constructionDomainPlugin);
  }
  
  /**
   * Execute the document analysis workflow
   */
  public async execute(context: { 
    filePath: string;
    fileType?: string;
    specialty?: string;
    region?: string;
  }): Promise<any> {
    this.status = AgentStatus.BUSY;
    
    try {
      // Step 1: Read the document using our tool
      console.log(`Reading document: ${context.filePath}`);
      const documentResult = await this.executeTool('document-reader', {
        filePath: context.filePath,
        fileType: context.fileType
      });
      
      if (!documentResult.success) {
        throw new Error(`Failed to read document: ${documentResult.error}`);
      }
      
      // Step 2: Analyze the document using our skill
      console.log('Analyzing document content...');
      const analysisResult = await this.executeSkill('document-analysis', {
        documentContent: documentResult.content,
        documentType: documentResult.fileType || 'unknown'
      });
      
      // Step 3: Enhance analysis with AI (if plugin is enabled)
      console.log('Enhancing analysis with AI...');
      const aiEnhancement = await this.executePlugin('ai-enhancement', {
        prompt: `Analyze this construction document analysis and provide additional insights:\n\n${JSON.stringify(analysisResult, null, 2)}\n\nFocus on: potential cost implications, schedule impacts, and quality concerns.`,
        context: {
          ...context,
          documentAnalysis: analysisResult
        }
      });
      
      // Step 4: Apply construction domain knowledge (if plugin is enabled)
      console.log('Applying construction domain knowledge...');
      const domainEnhancement = await this.executePlugin('construction-domain', {
        queryType: 'best-practice',
        contextData: {
          ...context,
          documentAnalysis: analysisResult,
          aiInsights: aiEnhancement.response
        }
      });
      
      // Step 5: Compile final result
      const finalResult = {
        documentInfo: {
          filePath: context.filePath,
          fileType: documentResult.fileType,
          wordCount: documentResult.wordCount,
          readAt: documentResult.readAt
        },
        baseAnalysis: analysisResult,
        aiEnhancement: {
          insights: aiEnhancement.response,
          confidence: aiEnhancement.confidence,
          suggestions: aiEnhancement.suggestions,
          tokensUsed: aiEnhancement.tokensUsed
        },
        domainKnowledge: domainEnhancement.result,
        recommendations: [
          ...(analysisResult.suggestions || []),
          ...(aiEnhancement.suggestions || []),
          ...(domainEnhancement.result?.recommendations || []),
          'Review findings with project stakeholders',
          'Create action plan for addressing identified risks',
          'Schedule follow-up review in 1 week'
        ],
        nextSteps: [
          'Distribute analysis to project team',
          'Schedule risk review meeting',
          'Update project documentation based on findings',
          'Implement recommended safety measures'
        ],
        completedAt: new Date().toISOString(),
        agentId: this.id
      };
      
      this.status = AgentStatus.COMPLETED;
      return finalResult;
    } catch (error) {
      this.status = AgentStatus.ERROR;
      console.error(`Document Analysis Agent failed:`, error);
      throw error;
    }
  }
}

// Export instance for easy use
export const documentAnalysisAgent = new DocumentAnalysisAgent();
