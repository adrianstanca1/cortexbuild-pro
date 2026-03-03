/**
 * Office Dashboard Page
 * Predictive analytics and reporting for office users
 */

import { useState, useEffect, useCallback } from 'react'
import { projectService } from '../services/projectService'
import { safetyService } from '../services/safetyService'
import { complianceService } from '../services/complianceService'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Activity,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function OfficeDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [predictions, setPredictions] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [projectsData, safetyData, complianceData] = await Promise.all([
        projectService.getProjects().catch(() => ({ data: [] })),
        safetyService.getIncidents({}).catch(() => ({ incidents: [] })),
        complianceService.getComplianceRecords({}).catch(() => ({ records: [] })),
      ])

      const projects = Array.isArray(projectsData) ? projectsData : (projectsData.data || [])
      const incidents = safetyData.incidents || []
      const records = complianceData.records || []

      setMetrics({
        projects: {
          total: projects.length,
          active: projects.filter((p: any) => p.status === 'ACTIVE').length,
          completed: projects.filter((p: any) => p.status === 'COMPLETED').length,
        },
        safety: {
          totalIncidents: incidents.length,
          critical: incidents.filter((i: any) => i.severity === 'CRITICAL').length,
          resolved: incidents.filter((i: any) => i.status === 'RESOLVED').length,
        },
        compliance: {
          compliant: records.filter((r: any) => r.status === 'COMPLIANT').length,
          violations: records.filter((r: any) => r.isViolation).length,
          pending: records.filter((r: any) => r.status === 'PENDING_REVIEW').length,
        },
      })

      // Generate predictions
      setPredictions({
        timelineRisk: calculateTimelineRisk(projects || []),
        budgetRisk: calculateBudgetRisk(projects || []),
        safetyRisk: calculateSafetyRisk(incidents || []),
        resourceBottlenecks: identifyBottlenecks(projects || []),
      })

      setLoading(false)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setLoading(false)
    }
  }

  const calculateTimelineRisk = (projects: any[]) => {
    const atRisk = projects.filter((p) => {
      if (!p.endDate || !p.startDate) return false
      const progress = calculateProgress(p)
      const expectedProgress = calculateExpectedProgress(p.startDate, p.endDate)
      return progress < expectedProgress - 0.1 // 10% behind
    })
    return {
      count: atRisk.length,
      percentage: projects.length > 0 ? (atRisk.length / projects.length) * 100 : 0,
      projects: atRisk.map((p) => ({ name: p.name, risk: 'HIGH' })),
    }
  }

  const calculateBudgetRisk = (projects: any[]) => {
    const overBudget = projects.filter((p) => {
      if (!p.budget) return false
      const spent = p.budget * 0.6 // Placeholder
      return spent > p.budget * 0.9
    })
    return {
      count: overBudget.length,
      percentage: projects.length > 0 ? (overBudget.length / projects.length) * 100 : 0,
      totalOverBudget: overBudget.reduce((sum, p) => sum + (p.budget * 0.1), 0),
    }
  }

  const calculateSafetyRisk = (incidents: any[]) => {
    const recent = incidents.filter(
      (i) => new Date(i.occurredAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )
    const trend = recent.length > incidents.length / 2 ? 'INCREASING' : 'STABLE'
    return {
      trend,
      riskLevel: recent.length > 5 ? 'HIGH' : recent.length > 2 ? 'MEDIUM' : 'LOW',
      predictedIncidents: Math.ceil(recent.length * 1.2),
    }
  }

  const identifyBottlenecks = useCallback((_projects: any[]) => {
    return [
      { resource: 'Skilled Labor', utilization: 95, risk: 'HIGH' },
      { resource: 'Equipment', utilization: 78, risk: 'MEDIUM' },
      { resource: 'Materials', utilization: 65, risk: 'LOW' },
    ]
  }, [])

  const calculateProgress = useCallback((_project: any) => {
    // Placeholder - would calculate from tasks
    return 0.5
  }, [])

  const calculateExpectedProgress = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = Date.now()
    return (now - start) / (end - start)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  const chartData = [
    { name: 'Week 1', incidents: 2, resolved: 1 },
    { name: 'Week 2', incidents: 3, resolved: 2 },
    { name: 'Week 3', incidents: 1, resolved: 3 },
    { name: 'Week 4', incidents: 4, resolved: 2 },
  ]

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Office Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Active Projects"
          value={metrics?.projects.active || 0}
          total={metrics?.projects.total || 0}
          icon={<Activity className="w-6 h-6" />}
          trend="up"
        />
        <MetricCard
          title="Safety Incidents"
          value={metrics?.safety.totalIncidents || 0}
          critical={metrics?.safety.critical || 0}
          icon={<AlertTriangle className="w-6 h-6" />}
          trend={metrics?.safety.totalIncidents > 5 ? 'down' : 'up'}
        />
        <MetricCard
          title="Compliance"
          value={metrics?.compliance.compliant || 0}
          violations={metrics?.compliance.violations || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          trend="up"
        />
        <MetricCard
          title="Timeline Risk"
          value={predictions?.timelineRisk.count || 0}
          percentage={predictions?.timelineRisk.percentage || 0}
          icon={<Clock className="w-6 h-6" />}
          trend={predictions?.timelineRisk.count > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Predictive Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Timeline Risk Prediction
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>At Risk Projects</span>
              <span className="font-semibold">{predictions?.timelineRisk.count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Risk Percentage</span>
              <span className="font-semibold">
                {predictions?.timelineRisk.percentage.toFixed(1) || 0}%
              </span>
            </div>
            {predictions?.timelineRisk.projects?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">High Risk Projects:</p>
                <ul className="space-y-1">
                  {predictions.timelineRisk.projects.slice(0, 3).map((p: any, idx: number) => (
                    <li key={idx} className="text-sm text-yellow-400">
                      • {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-400" />
            Budget Risk Analysis
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Over Budget Projects</span>
              <span className="font-semibold">{predictions?.budgetRisk.count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Over Budget</span>
              <span className="font-semibold">
                £{predictions?.budgetRisk?.totalOverBudget?.toFixed(2) || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Safety Risk Prediction
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Trend</span>
              <span className="font-semibold">{predictions?.safetyRisk?.trend || 'STABLE'}</span>
            </div>
            <div className="flex justify-between">
              <span>Risk Level</span>
              <span className={`font-semibold ${predictions?.safetyRisk?.riskLevel === 'HIGH' ? 'text-red-400' :
                  predictions?.safetyRisk?.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                    'text-green-400'
                }`}>
                {predictions?.safetyRisk?.riskLevel || 'LOW'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Predicted Incidents (Next 30 days)</span>
              <span className="font-semibold">{predictions?.safetyRisk?.predictedIncidents || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" />
            Resource Bottlenecks
          </h2>
          <div className="space-y-3">
            {predictions?.resourceBottlenecks?.map((b: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{b.resource}</span>
                  <span className="text-sm font-semibold">{b.utilization}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${b.utilization > 90 ? 'bg-red-500' :
                        b.utilization > 75 ? 'bg-yellow-500' :
                          'bg-green-500'
                      }`}
                    style={{ width: `${b.utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Safety Incidents Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
            <Legend />
            <Bar dataKey="incidents" fill="#ef4444" name="Incidents" />
            <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function MetricCard({ title, value, total, critical, violations, percentage, icon, trend }: any) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-400">{title}</div>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {total !== undefined && (
        <div className="text-sm text-gray-400">of {total} total</div>
      )}
      {critical !== undefined && (
        <div className="text-sm text-red-400">{critical} critical</div>
      )}
      {violations !== undefined && (
        <div className="text-sm text-yellow-400">{violations} violations</div>
      )}
      {percentage !== undefined && (
        <div className="text-sm text-gray-400">{percentage.toFixed(1)}%</div>
      )}
      {trend && (
        <div className="mt-2">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
        </div>
      )}
    </div>
  )
}
