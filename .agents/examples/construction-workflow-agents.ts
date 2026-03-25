import { BaseAgent } from '../../lib/ai/system/base-agent';
import { SuperAgent } from '../../lib/ai/system/superagent';
import { CoordinationStrategy, AgentStatus } from '../../lib/ai/system/interfaces';
import { rfiAnalysisSkill } from '../skills/rfi-analysis.skill';
import { submittalAnalysisSkill } from '../skills/submittal-analysis.skill';
import { dailyReportAnalysisSkill } from '../skills/daily-report-analysis.skill';
import { safetyComplianceSkill } from '../skills/safety-compliance.skill';
import { notificationTool, alertTool } from '../tools/notification.tool';
import { hseSentinelBridge, commercialGuardianBridge, documentProcessorBridge } from '../plugins/ai-agent-bridge.plugin';

export class RFICoordinatorAgent extends BaseAgent {
  constructor() {
    super(
      'rfi-coordinator-agent',
      'RFI Coordinator Agent',
      'Coordinates RFI analysis across multiple agents including HSE, Commercial, and Document Processing',
      '1.0.0'
    );

    this.addSkill(rfiAnalysisSkill);
    this.addPlugin(hseSentinelBridge);
    this.addPlugin(commercialGuardianBridge);
    this.addPlugin(documentProcessorBridge);
  }

  public async execute(context: any): Promise<any> {
    this.status = AgentStatus.BUSY;

    try {
      const rfiData = context.rfiData;
      console.log(`[RFI-Coordinator] Processing RFI: ${rfiData.subject}`);

      const rfiAnalysis = await this.executeSkill('rfi-analysis', {
        rfiSubject: rfiData.subject,
        rfiDescription: rfiData.description,
        trade: rfiData.trade,
        priority: rfiData.priority,
        location: rfiData.location,
        drawings: rfiData.drawings,
        specifications: rfiData.specifications,
        projectType: rfiData.projectType
      });

      const safetyReview = await this.executePlugin('hse-sentinel-bridge', {
        prompt: `Review this RFI for safety implications: ${rfiData.description}`,
        contextData: { rfiData, rfiAnalysis }
      });

      const commercialReview = await this.executePlugin('commercial-guardian-bridge', {
        prompt: `Analyze commercial impact of this RFI: ${rfiData.description}`,
        contextData: { rfiData, rfiAnalysis }
      });

      const aggregatedResults = {
        rfiAnalysis,
        safetyReview,
        commercialReview,
        recommendations: this.combineRecommendations(rfiAnalysis, safetyReview, commercialReview),
        priority: this.determinePriority(rfiAnalysis, safetyReview),
        estimatedResponse: this.calculateEstimatedResponse(rfiAnalysis, safetyReview),
        completedAt: new Date().toISOString()
      };

      this.status = AgentStatus.COMPLETED;
      return aggregatedResults;
    } catch (error) {
      this.status = AgentStatus.ERROR;
      throw error;
    }
  }

  private combineRecommendations(rfi: any, safety: any, commercial: any): string[] {
    const recommendations: string[] = [];

    if (rfi.recommendations) {
      recommendations.push(...rfi.recommendations.slice(0, 3));
    }

    if (safety.output?.recommendations) {
      recommendations.push(...safety.output.recommendations.slice(0, 2));
    }

    if (commercial.output?.recommendations) {
      recommendations.push(...commercial.output.recommendations.slice(0, 2));
    }

    return [...new Set(recommendations)].slice(0, 8);
  }

  private determinePriority(rfi: any, safety: any): string {
    if (safety.output?.confidence && safety.output.confidence > 0.8) {
      return 'HIGH - Safety implications detected';
    }
    return rfi.rfiAnalysis?.priority || 'MEDIUM';
  }

  private calculateEstimatedResponse(rfi: any, safety: any): string {
    if (safety.output?.confidence && safety.output.confidence > 0.8) {
      return '48-72 hours - expedited due to safety review';
    }
    return rfi.scheduleImpact?.delayRisk === 'high'
      ? '5-7 business days'
      : '7-14 business days';
  }
}

export class DailyReportCoordinatorAgent extends BaseAgent {
  constructor() {
    super(
      'daily-report-coordinator-agent',
      'Daily Report Coordinator Agent',
      'Coordinates daily report analysis including productivity, safety, and resource utilization',
      '1.0.0'
    );

    this.addSkill(dailyReportAnalysisSkill);
    this.addSkill(safetyComplianceSkill);
    this.addPlugin(hseSentinelBridge);
    this.addTool(alertTool);
  }

  public async execute(context: any): Promise<any> {
    this.status = AgentStatus.BUSY;

    try {
      const reportData = context.reportData;
      console.log(`[DailyReport-Coordinator] Processing daily report for: ${reportData.reportDate}`);

      const reportAnalysis = await this.executeSkill('daily-report-analysis', {
        reportDate: reportData.reportDate,
        projectId: reportData.projectId,
        weather: reportData.weather,
        temperature: reportData.temperature,
        workPerformed: reportData.workPerformed,
        workers: reportData.workers,
        equipment: reportData.equipment,
        materialsDelivered: reportData.materialsDelivered,
        visitors: reportData.visitors,
        issues: reportData.issues,
        safetyIncidents: reportData.safetyIncidents,
        notes: reportData.notes
      });

      const safetyReview = await this.executeSkill('safety-compliance', {
        siteConditions: reportData.workPerformed,
        equipmentUsed: reportData.equipment.map((e: any) => e.name),
        workActivities: reportData.workPerformed,
        specialty: 'commercial',
        location: reportData.location || 'Unknown'
      });

      if (reportAnalysis.safetyAssessment.incidents > 0 || reportAnalysis.alerts.some((a: string) => a.includes('ALERT'))) {
        const alert = await this.executeTool('alert', {
          alertType: 'safety',
          severity: reportAnalysis.safetyAssessment.rating === 'unsatisfactory' ? 'critical' : 'warning',
          projectId: reportData.projectId,
          title: 'Safety Alert - Daily Report',
          message: `${reportAnalysis.safetyAssessment.incidents} incident(s) reported. Safety Score: ${reportAnalysis.safetyAssessment.safetyScore}`,
          recipients: reportData.projectManager ? [reportData.projectManager] : []
        });
        console.log(`[DailyReport-Coordinator] Safety alert sent: ${alert.alertId}`);
      }

      const aggregatedResults = {
        reportAnalysis,
        safetyReview,
        recommendations: this.combineReportRecommendations(reportAnalysis, safetyReview),
        alerts: reportAnalysis.alerts,
        dailySummary: this.generateDailySummary(reportAnalysis),
        completedAt: new Date().toISOString()
      };

      this.status = AgentStatus.COMPLETED;
      return aggregatedResults;
    } catch (error) {
      this.status = AgentStatus.ERROR;
      throw error;
    }
  }

  private combineReportRecommendations(report: any, safety: any): string[] {
    const recommendations: string[] = [];

    if (report.recommendations) {
      recommendations.push(...report.recommendations.slice(0, 4));
    }

    if (safety.safetyRecommendations) {
      recommendations.push(...safety.safetyRecommendations.slice(0, 2));
    }

    return [...new Set(recommendations)].slice(0, 6);
  }

  private generateDailySummary(report: any): string {
    const { totalWorkers, totalManHours } = report.reportSummary;
    const { laborEfficiency, overallProgressRating } = report.productivityAnalysis;
    const { safetyScore, rating: safetyRating } = report.safetyAssessment;

    return `Day Summary: ${totalWorkers} workers, ${totalManHours} man-hours. ` +
      `Labor efficiency: ${laborEfficiency}% (${overallProgressRating}). ` +
      `Safety score: ${safetyScore}/100 (${safetyRating}). ` +
      `${report.issuesAndRisks.filter((i: any) => i.severity === 'high' || i.severity === 'critical').length} critical issues identified.`;
  }
}

export class ProjectReviewSuperAgent extends SuperAgent {
  constructor() {
    super(
      'project-review-superagent',
      'Project Review SuperAgent',
      'Orchestrates multiple specialized agents to perform comprehensive project reviews',
      '1.0.0'
    );

    this.coordinationStrategy = CoordinationStrategy.PIPELINE;

    const rfiCoordinator = new RFICoordinatorAgent();
    const dailyReportCoordinator = new DailyReportCoordinatorAgent();

    this.addSubagent(rfiCoordinator);
    this.addSubagent(dailyReportCoordinator);
  }

  public async execute(context: any): Promise<any> {
    console.log('[ProjectReview-SuperAgent] Starting comprehensive project review');

    const results = await super.execute(context);

    const aggregatedReview = {
      projectId: context.projectId,
      reviewDate: new Date().toISOString(),
      rfiSummary: this.summarizeRFIs(results[0]?.successfulResults || []),
      dailyReportSummary: this.summarizeDailyReports(results[1]?.successfulResults || []),
      overallProjectHealth: this.calculateOverallHealth(results),
      keyRisks: this.identifyKeyRisks(results),
      priorityActions: this.determinePriorityActions(results),
      completedAt: new Date().toISOString()
    };

    return aggregatedReview;
  }

  private summarizeRFIs(rfiResults: any[]): any {
    if (!rfiResults || rfiResults.length === 0) {
      return { total: 0, highPriority: 0, averageImpact: 'N/A' };
    }

    const rfiData = rfiResults[0]?.result?.rfiAnalysis;

    return {
      total: 1,
      highPriority: rfiData?.priority === 'high' || rfiData?.priority === 'critical' ? 1 : 0,
      averageImpact: rfiData?.scheduleImpact?.delayRisk || 'unknown',
      categories: rfiData?.category || 'unknown'
    };
  }

  private summarizeDailyReports(reportResults: any[]): any {
    if (!reportResults || reportResults.length === 0) {
      return { total: 0, averageProductivity: 0, safetyScore: 0 };
    }

    const reportData = reportResults[0]?.result?.reportAnalysis;

    return {
      total: 1,
      averageProductivity: reportData?.productivityAnalysis?.laborEfficiency || 0,
      safetyScore: reportData?.safetyAssessment?.safetyScore || 0,
      totalWorkers: reportData?.reportSummary?.totalWorkers || 0
    };
  }

  private calculateOverallHealth(results: any[]): string {
    const healthScores: number[] = [];

    results.forEach(result => {
      if (result.success && result.result) {
        const safetyScore = result.result.safetyAssessment?.safetyScore ||
          result.result.rfiAnalysis?.completenessScore ||
          80;
        healthScores.push(safetyScore);
      }
    });

    if (healthScores.length === 0) return 'UNKNOWN';

    const avgHealth = healthScores.reduce((a, b) => a + b, 0) / healthScores.length;

    if (avgHealth >= 85) return 'EXCELLENT';
    if (avgHealth >= 70) return 'GOOD';
    if (avgHealth >= 50) return 'FAIR';
    return 'POOR';
  }

  private identifyKeyRisks(results: any[]): string[] {
    const risks: string[] = [];

    results.forEach(result => {
      if (result.result) {
        const rfiRisks = result.result.rfiAnalysis?.riskFactors
          ?.filter((r: any) => r.severity === 'high')
          .map((r: any) => `RFI: ${r.factor}`) || [];

        const reportRisks = result.result.issuesAndRisks
          ?.filter((i: any) => i.severity === 'high' || i.severity === 'critical')
          .map((i: any) => `Report: ${i.issue}`) || [];

        risks.push(...rfiRisks, ...reportRisks);
      }
    });

    return [...new Set(risks)].slice(0, 5);
  }

  private determinePriorityActions(results: any[]): string[] {
    const actions: string[] = [];

    results.forEach(result => {
      if (result.result) {
        const recommendations = result.result.recommendations || [];
        const alerts = result.result.alerts?.filter((a: string) => a.includes('ALERT')) || [];

        actions.push(...recommendations.slice(0, 2));
        if (alerts.length > 0) {
          actions.push(`URGENT: ${alerts[0]}`);
        }
      }
    });

    return [...new Set(actions)].slice(0, 5);
  }
}

export const rfiCoordinatorAgent = new RFICoordinatorAgent();
export const dailyReportCoordinatorAgent = new DailyReportCoordinatorAgent();
export const projectReviewSuperAgent = new ProjectReviewSuperAgent();
