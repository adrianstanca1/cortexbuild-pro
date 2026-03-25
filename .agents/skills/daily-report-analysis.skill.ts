import { ISkill } from '../../../lib/ai/system/interfaces';

export interface DailyReportSkillContext {
  reportDate: string;
  projectId: string;
  weather: string;
  temperature?: string;
  humidity?: string;
  wind?: string;
  workPerformed: string[];
  workers: Array<{
    trade: string;
    count: number;
    hours: number;
  }>;
  equipment: Array<{
    name: string;
    hours: number;
    status: 'working' | 'idle' | 'maintenance' | 'broken';
  }>;
  materialsDelivered: Array<{
    description: string;
    quantity: string;
    deliveredBy: string;
  }>;
  visitors: string[];
  issues: string[];
  safetyIncidents: Array<{
    type: string;
    description: string;
    severity: 'near-miss' | 'minor' | 'major' | 'critical';
  }>;
  notes?: string;
}

export interface DailyReportSkillResult {
  success: boolean;
  reportSummary: {
    date: string;
    projectId: string;
    totalWorkers: number;
    totalManHours: number;
    workProgress: string[];
  };
  productivityAnalysis: {
    laborEfficiency: number;
    equipmentUtilization: number;
    overallProgressRating: 'below' | 'on-track' | 'above' | 'excellent';
    factors: string[];
  };
  safetyAssessment: {
    incidents: number;
    nearMisses: number;
    safetyScore: number;
    rating: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement' | 'unsatisfactory';
    observations: string[];
  };
  weatherImpact: {
    affectedWork: string[];
    delayMinutes: number;
    productivityImpact: 'none' | 'minimal' | 'moderate' | 'significant';
  };
  resourceUtilization: {
    laborByTrade: Array<{ trade: string; count: number; hours: number; utilization: number }>;
    equipmentStatus: Array<{ name: string; status: string; utilization: number }>;
    underUtilizedResources: string[];
  };
  issuesAndRisks: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolution: string;
  }>;
  recommendations: string[];
  alerts: string[];
  createdAt: string;
}

/**
 * Skill for analyzing daily construction reports
 */
export const dailyReportAnalysisSkill: ISkill<DailyReportSkillContext> = {
  id: 'daily-report-analysis',
  name: 'Daily Report Analysis',
  description: 'Analyzes daily construction reports to assess productivity, safety, and progress',
  version: '1.0.0',
  isEnabled: true,
  tags: ['daily-report', 'construction', 'productivity', 'safety', 'progress'],

  execute: async (context: DailyReportSkillContext): Promise<DailyReportSkillResult> => {
    const {
      reportDate,
      projectId,
      weather,
      temperature,
      workPerformed,
      workers,
      equipment,
      safetyIncidents,
      issues
    } = context;

    const reportSummary = generateReportSummary(reportDate, projectId, workers, workPerformed);
    const productivityAnalysis = analyzeProductivity(workers, equipment, workPerformed, weather);
    const safetyAssessment = assessSafety(safetyIncidents, workers);
    const weatherImpact = analyzeWeatherImpact(weather, temperature, workPerformed);
    const resourceUtilization = analyzeResourceUtilization(workers, equipment);
    const issuesAndRisks = analyzeIssuesAndRisks(issues, safetyIncidents, equipment);
    const recommendations = generateRecommendations(productivityAnalysis, safetyAssessment, issuesAndRisks);
    const alerts = generateAlerts(safetyIncidents, issues, equipment);

    return {
      success: true,
      reportSummary,
      productivityAnalysis,
      safetyAssessment,
      weatherImpact,
      resourceUtilization,
      issuesAndRisks,
      recommendations,
      alerts,
      createdAt: new Date().toISOString()
    };
  }
};

function generateReportSummary(
  date: string,
  projectId: string,
  workers: DailyReportSkillContext['workers'],
  workPerformed: string[]
): DailyReportSkillResult['reportSummary'] {
  const totalWorkers = workers.reduce((sum, w) => sum + w.count, 0);
  const totalManHours = workers.reduce((sum, w) => sum + (w.count * w.hours), 0);

  return {
    date,
    projectId,
    totalWorkers,
    totalManHours,
    workProgress: workPerformed.slice(0, 5)
  };
}

function analyzeProductivity(
  workers: DailyReportSkillContext['workers'],
  equipment: DailyReportSkillContext['equipment'],
  workPerformed: string[],
  weather: string
): DailyReportSkillResult['productivityAnalysis'] {
  const factors: string[] = [];
  let laborEfficiency = 85;
  let equipmentUtilization = 80;

  const totalCrewHours = workers.reduce((sum, w) => sum + (w.count * w.hours), 0);
  const productiveHours = workPerformed.length * 1.5;
  laborEfficiency = Math.min(100, Math.round((productiveHours / Math.max(1, workers.length * 8)) * 100));

  const workingEquipment = equipment.filter(e => e.status === 'working').length;
  equipmentUtilization = equipment.length > 0
    ? Math.round((workingEquipment / equipment.length) * 100)
    : 100;

  const weatherLower = weather.toLowerCase();
  if (weatherLower.includes('rain') || weatherLower.includes('storm')) {
    laborEfficiency -= 25;
    factors.push('Weather delay - rain/storm conditions');
  } else if (weatherLower.includes('cold') || weatherLower.includes('snow')) {
    laborEfficiency -= 15;
    factors.push('Weather delay - cold/snow conditions');
  } else if (weatherLower.includes('hot') || weatherLower.includes('heat')) {
    laborEfficiency -= 10;
    factors.push('Heat-related productivity reduction');
  } else if (weatherLower.includes('wind') || weatherLower.includes('windy')) {
    laborEfficiency -= 5;
    factors.push('Wind conditions affected some work');
  } else {
    factors.push('Favorable weather conditions');
  }

  if (workPerformed.length > 5) {
    laborEfficiency += 5;
    factors.push('Multiple work activities completed');
  }

  laborEfficiency = Math.min(100, Math.max(0, laborEfficiency));

  let overallProgressRating: 'below' | 'on-track' | 'above' | 'excellent' = 'on-track';
  if (laborEfficiency >= 95) overallProgressRating = 'excellent';
  else if (laborEfficiency >= 85) overallProgressRating = 'above';
  else if (laborEfficiency >= 70) overallProgressRating = 'on-track';
  else overallProgressRating = 'below';

  return { laborEfficiency, equipmentUtilization, overallProgressRating, factors };
}

function assessSafety(
  incidents: DailyReportSkillContext['safetyIncidents'],
  workers: DailyReportSkillContext['workers']
): DailyReportSkillResult['safetyAssessment'] {
  const totalWorkers = workers.reduce((sum, w) => sum + w.count, 0);
  const incidentsCount = incidents.filter(i => i.severity !== 'near-miss').length;
  const nearMissesCount = incidents.filter(i => i.severity === 'near-miss').length;

  let safetyScore = 100;
  safetyScore -= incidentsCount * 15;
  safetyScore -= nearMissesCount * 5;
  safetyScore = Math.max(0, Math.min(100, safetyScore));

  let rating: 'excellent' | 'good' | 'satisfactory' | 'needs-improvement' | 'unsatisfactory' = 'excellent';
  if (safetyScore < 50) rating = 'unsatisfactory';
  else if (safetyScore < 70) rating = 'needs-improvement';
  else if (safetyScore < 85) rating = 'satisfactory';
  else if (safetyScore < 95) rating = 'good';

  const observations: string[] = [];
  if (incidentsCount === 0 && nearMissesCount === 0) {
    observations.push('No safety incidents reported - excellent safety record');
  } else {
    if (incidentsCount > 0) {
      observations.push(`${incidentsCount} safety incident(s) require investigation`);
    }
    if (nearMissesCount > 0) {
      observations.push(`${nearMissesCount} near-miss(es) documented - good catch!`);
    }
  }

  if (totalWorkers > 50) {
    observations.push('Large crew size - maintain heightened safety awareness');
  }

  return {
    incidents: incidentsCount,
    nearMisses: nearMissesCount,
    safetyScore,
    rating,
    observations
  };
}

function analyzeWeatherImpact(
  weather: string,
  temperature: string | undefined,
  workPerformed: string[]
): DailyReportSkillResult['weatherImpact'] {
  const affectedWork: string[] = [];
  let delayMinutes = 0;
  let productivityImpact: 'none' | 'minimal' | 'moderate' | 'significant' = 'none';

  const weatherLower = weather.toLowerCase();

  if (weatherLower.includes('rain') || weatherLower.includes('storm') || weatherLower.includes('precipitation')) {
    affectedWork.push('Concrete pour (if scheduled)', 'Roofing work', 'Exterior painting');
    delayMinutes = 120;
    productivityImpact = 'significant';
  } else if (weatherLower.includes('snow') || weatherLower.includes('ice') || weatherLower.includes('freezing')) {
    affectedWork.push('All outdoor work', 'Crane operations', 'Material handling');
    delayMinutes = 180;
    productivityImpact = 'significant';
  } else if (weatherLower.includes('extreme heat') || weatherLower.includes('heat advisory')) {
    affectedWork.push('Heavy physical labor', 'Roofing', 'Hot work');
    delayMinutes = 60;
    productivityImpact = 'moderate';
  } else if (weatherLower.includes('wind') && (weatherLower.includes('high') || weatherLower.includes('strong'))) {
    affectedWork.push('Crane operations', 'Steel erection', 'Roofing');
    delayMinutes = 90;
    productivityImpact = 'moderate';
  } else if (weatherLower.includes('fog') || weatherLower.includes('dense')) {
    affectedWork.push('Crane operations', 'Vehicle movements');
    delayMinutes = 30;
    productivityImpact = 'minimal';
  }

  if (temperature) {
    const temp = parseInt(temperature);
    if (temp < 32) {
      affectedWork.push('Concrete (potential freeze risk)');
      productivityImpact = productivityImpact === 'none' ? 'minimal' : productivityImpact;
    } else if (temp > 95) {
      affectedWork.push('Extended outdoor work');
      productivityImpact = productivityImpact === 'none' ? 'minimal' : productivityImpact;
    }
  }

  if (affectedWork.length === 0 && productivityImpact === 'none') {
    affectedWork.push('No weather-related work delays');
  }

  return { affectedWork, delayMinutes, productivityImpact };
}

function analyzeResourceUtilization(
  workers: DailyReportSkillContext['workers'],
  equipment: DailyReportSkillContext['equipment']
): DailyReportSkillResult['resourceUtilization'] {
  const laborByTrade = workers.map(w => ({
    trade: w.trade,
    count: w.count,
    hours: w.hours,
    utilization: Math.round((w.hours / 8) * 100)
  }));

  const equipmentStatus = equipment.map(e => ({
    name: e.name,
    status: e.status,
    utilization: e.status === 'working' ? Math.round((e.hours / 8) * 100) : 0
  }));

  const underUtilizedResources: string[] = [];

  laborByTrade
    .filter(l => l.utilization < 60)
    .forEach(l => {
      underUtilizedResources.push(`${l.trade}: ${l.utilization}% utilization`);
    });

  equipmentStatus
    .filter(e => e.status === 'idle')
    .forEach(e => {
      underUtilizedResources.push(`${e.name}: idle`);
    });

  if (underUtilizedResources.length === 0) {
    underUtilizedResources.push('All resources properly utilized');
  }

  return { laborByTrade, equipmentStatus, underUtilizedResources };
}

function analyzeIssuesAndRisks(
  issues: string[],
  incidents: DailyReportSkillContext['safetyIncidents'],
  equipment: DailyReportSkillContext['equipment']
): DailyReportSkillResult['issuesAndRisks'] {
  const results: DailyReportSkillResult['issuesAndRisks'] = [];

  issues.forEach(issue => {
    results.push({
      issue,
      severity: 'medium' as const,
      resolution: 'Monitor and address as needed'
    });
  });

  incidents.forEach(incident => {
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let resolution = 'Investigate and implement corrective action';

    if (incident.severity === 'critical' || incident.severity === 'major') {
      severity = 'high';
      resolution = 'Immediate investigation required; stop work if needed';
    } else if (incident.severity === 'near-miss') {
      severity = 'low';
      resolution = 'Document and monitor; no immediate action required';
    }

    results.push({
      issue: `${incident.type}: ${incident.description}`,
      severity,
      resolution
    });
  });

  equipment
    .filter(e => e.status === 'broken' || e.status === 'maintenance')
    .forEach(e => {
      results.push({
        issue: `${e.name} is ${e.status}`,
        severity: 'medium' as const,
        resolution: 'Arrange repair or replacement; document downtime'
      });
    });

  if (results.length === 0) {
    results.push({
      issue: 'No significant issues or risks identified',
      severity: 'low' as const,
      resolution: 'Continue normal operations'
    });
  }

  return results.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
}

function generateRecommendations(
  productivity: DailyReportSkillResult['productivityAnalysis'],
  safety: DailyReportSkillResult['safetyAssessment'],
  issues: DailyReportSkillResult['issuesAndRisks']
): string[] {
  const recommendations: string[] = [];

  if (productivity.laborEfficiency < 75) {
    recommendations.push('Consider adjusting crew size or scheduling for next shift');
    recommendations.push('Identify bottlenecks in work flow and address');
  }

  if (safety.rating === 'needs-improvement' || safety.rating === 'unsatisfactory') {
    recommendations.push('Review safety procedures with all workers');
    recommendations.push('Increase safety observation frequency');
    recommendations.push('Consider additional safety training');
  }

  const criticalIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
  if (criticalIssues.length > 0) {
    recommendations.push('Prioritize resolution of critical/high severity issues');
    recommendations.push('Escalate to project manager if unresolved within 24 hours');
  }

  if (productivity.overallProgressRating === 'below') {
    recommendations.push('Develop catch-up plan to regain schedule');
    recommendations.push('Consider adding resources if schedule allows');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue current operations - all metrics acceptable');
  }

  return recommendations;
}

function generateAlerts(
  incidents: DailyReportSkillContext['safetyIncidents'],
  issues: string[],
  equipment: DailyReportSkillContext['equipment']
): string[] {
  const alerts: string[] = [];

  const criticalIncidents = incidents.filter(i => i.severity === 'critical' || i.severity === 'major');
  if (criticalIncidents.length > 0) {
    alerts.push(`ALERT: ${criticalIncidents.length} critical/major safety incident(s) require immediate attention!`);
  }

  const brokenEquipment = equipment.filter(e => e.status === 'broken');
  if (brokenEquipment.length > 0) {
    alerts.push(`ALERT: ${brokenEquipment.length} piece(s) of equipment out of service - ${brokenEquipment.map(e => e.name).join(', ')}`);
  }

  if (issues.some(i => i.toLowerCase().includes('delay') || i.toLowerCase().includes('stop'))) {
    alerts.push('ALERT: Potential schedule delays reported - monitor closely');
  }

  if (alerts.length === 0) {
    alerts.push('No alerts - all systems normal');
  }

  return alerts;
}
