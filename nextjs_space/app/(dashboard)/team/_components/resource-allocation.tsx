'use client';

import { useState, useEffect } from 'react';
import {  Card, CardContent, CardTitle , CardHeader, CardTitle } from '@/components/ui/card'';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Users, Clock, Briefcase, TrendingUp, TrendingDown,
  Loader2, RefreshCw, BarChart3, User
} from 'lucide-react';

interface ResourceData {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  jobTitle?: string;
  projectCount: number;
  projects: Array<{ id: string; name: string; status: string; role?: string }>;
  hoursLast30Days: number;
  activeTasks: number;
  criticalTasks: number;
  utilizationRate: number;
}

export function ResourceAllocation() {
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'utilization' | 'tasks' | 'name'>('utilization');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/analytics?type=resource-allocation');
      const data = await res.json();
      setResources(data.allocation || []);
    } catch {
      console.error('Failed to fetch resource allocation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sortedResources = [...resources].sort((a, b) => {
    switch (sortBy) {
      case 'utilization': return b.utilizationRate - a.utilizationRate;
      case 'tasks': return b.activeTasks - a.activeTasks;
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  const getUtilizationColor = (rate: number) => {
    if (rate >= 100) return 'text-red-600';
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-gray-500';
  };

  const getUtilizationBadge = (rate: number) => {
    if (rate >= 100) return { label: 'Overloaded', variant: 'destructive' as const };
    if (rate >= 80) return { label: 'Optimal', variant: 'success' as const };
    if (rate >= 50) return { label: 'Moderate', variant: 'warning' as const };
    return { label: 'Available', variant: 'secondary' as const };
  };

  // Calculate team summary
  const teamSummary = {
    totalMembers: resources.length,
    overloaded: resources.filter(r => r.utilizationRate >= 100).length,
    optimal: resources.filter(r => r.utilizationRate >= 80 && r.utilizationRate < 100).length,
    available: resources.filter(r => r.utilizationRate < 50).length,
    avgUtilization: resources.length > 0 
      ? Math.round(resources.reduce((acc, r) => acc + r.utilizationRate, 0) / resources.length)
      : 0,
    totalHours: resources.reduce((acc, r) => acc + r.hoursLast30Days, 0),
    criticalTasks: resources.reduce((acc, r) => acc + r.criticalTasks, 0)
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Utilization</p>
                <p className={`text-2xl font-bold ${getUtilizationColor(teamSummary.avgUtilization)}`}>
                  {teamSummary.avgUtilization}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours (30d)</p>
                <p className="text-2xl font-bold">{teamSummary.totalHours.toFixed(0)}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overloaded</p>
                <p className="text-2xl font-bold text-red-600">{teamSummary.overloaded}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Tasks</p>
                <p className="text-2xl font-bold text-orange-600">{teamSummary.criticalTasks}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resource Allocation
            </CardTitle>
            <div className="flex items-center gap-2">
              <select 
                className="text-sm border rounded-md px-2 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="utilization">Sort by Utilization</option>
                <option value="tasks">Sort by Tasks</option>
                <option value="name">Sort by Name</option>
              </select>
              <Button variant="ghost" size="icon" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedResources.map((resource) => {
              const utilBadge = getUtilizationBadge(resource.utilizationRate);
              return (
                <div
                  key={resource.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {resource.avatarUrl ? (
                        <img
                          src={resource.avatarUrl}
                          alt={resource.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{resource.name}</h3>
                        <Badge variant={utilBadge.variant}>{utilBadge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {resource.jobTitle || 'Team Member'}
                      </p>
                      
                      {/* Projects */}
                      {resource.projects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {resource.projects.slice(0, 3).map((project) => (
                            <Badge key={project.id} variant="outline" className="text-xs">
                              {project.name}
                            </Badge>
                          ))}
                          {resource.projects.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{resource.projects.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="flex-shrink-0 text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm text-muted-foreground">Utilization</span>
                        <span className={`font-bold ${getUtilizationColor(resource.utilizationRate)}`}>
                          {Math.round(resource.utilizationRate)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, resource.utilizationRate)} 
                        className="w-24 h-2" 
                      />
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <div className="mt-3 pt-3 border-t flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{resource.projectCount} projects</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{resource.hoursLast30Days.toFixed(0)}h logged</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {resource.activeTasks > 0 ? (
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-gray-400" />
                      )}
                      <span>{resource.activeTasks} active tasks</span>
                    </div>
                    {resource.criticalTasks > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-orange-600">{resource.criticalTasks} critical</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sortedResources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No team members found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
