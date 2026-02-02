'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, Shield, Target, Zap, ChevronRight, Calendar, BarChart3,
  Loader2, AlertCircle, Activity, Gauge, Flame, Award, PoundSterling,
  FileQuestion, Package, Users, HardHat
} from 'lucide-react';

interface ProjectHealthData {
  id: string;
  name: string;
  status: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  _count?: {
    tasks?: number;
    rfis?: number;
    changeOrders?: number;
    safetyIncidents?: number;
    defects?: number;
    punchLists?: number;
  };
  tasks?: Array<{ status: string; priority: string; dueDate?: string }>;
  rfis?: Array<{ status: string; createdAt: string; dueDate?: string }>;
  changeOrders?: Array<{ status: string; costChange: number }>;
  costItems?: Array<{ actualCost: number; estimatedCost: number }>;
  milestones?: Array<{ status: string; targetDate: string; percentComplete: number }>;
  safetyIncidents?: Array<{ severity: string; status: string }>;
}

interface PortfolioInsight {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  category: string;
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  metric?: string;
  action?: string;
  href?: string;
}

interface PortfolioMetrics {
  overallHealthScore: number;
  projectsAtRisk: number;
  projectsOnTrack: number;
  totalOverdueTasks: number;
  totalCriticalIssues: number;
  budgetHealth: number;
  scheduleHealth: number;
  safetyScore: number;
  insights: PortfolioInsight[];
}

function calculatePortfolioMetrics(
  projects: ProjectHealthData[],
  constructionMetrics: any
): PortfolioMetrics {
  const insights: PortfolioInsight[] = [];
  let totalHealthScore = 0;
  let projectsAtRisk = 0;
  let projectsOnTrack = 0;
  let totalOverdueTasks = 0;
  let totalCriticalIssues = 0;
  
  // Analyze each project
  projects.forEach(project => {
    let projectHealth = 100;
    const tasks = project.tasks || [];
    
    // Count overdue tasks
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'COMPLETE') return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    
    totalOverdueTasks += overdueTasks;
    
    if (overdueTasks > 5) {
      projectHealth -= 15;
      insights.push({
        id: `overdue-${project.id}`,
        type: 'warning',
        category: 'schedule',
        title: `${overdueTasks} Overdue Tasks`,
        description: `${project.name} has significant task delays`,
        projectId: project.id,
        projectName: project.name,
        metric: `${overdueTasks} tasks`,
        href: `/projects/${project.id}`
      });
    }
    
    // Check safety incidents
    const criticalIncidents = (project.safetyIncidents || []).filter(
      s => s.severity === 'CRITICAL' || s.severity === 'HIGH'
    ).length;
    
    if (criticalIncidents > 0) {
      projectHealth -= 20;
      totalCriticalIssues += criticalIncidents;
      insights.push({
        id: `safety-${project.id}`,
        type: 'critical',
        category: 'safety',
        title: 'Critical Safety Alert',
        description: `${project.name} has ${criticalIncidents} high-severity incident(s)`,
        projectId: project.id,
        projectName: project.name,
        metric: `${criticalIncidents} critical`,
        href: `/projects/${project.id}?tab=safety`
      });
    }
    
    // Check budget
    const costItems = project.costItems || [];
    const totalEstimated = costItems.reduce((acc, c) => acc + (c.estimatedCost || 0), 0);
    const totalActual = costItems.reduce((acc, c) => acc + (c.actualCost || 0), 0);
    const costVariance = totalEstimated > 0 ? ((totalActual - totalEstimated) / totalEstimated) * 100 : 0;
    
    if (costVariance > 15) {
      projectHealth -= 15;
      insights.push({
        id: `budget-${project.id}`,
        type: 'critical',
        category: 'budget',
        title: 'Budget Overrun',
        description: `${project.name} is ${costVariance.toFixed(1)}% over budget`,
        projectId: project.id,
        projectName: project.name,
        metric: `+${costVariance.toFixed(1)}%`,
        href: `/projects/${project.id}?tab=budget`
      });
    }
    
    // Determine project risk status
    if (projectHealth < 70) {
      projectsAtRisk++;
    } else {
      projectsOnTrack++;
    }
    
    totalHealthScore += projectHealth;
  });
  
  // Calculate overall health
  const overallHealth = projects.length > 0 
    ? Math.round(totalHealthScore / projects.length) 
    : 100;
  
  // Add portfolio-level insights from construction metrics
  if (constructionMetrics?.overdueRFIs > 3) {
    insights.push({
      id: 'portfolio-rfis',
      type: 'warning',
      category: 'documentation',
      title: 'RFI Backlog Alert',
      description: `${constructionMetrics.overdueRFIs} RFIs are past their response deadline across your portfolio`,
      metric: `${constructionMetrics.overdueRFIs} overdue`,
      href: '/rfis'
    });
  }
  
  if (constructionMetrics?.failedInspections > 0) {
    insights.push({
      id: 'portfolio-inspections',
      type: 'warning',
      category: 'quality',
      title: 'Failed Inspections',
      description: `${constructionMetrics.failedInspections} inspection(s) require re-work and follow-up`,
      metric: `${constructionMetrics.failedInspections} failed`,
      href: '/inspections'
    });
  }
  
  // Add positive insights
  if (projectsOnTrack > projectsAtRisk && projects.length > 0) {
    insights.push({
      id: 'portfolio-healthy',
      type: 'success',
      category: 'overall',
      title: 'Portfolio Performing Well',
      description: `${projectsOnTrack} of ${projects.length} projects are on track`,
      metric: `${Math.round((projectsOnTrack / projects.length) * 100)}% healthy`
    });
  }
  
  if (constructionMetrics?.safetyIncidentsThisMonth === 0) {
    insights.push({
      id: 'portfolio-safety',
      type: 'success',
      category: 'safety',
      title: 'Zero Safety Incidents',
      description: 'No safety incidents reported in the past 30 days',
      metric: '30 days'  
    });
  }
  
  // Calculate category health scores
  const safetyScore = constructionMetrics?.criticalIncidents === 0 && 
    constructionMetrics?.safetyIncidentsThisMonth < 2 ? 95 : 
    constructionMetrics?.criticalIncidents > 0 ? 50 : 75;
    
  const scheduleHealth = totalOverdueTasks === 0 ? 95 :
    totalOverdueTasks < 5 ? 80 :
    totalOverdueTasks < 10 ? 65 : 45;
    
  const budgetHealth = constructionMetrics?.pendingChangeOrders === 0 ? 95 :
    constructionMetrics?.pendingChangeOrders < 3 ? 80 : 65;
  
  return {
    overallHealthScore: Math.max(0, Math.min(100, overallHealth)),
    projectsAtRisk,
    projectsOnTrack,
    totalOverdueTasks,
    totalCriticalIssues,
    budgetHealth,
    scheduleHealth,
    safetyScore,
    insights: insights.sort((a, b) => {
      const priority = { critical: 0, warning: 1, info: 2, success: 3 };
      return priority[a.type] - priority[b.type];
    }).slice(0, 6)
  };
}

interface PortfolioIntelligenceProps {
  projects: ProjectHealthData[];
  constructionMetrics?: any;
  compact?: boolean;
}

export function PortfolioIntelligence({ 
  projects, 
  constructionMetrics,
  compact = false 
}: PortfolioIntelligenceProps) {
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  
  const metrics = useMemo(() => 
    calculatePortfolioMetrics(projects, constructionMetrics),
    [projects, constructionMetrics]
  );
  
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);
  
  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 dark:text-emerald-300';
    if (score >= 70) return 'text-amber-700 dark:text-amber-300';
    if (score >= 50) return 'text-orange-700 dark:text-orange-300';
    return 'text-red-700 dark:text-red-300';
  };
  
  const getHealthGradient = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-green-600';
    if (score >= 70) return 'from-amber-500 to-yellow-600';
    if (score >= 50) return 'from-orange-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };
  
  const getHealthBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'bg-amber-500/10 border-amber-500/20';
    if (score >= 50) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };
  
  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'critical': return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'warning': return 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10';
      case 'success': return 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10';
      default: return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default: return <Zap className="h-4 w-4 text-blue-500" />;
    }
  };
  
  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-xl" />
            <Brain className="h-10 w-10 text-primary animate-pulse relative" />
          </div>
          <p className="text-sm text-muted-foreground mt-4">Analyzing portfolio data...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (compact) {
    return (
      <div className={`flex items-center gap-4 p-4 rounded-xl border ${getHealthBg(metrics.overallHealthScore)}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${getHealthGradient(metrics.overallHealthScore)}`}>
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className={`text-2xl font-bold ${getHealthColor(metrics.overallHealthScore)}`}>
              {metrics.overallHealthScore}
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Portfolio Health</p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{metrics.projectsOnTrack}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">On Track</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{metrics.projectsAtRisk}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">At Risk</p>
          </div>
        </div>
        {metrics.insights.filter(i => i.type === 'critical' || i.type === 'warning').length > 0 && (
          <Badge variant="outline" className="text-amber-700 dark:text-amber-300 border-amber-400 dark:border-amber-600 font-medium">
            {metrics.insights.filter(i => i.type === 'critical' || i.type === 'warning').length} alerts
          </Badge>
        )}
      </div>
    );
  }
  
  return (
    <Card className="border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
      <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-700/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-purple-600">
              <Brain className="h-4 w-4 text-white" />
            </div>
            Portfolio Intelligence
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-white dark:bg-slate-700 border-primary/30 text-primary font-medium">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Health Score & Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Overall Health Score */}
          <div className={`col-span-2 md:col-span-1 p-4 rounded-xl border ${getHealthBg(metrics.overallHealthScore)} text-center`}>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-slate-200 dark:text-slate-600"
                />
                <circle
                  cx="40" cy="40" r="35"
                  fill="none"
                  stroke="url(#healthGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${metrics.overallHealthScore * 2.2} 999`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" className={metrics.overallHealthScore >= 70 ? 'stop-color: #10b981' : 'stop-color: #f59e0b'} style={{stopColor: metrics.overallHealthScore >= 70 ? '#10b981' : '#f59e0b'}} />
                    <stop offset="100%" className={metrics.overallHealthScore >= 70 ? 'stop-color: #059669' : 'stop-color: #d97706'} style={{stopColor: metrics.overallHealthScore >= 70 ? '#059669' : '#d97706'}} />
                  </linearGradient>
                </defs>
              </svg>
              <span className={`absolute text-2xl font-bold ${getHealthColor(metrics.overallHealthScore)}`}>
                {metrics.overallHealthScore}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-semibold">Overall Health</p>
          </div>
          
          {/* Schedule Health */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-700 dark:text-blue-300" />
              <span className={`text-xl font-bold ${metrics.scheduleHealth >= 70 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}>
                {metrics.scheduleHealth}%
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Schedule</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{metrics.totalOverdueTasks} overdue tasks</p>
          </div>
          
          {/* Budget Health */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <PoundSterling className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {metrics.budgetHealth}%
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Budget</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Within tolerance</p>
          </div>
          
          {/* Safety Score */}
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-purple-700 dark:text-purple-300" />
              <span className={`text-xl font-bold ${metrics.safetyScore >= 70 ? 'text-purple-700 dark:text-purple-300' : 'text-red-700 dark:text-red-300'}`}>
                {metrics.safetyScore}%
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Safety</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{metrics.totalCriticalIssues} critical issues</p>
          </div>
        </div>
        
        {/* Project Status Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-800 dark:text-slate-100">
                <strong>{metrics.projectsOnTrack}</strong> On Track
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-800 dark:text-slate-100">
                <strong>{metrics.projectsAtRisk}</strong> At Risk
              </span>
            </div>
          </div>
          <Link href="/projects" className="text-sm text-primary hover:text-primary/80 font-semibold flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        {/* AI Insights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              AI Insights & Recommendations
            </h4>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              {metrics.insights.length} insights generated
            </span>
          </div>
          
          <div className="space-y-2">
            {(expanded ? metrics.insights : metrics.insights.slice(0, 3)).map((insight) => (
              <div
                key={insight.id}
                className={`p-3 rounded-lg border-l-4 ${getInsightStyle(insight.type)} transition-all hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {insight.title}
                      </span>
                      {insight.metric && (
                        <Badge variant="outline" className="text-xs shrink-0 font-medium text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500">
                          {insight.metric}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">{insight.description}</p>
                    {insight.href && (
                      <Link 
                        href={insight.href}
                        className="text-xs text-primary hover:text-primary/80 mt-1 inline-flex items-center gap-1 font-semibold"
                      >
                        View Details <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {metrics.insights.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs font-medium"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show Less' : `Show ${metrics.insights.length - 3} More Insights`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Export a mini health indicator for use in project cards
export function ProjectHealthIndicator({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-emerald-500' :
    score >= 70 ? 'bg-amber-500' :
    score >= 50 ? 'bg-orange-500' : 'bg-red-500';
    
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-medium">{score}</span>
    </div>
  );
}
