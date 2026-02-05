'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ProjectHealthProps {
  projects: any[];
  tasks: any[];
  rfis: any[];
  safetyIncidents: any[];
}

type HealthStatus = 'healthy' | 'at-risk' | 'critical';

interface ProjectHealth {
  id: string;
  name: string;
  status: string;
  health: HealthStatus;
  taskCompletion: number;
  overdueTasks: number;
  openRFIs: number;
  safetyIssues: number;
  riskFactors: string[];
}

function calculateProjectHealth(project: any, tasks: any[], rfis: any[], incidents: any[]): ProjectHealth {
  const projectTasks = tasks.filter(t => t.project?.name === project.name || t.projectId === project.id);
  const projectRFIs = rfis.filter(r => r.project?.name === project.name || r.projectId === project.id);
  const projectIncidents = incidents.filter(i => i.project?.name === project.name || i.projectId === project.id);
  
  const completedTasks = projectTasks.filter(t => t.status === 'COMPLETE').length;
  const totalTasks = projectTasks.length;
  const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const overdueTasks = projectTasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETE'
  ).length;
  
  const openRFIs = projectRFIs.filter(r => r.status === 'OPEN' || r.status === 'PENDING').length;
  const criticalIncidents = projectIncidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'MAJOR').length;
  
  const riskFactors: string[] = [];
  let health: HealthStatus = 'healthy';
  
  if (overdueTasks > 3) {
    riskFactors.push(`${overdueTasks} overdue tasks`);
    health = 'at-risk';
  } else if (overdueTasks > 0) {
    riskFactors.push(`${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}`);
  }
  
  if (openRFIs > 5) {
    riskFactors.push(`${openRFIs} open RFIs`);
    health = health === 'healthy' ? 'at-risk' : health;
  }
  
  if (criticalIncidents > 0) {
    riskFactors.push(`${criticalIncidents} critical incident${criticalIncidents > 1 ? 's' : ''}`);
    health = 'critical';
  }
  
  if (taskCompletion < 30 && totalTasks > 5) {
    riskFactors.push('Low task completion');
    health = health === 'healthy' ? 'at-risk' : health;
  }
  
  if (project.status === 'ON_HOLD') {
    riskFactors.push('Project on hold');
    health = 'at-risk';
  }
  
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    health,
    taskCompletion,
    overdueTasks,
    openRFIs,
    safetyIssues: criticalIncidents,
    riskFactors
  };
}

export function ProjectHealthSummary({ projects, tasks, rfis, safetyIncidents }: ProjectHealthProps) {
  const projectHealthData = useMemo(() => {
    return projects
      .filter(p => p.status !== 'COMPLETED')
      .map(p => calculateProjectHealth(p, tasks, rfis, safetyIncidents))
      .sort((a, b) => {
        const healthOrder = { critical: 0, 'at-risk': 1, healthy: 2 };
        return healthOrder[a.health] - healthOrder[b.health];
      })
      .slice(0, 5);
  }, [projects, tasks, rfis, safetyIncidents]);

  const healthCounts = useMemo(() => {
    const counts = { healthy: 0, 'at-risk': 0, critical: 0 };
    projectHealthData.forEach(p => counts[p.health]++);
    return counts;
  }, [projectHealthData]);

  const getHealthIcon = (health: HealthStatus) => {
    switch (health) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'at-risk':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getHealthBadge = (health: HealthStatus) => {
    switch (health) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'at-risk':
        return <Badge variant="warning">At Risk</Badge>;
      default:
        return <Badge variant="success">Healthy</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Project Health Overview
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant="success" className="text-xs">{healthCounts.healthy} Healthy</Badge>
          <Badge variant="warning" className="text-xs">{healthCounts['at-risk']} At Risk</Badge>
          <Badge variant="destructive" className="text-xs">{healthCounts.critical} Critical</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projectHealthData.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getHealthIcon(project.health)}
                    <span className="font-medium text-foreground">{project.name}</span>
                  </div>
                  {getHealthBadge(project.health)}
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Task Completion</span>
                    <span>{project.taskCompletion}%</span>
                  </div>
                  <Progress value={project.taskCompletion} className="h-1.5" />
                </div>
                
                {project.riskFactors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.riskFactors.map((factor, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                        {factor}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
          
          {projectHealthData.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active projects to display</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
