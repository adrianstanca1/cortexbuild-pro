'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Zap,
  BarChart3,
  ArrowRight,
  Sparkles,
  Brain,
  Scale,
  Activity
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeId?: string;
  assignee?: { id: string; name: string };
  dueDate?: string;
}

interface TeamMember {
  id: string;
  name?: string;
  user?: { id: string; name: string };
  role: string;
  jobTitle?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  tasks?: Task[];
  team?: { userId: string }[];
}

interface ResourceIntelligenceProps {
  teamMembers: TeamMember[];
  projects: Project[];
  tasks?: Task[];
  compact?: boolean;
}

interface WorkloadAnalysis {
  memberId: string;
  memberName: string;
  role: string;
  taskCount: number;
  completedTasks: number;
  overdueTasks: number;
  workloadScore: number; // 0-100
  efficiency: number; // 0-100
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation?: string;
}

export function ResourceIntelligence({ teamMembers, projects, tasks = [], compact = false }: ResourceIntelligenceProps) {
  const [showDetails, setShowDetails] = useState(false);

  const analysis = useMemo(() => {
    const now = new Date();
    const allTasks = tasks.length > 0 ? tasks : projects.flatMap(p => p.tasks || []);

    const workloadAnalysis: WorkloadAnalysis[] = teamMembers.map(member => {
      const memberId = member.user?.id || member.id;
      const memberName = member.user?.name || member.name || 'Unknown';
      
      // Find tasks assigned to this member
      const memberTasks = allTasks.filter(t => {
        const assigneeId = t.assignee?.id || t.assigneeId;
        return assigneeId === memberId;
      });

      const completedTasks = memberTasks.filter(t => 
        t.status === 'COMPLETED' || t.status === 'DONE'
      ).length;

      const overdueTasks = memberTasks.filter(t => {
        if (!t.dueDate || t.status === 'COMPLETED' || t.status === 'DONE') return false;
        return new Date(t.dueDate) < now;
      }).length;

      const activeTasks = memberTasks.filter(t => 
        t.status !== 'COMPLETED' && t.status !== 'DONE'
      ).length;

      // Calculate workload score (higher = more loaded)
      const baseWorkload = activeTasks * 15;
      const overdueImpact = overdueTasks * 25;
      const highPriorityImpact = memberTasks.filter(t => 
        t.priority === 'HIGH' || t.priority === 'CRITICAL'
      ).length * 10;
      const workloadScore = Math.min(100, baseWorkload + overdueImpact + highPriorityImpact);

      // Calculate efficiency
      const totalAssigned = memberTasks.length;
      const efficiency = totalAssigned > 0 
        ? Math.round((completedTasks / totalAssigned) * 100)
        : 50; // Default for no tasks

      // Determine trend (simulated based on workload)
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (overdueTasks > 2) trend = 'increasing';
      else if (efficiency > 70 && overdueTasks === 0) trend = 'decreasing';

      // Generate recommendation
      let recommendation: string | undefined;
      if (workloadScore > 80) {
        recommendation = 'Consider redistributing tasks or extending deadlines';
      } else if (workloadScore < 30 && activeTasks < 3) {
        recommendation = 'Available capacity for additional assignments';
      } else if (overdueTasks > 0) {
        recommendation = `Address ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''} immediately`;
      }

      return {
        memberId,
        memberName,
        role: member.role || member.jobTitle || 'Team Member',
        taskCount: activeTasks,
        completedTasks,
        overdueTasks,
        workloadScore,
        efficiency,
        trend,
        recommendation
      };
    });

    // Sort by workload (highest first)
    return workloadAnalysis.sort((a, b) => b.workloadScore - a.workloadScore);
  }, [teamMembers, projects, tasks]);

  const summary = useMemo(() => {
    const overloaded = analysis.filter(a => a.workloadScore > 75).length;
    const optimal = analysis.filter(a => a.workloadScore >= 30 && a.workloadScore <= 75).length;
    const underutilized = analysis.filter(a => a.workloadScore < 30).length;
    const avgEfficiency = analysis.length > 0
      ? Math.round(analysis.reduce((sum, a) => sum + a.efficiency, 0) / analysis.length)
      : 0;
    const totalOverdue = analysis.reduce((sum, a) => sum + a.overdueTasks, 0);

    return { overloaded, optimal, underutilized, avgEfficiency, totalOverdue };
  }, [analysis]);

  const getWorkloadColor = (score: number) => {
    if (score > 75) return 'bg-red-500';
    if (score > 50) return 'bg-amber-500';
    if (score > 25) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getWorkloadLabel = (score: number) => {
    if (score > 75) return { text: 'Overloaded', color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30' };
    if (score > 50) return { text: 'High', color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30' };
    if (score > 25) return { text: 'Optimal', color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30' };
    return { text: 'Available', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  if (compact) {
    return (
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Resource Intelligence
            <Badge className="ml-auto bg-white/20 text-white border-0">
              <Brain className="h-3 w-3 mr-1" /> AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
              <UserX className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{summary.overloaded}</p>
              <p className="text-xs text-red-600 dark:text-red-400">Overloaded</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
              <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{summary.optimal}</p>
              <p className="text-xs text-green-600 dark:text-green-400">Optimal</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{summary.avgEfficiency}%</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Efficiency</p>
            </div>
          </div>

          {/* Top 3 Members */}
          <div className="space-y-2">
            {analysis.slice(0, 3).map(member => {
              const workloadInfo = getWorkloadLabel(member.workloadScore);
              return (
                <div key={member.memberId} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                    {member.memberName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{member.memberName}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={member.workloadScore} className="h-1.5 flex-1" />
                      <span className="text-xs text-slate-500">{member.workloadScore}%</span>
                    </div>
                  </div>
                  <Badge className={`text-xs ${workloadInfo.color}`}>{workloadInfo.text}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Resource Intelligence</h3>
            <p className="text-sm text-white/80 font-normal">Team workload & capacity optimization</p>
          </div>
          <Badge className="ml-auto bg-white/20 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" /> AI Analysis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Summary Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 rounded-xl text-center">
            <UserX className="h-6 w-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.overloaded}</p>
            <p className="text-sm text-red-600 dark:text-red-400">Overloaded</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 rounded-xl text-center">
            <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.optimal}</p>
            <p className="text-sm text-green-600 dark:text-green-400">Optimal Load</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 rounded-xl text-center">
            <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summary.underutilized}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Available</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 rounded-xl text-center">
            <Target className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{summary.avgEfficiency}%</p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Avg Efficiency</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 rounded-xl text-center">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{summary.totalOverdue}</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">Overdue Tasks</p>
          </div>
        </div>

        {/* AI Recommendation */}
        {summary.overloaded > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-1">AI Optimization Suggestion</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {summary.overloaded} team member{summary.overloaded > 1 ? 's are' : ' is'} overloaded while {summary.underutilized} ha{summary.underutilized !== 1 ? 've' : 's'} available capacity. 
                  Consider redistributing {Math.min(5, summary.totalOverdue)} task{summary.totalOverdue !== 1 ? 's' : ''} to balance workload.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Team Members List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Team Workload Analysis</h4>
            <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          {analysis.map(member => {
            const workloadInfo = getWorkloadLabel(member.workloadScore);
            return (
              <div key={member.memberId} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                    {member.memberName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-slate-800 dark:text-slate-200">{member.memberName}</h5>
                      <Badge variant="outline" className="text-xs">{member.role}</Badge>
                      <Badge className={`text-xs ${workloadInfo.color}`}>{workloadInfo.text}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {member.taskCount} active
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        {member.completedTasks} completed
                      </span>
                      {member.overdueTasks > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          {member.overdueTasks} overdue
                        </span>
                      )}
                      {getTrendIcon(member.trend)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Workload</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{member.workloadScore}%</span>
                    </div>
                    <Progress value={member.workloadScore} className={`h-2 w-24 ${getWorkloadColor(member.workloadScore)}`} />
                  </div>
                </div>

                {showDetails && member.recommendation && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="text-slate-700 dark:text-slate-300">{member.recommendation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
