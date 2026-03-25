/**
 * Platform Integration Example
 * Demonstrates how to use the platform-aware AI agents
 */

import { platformAgentFactory } from '../lib/ai/factories/platform-agent-factory';
import { platformAgents } from '../lib/services/platform-agents';
import { projectDomainPlugin } from '../lib/ai/plugins/platform/project-domain.plugin';
import { financialDomainPlugin } from '../lib/ai/plugins/platform/financial-domain.plugin';
import { safetyDomainPlugin } from '../lib/ai/plugins/platform/safety-domain.plugin';

const EXAMPLE_PROJECT_ID = 'example-project-id-123';
const EXAMPLE_COMPANY_ID = 'example-company-id-456';

/**
 * Example 1: Using the Platform Agent Factory to create a custom agent
 */
async function exampleWithFactory() {
  console.log('=== Example 1: Platform Agent Factory ===');

  const projectAnalysisAgent = platformAgentFactory.createProjectAnalysisAgent({
    id: 'custom-project-analysis',
    name: 'Custom Project Analysis Agent',
    description: 'Analyzes projects using platform data',
  });

  const result = await platformAgentFactory.executeAgent(projectAnalysisAgent, {
    projectId: EXAMPLE_PROJECT_ID,
    companyId: EXAMPLE_COMPANY_ID,
    action: 'analyze',
  });

  console.log('Agent Result:', result);
}

/**
 * Example 2: Using the wrapped platform-aware agents
 */
async function exampleWithWrappedAgents() {
  console.log('\n=== Example 2: Platform-Aware Agents ===');

  const safetyResult = await platformAgents.hseSentinel(
    EXAMPLE_PROJECT_ID,
    'What are the top 3 safety risks on this project and how can we mitigate them?'
  );
  console.log('Safety Analysis:', safetyResult.output);

  const financialResult = await platformAgents.commercialGuardian(
    EXAMPLE_PROJECT_ID,
    'What is our current budget status and forecast?'
  );
  console.log('Commercial Analysis:', financialResult.output);

  const projectResult = await platformAgents.projectAssistant(
    EXAMPLE_PROJECT_ID,
    'What are the critical issues affecting this project?'
  );
  console.log('Project Analysis:', projectResult.output);
}

/**
 * Example 3: Using plugins directly for structured analysis
 */
async function exampleWithPlugins() {
  console.log('\n=== Example 3: Domain Plugins ===');

  const mockProjectData = {
    name: 'Office Building Renovation',
    budget: 500000,
    actual_cost: 325000,
    progress: 65,
    status: 'active',
    tasks: [
      { title: 'Foundation Work', status: 'completed', priority: 'high' },
      { title: 'Electrical Installation', status: 'in_progress', priority: 'high' },
      { title: 'HVAC Installation', status: 'pending', priority: 'medium' },
    ],
    rfis: [
      { title: 'Structural Steel Clarification', status: 'open', cost_impact: 15000 },
      { title: 'Fire Rating Change', status: 'pending', cost_impact: 5000 },
    ],
    changeOrders: [
      { title: 'Additional Foundation Work', cost_change: 25000, status: 'approved' },
      { title: 'Window Upgrade', cost_change: 12000, status: 'pending' },
    ],
  };

  const projectAnalysis = await projectDomainPlugin.execute({
    action: 'analyze',
    data: mockProjectData,
  });
  console.log('Project Health:', projectAnalysis.health);
  console.log('Metrics:', projectAnalysis.metrics);
  console.log('Risks:', projectAnalysis.risks);
  console.log('Recommendations:', projectAnalysis.recommendations);

  const financialAnalysis = await financialDomainPlugin.execute({
    action: 'analyze',
    data: mockProjectData,
  });
  console.log('\nFinancial Health:', financialAnalysis.healthStatus);
  console.log('Budget Utilization:', financialAnalysis.utilizationPercent + '%');

  const safetyAnalysis = await safetyDomainPlugin.execute({
    action: 'assess',
    data: mockProjectData,
  });
  console.log('\nSafety Risk:', safetyAnalysis.overallRisk);
  console.log('Safety Score:', safetyAnalysis.score);
  console.log('Safety Recommendations:', safetyAnalysis.recommendations);
}

/**
 * Example 4: Using the unified PlatformDataTool
 */
async function exampleWithPlatformDataTool() {
  console.log('\n=== Example 4: Platform Data Tool ===');

  const { platformDataTool } = await import('../lib/ai/tools/platform/platform-data-tool');

  const projects = await platformDataTool.execute({
    entity: 'projects',
    companyId: EXAMPLE_COMPANY_ID,
    limit: 10,
  });
  console.log('Projects:', projects);

  const project = await platformDataTool.execute({
    entity: 'project',
    id: EXAMPLE_PROJECT_ID,
  });
  console.log('Single Project:', project);

  const tasks = await platformDataTool.execute({
    entity: 'tasks',
    projectId: EXAMPLE_PROJECT_ID,
    status: 'in_progress',
    limit: 20,
  });
  console.log('In Progress Tasks:', tasks);

  const rfis = await platformDataTool.execute({
    entity: 'rfis',
    projectId: EXAMPLE_PROJECT_ID,
    status: 'open',
  });
  console.log('Open RFIs:', rfis);

  const summary = await platformDataTool.execute({
    entity: 'summary',
    companyId: EXAMPLE_COMPANY_ID,
  });
  console.log('Company Summary:', summary);
}

/**
 * Run all examples
 */
export async function runIntegrationExamples() {
  try {
    await exampleWithFactory();
  } catch (e) {
    console.log('Example 1 skipped (requires Supabase):', (e as Error).message);
  }

  try {
    await exampleWithWrappedAgents();
  } catch (e) {
    console.log('Example 2 skipped (requires Supabase):', (e as Error).message);
  }

  exampleWithPlugins();

  try {
    await exampleWithPlatformDataTool();
  } catch (e) {
    console.log('Example 4 skipped (requires Supabase):', (e as Error).message);
  }
}

if (require.main === module) {
  runIntegrationExamples().then(() => {
    console.log('\n=== All Examples Complete ===');
  }).catch(console.error);
}
