'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  FileText,
  Zap,
  ChevronRight,
  X,
  Lightbulb,
  Eye,
  BarChart3,
  Flame,
  ThumbsUp,
  ArrowRight
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignee?: { name: string };
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  budget: number;
  actualCost?: number;
  endDate: string;
  tasks?: Task[];
  _count?: {
    tasks?: number;
    rfis?: number;
    issues?: number;
  };
}

interface TeamMember {
  id: string;
  name?: string;
  user?: { name: string };
  role: string;
}

interface SmartAlertsProps {
  projects: Project[];
  tasks?: Task[];
  teamMembers?: TeamMember[];
  compact?: boolean;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success' | 'opportunity';
  category: 'schedule' | 'budget' | 'safety' | 'resource' | 'quality' | 'milestone';
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
  timestamp: Date;
  dismissed?: boolean;
  priority: number;
}

export function SmartAlerts({ projects, tasks = [], teamMembers = [], compact = false }: SmartAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const alerts = useMemo(() => {
    const results: Alert[] = [];
    const now = new Date();
    let alertId = 0;

    // Analyze tasks for overdue items
    const allTasks = tasks.length > 0 ? tasks : projects.flatMap(p => p.tasks || []);
    const overdueTasks = allTasks.filter(t => {
      if (!t.dueDate || t.status === 'COMPLETED' || t.status === 'DONE') return false;
      return new Date(t.dueDate) < now;
    });

    if (overdueTasks.length > 0) {
      results.push({
        id: `alert-${alertId++}`,
        type: overdueTasks.length > 5 ? 'critical' : 'warning',
        category: 'schedule',
        title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''} Require Attention`,
        description: `Critical tasks are past their due dates. The oldest overdue task is ${overdueTasks.length > 0 ? `"${overdueTasks[0].title}"` : 'unassigned'}. Immediate action recommended.`,
        action: '/tasks?status=overdue',
        actionLabel: 'Review Tasks',
        timestamp: now,
        priority: overdueTasks.length > 5 ? 100 : 80
      });
    }

    // Tasks due today
    const dueTodayTasks = allTasks.filter(t => {
      if (!t.dueDate || t.status === 'COMPLETED' || t.status === 'DONE') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate.toDateString() === now.toDateString();
    });

    if (dueTodayTasks.length > 0) {
      results.push({
        id: `alert-${alertId++}`,
        type: 'warning',
        category: 'schedule',
        title: `${dueTodayTasks.length} Task${dueTodayTasks.length > 1 ? 's' : ''} Due Today`,
        description: `Focus on completing today's deliverables to maintain schedule. High priority items should be addressed first.`,
        action: '/tasks?due=today',
        actionLabel: 'View Today\'s Tasks',
        timestamp: now,
        priority: 75
      });
    }

    // Project deadline analysis
    projects.forEach(project => {
      const endDate = new Date(project.endDate);
      const daysUntilDeadline = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Project deadline approaching
      if (daysUntilDeadline <= 7 && daysUntilDeadline > 0 && project.progress < 90) {
        results.push({
          id: `alert-${alertId++}`,
          type: 'warning',
          category: 'milestone',
          title: `"${project.name}" Deadline in ${daysUntilDeadline} Day${daysUntilDeadline > 1 ? 's' : ''}`,
          description: `Project is at ${project.progress}% completion with deadline approaching. ${90 - project.progress}% remaining work needs acceleration.`,
          action: `/projects/${project.id}`,
          actionLabel: 'View Project',
          timestamp: now,
          priority: 85 - daysUntilDeadline
        });
      }

      // Project passed deadline
      if (daysUntilDeadline < 0 && project.status !== 'COMPLETED') {
        results.push({
          id: `alert-${alertId++}`,
          type: 'critical',
          category: 'schedule',
          title: `"${project.name}" Past Deadline`,
          description: `Project was due ${Math.abs(daysUntilDeadline)} days ago and is at ${project.progress}% completion. Timeline review urgently needed.`,
          action: `/projects/${project.id}`,
          actionLabel: 'Review Project',
          timestamp: now,
          priority: 95
        });
      }

      // Budget warnings
      const spent = project.actualCost || (project.budget * (project.progress / 100) * 1.1);
      const expectedSpend = project.budget * (project.progress / 100);
      const budgetVariance = ((spent - expectedSpend) / project.budget) * 100;

      if (budgetVariance > 15) {
        results.push({
          id: `alert-${alertId++}`,
          type: 'warning',
          category: 'budget',
          title: `Budget Alert: "${project.name}"`,
          description: `Project is ${Math.round(budgetVariance)}% over budget at current progress level. Review spending and identify cost savings.`,
          action: `/projects/${project.id}?tab=budget`,
          actionLabel: 'Review Budget',
          timestamp: now,
          priority: 70 + Math.min(25, budgetVariance)
        });
      }
    });

    // Resource optimization opportunities
    const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE');
    if (activeProjects.length > 0 && teamMembers.length > 0) {
      const avgProjectsPerMember = activeProjects.length / teamMembers.length;
      if (avgProjectsPerMember > 2) {
        results.push({
          id: `alert-${alertId++}`,
          type: 'info',
          category: 'resource',
          title: 'Team Capacity Review Recommended',
          description: `High project-to-team ratio detected (${activeProjects.length} projects, ${teamMembers.length} members). Consider workload redistribution.`,
          action: '/team',
          actionLabel: 'View Team',
          timestamp: now,
          priority: 50
        });
      }
    }

    // Success alerts
    const completedRecently = projects.filter(p => {
      if (p.status !== 'COMPLETED') return false;
      return true; // In real app, check completion date
    });

    if (completedRecently.length > 0) {
      results.push({
        id: `alert-${alertId++}`,
        type: 'success',
        category: 'milestone',
        title: 'Project Milestone Achieved!',
        description: `Congratulations! ${completedRecently.length} project${completedRecently.length > 1 ? 's have' : ' has'} been completed successfully.`,
        timestamp: now,
        priority: 30
      });
    }

    // Opportunity alerts based on positive trends
    const aheadOfSchedule = projects.filter(p => {
      const endDate = new Date(p.endDate);
      const startDate = new Date(p.endDate);
      startDate.setMonth(startDate.getMonth() - 3); // Assume 3 month project
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
      return p.progress > expectedProgress + 10;
    });

    if (aheadOfSchedule.length > 0) {
      results.push({
        id: `alert-${alertId++}`,
        type: 'opportunity',
        category: 'schedule',
        title: 'Early Completion Opportunity',
        description: `${aheadOfSchedule.length} project${aheadOfSchedule.length > 1 ? 's are' : ' is'} ahead of schedule. Consider accelerating milestones or reallocating resources.`,
        timestamp: now,
        priority: 40
      });
    }

    // Sort by priority (highest first)
    return results.sort((a, b) => b.priority - a.priority);
  }, [projects, tasks, teamMembers]);

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <Flame className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'success': return <CheckCircle2 className="h-5 w-5" />;
      case 'opportunity': return <Lightbulb className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'warning': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'success': return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'opportunity': return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800';
      default: return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    }
  };

  const getIconStyles = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50';
      case 'warning': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50';
      case 'success': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50';
      case 'opportunity': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50';
      default: return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'schedule': return <Calendar className="h-3 w-3" />;
      case 'budget': return <DollarSign className="h-3 w-3" />;
      case 'safety': return <Shield className="h-3 w-3" />;
      case 'resource': return <Users className="h-3 w-3" />;
      case 'quality': return <CheckCircle2 className="h-3 w-3" />;
      case 'milestone': return <TrendingUp className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const dismissAlert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlerts(prev => new Set([...prev, id]));
  };

  if (compact) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Smart Alerts
            {visibleAlerts.length > 0 && (
              <Badge className="ml-auto bg-white/20 text-white border-0">
                {visibleAlerts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {visibleAlerts.length === 0 ? (
            <div className="text-center py-4">
              <ThumbsUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-slate-600 dark:text-slate-400">All clear! No alerts at this time.</p>
            </div>
          ) : (
            visibleAlerts.slice(0, 4).map(alert => (
              <div
                key={alert.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${getAlertStyles(alert.type)} cursor-pointer transition-all hover:shadow-md`}
                onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
              >
                <div className={`p-2 rounded-lg ${getIconStyles(alert.type)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{alert.title}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    {getCategoryIcon(alert.category)}
                    <span className="capitalize">{alert.category}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => dismissAlert(alert.id, e)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Smart Alerts & Insights</h3>
            <p className="text-sm text-white/80 font-normal">AI-generated actionable notifications</p>
          </div>
          {visibleAlerts.length > 0 && (
            <Badge className="ml-auto bg-white text-orange-600 border-0 text-lg px-3">
              {visibleAlerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {visibleAlerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">All Systems Healthy</h4>
            <p className="text-slate-600 dark:text-slate-400">No critical alerts at this time. Keep up the great work!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border-2 transition-all ${getAlertStyles(alert.type)} ${
                  expandedAlert === alert.id ? 'shadow-lg' : 'hover:shadow-md'
                }`}
              >
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                >
                  <div className={`p-3 rounded-xl ${getIconStyles(alert.type)}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200">{alert.title}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {getCategoryIcon(alert.category)}
                        <span className="ml-1">{alert.category}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{alert.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${expandedAlert === alert.id ? 'rotate-90' : ''}`} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => dismissAlert(alert.id, e)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedAlert === alert.id && alert.action && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <Button
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      onClick={() => window.location.href = alert.action!}
                    >
                      {alert.actionLabel || 'Take Action'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
