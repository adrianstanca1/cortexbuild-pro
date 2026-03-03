import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, BarChart3, FileText, Search } from 'lucide-react'
import { analyticsService, AnalyticsDashboard, CreateAnalyticsDashboardRequest, UpdateAnalyticsDashboardRequest, AnalyticsMetric, AnalyticsReport, GenerateAnalyticsReportRequest, AnalyticsStats } from '../services/analyticsService'
import toast from 'react-hot-toast'

export default function AdvancedAnalyticsPage() {
  const [dashboards, setDashboards] = useState<AnalyticsDashboard[]>([])
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([])
  const [reports, setReports] = useState<AnalyticsReport[]>([])
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboards' | 'metrics' | 'reports'>('dashboards')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [selectedDashboard, setSelectedDashboard] = useState<AnalyticsDashboard | null>(null)

  useEffect(() => {
    loadDashboards()
    loadMetrics()
    loadReports()
    loadStats()
  }, [])

  const loadDashboards = async () => {
    try {
      const data = await analyticsService.getDashboards()
      setDashboards(data)
    } catch (error) {
      toast.error('Failed to load dashboards')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const data = await analyticsService.getMetrics('month')
      setMetrics(data)
    } catch (error) {
      console.error('Failed to load metrics', error)
    }
  }

  const loadReports = async () => {
    try {
      const data = await analyticsService.getReports()
      setReports(data)
    } catch (error) {
      console.error('Failed to load reports', error)
    }
  }

  const loadStats = async () => {
    try {
      const data = await analyticsService.getAnalyticsStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats', error)
    }
  }

  const handleCreateDashboard = () => {
    setSelectedDashboard(null)
    setIsModalOpen(true)
  }

  const handleGenerateReport = () => {
    setIsReportModalOpen(true)
  }

  const handleSubmitDashboard = async (formData: CreateAnalyticsDashboardRequest | UpdateAnalyticsDashboardRequest) => {
    try {
      if (selectedDashboard) {
        await analyticsService.updateDashboard(selectedDashboard.id, formData as UpdateAnalyticsDashboardRequest)
        toast.success('Dashboard updated successfully')
      } else {
        await analyticsService.createDashboard(formData as CreateAnalyticsDashboardRequest)
        toast.success('Dashboard created successfully')
      }
      setIsModalOpen(false)
      setSelectedDashboard(null)
      loadDashboards()
      loadStats()
    } catch (error) {
      toast.error(selectedDashboard ? 'Failed to update dashboard' : 'Failed to create dashboard')
      console.error(error)
    }
  }

  const handleGenerateReportSubmit = async (formData: GenerateAnalyticsReportRequest) => {
    try {
      await analyticsService.generateReport(formData)
      toast.success('Report generated successfully')
      setIsReportModalOpen(false)
      loadReports()
      loadStats()
    } catch (error) {
      toast.error('Failed to generate report')
      console.error(error)
    }
  }

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return

    try {
      await analyticsService.deleteDashboard(dashboardId)
      toast.success('Dashboard deleted successfully')
      loadDashboards()
      loadStats()
    } catch (error) {
      toast.error('Failed to delete dashboard')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
        </div>
        <div className="flex gap-2">
          {activeTab === 'dashboards' && (
            <button
              onClick={handleCreateDashboard}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              New Dashboard
            </button>
          )}
          {activeTab === 'reports' && (
            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Generate Report
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Dashboards</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalDashboards}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Reports</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalReports}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Metrics</div>
            <div className="text-2xl font-bold text-green-600">{stats.totalMetrics}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('dashboards')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'dashboards'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboards
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'metrics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'reports'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reports
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'dashboards' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboards.map((dashboard) => (
                <div key={dashboard.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{dashboard.name}</h3>
                    <button
                      onClick={() => handleDeleteDashboard(dashboard.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{dashboard.description}</p>
                  <div className="text-sm text-gray-600">
                    {dashboard.widgets.length} widgets
                  </div>
                </div>
              ))}
              {dashboards.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-500">No dashboards found</div>
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">{metric.name}</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  </div>
                  <div className={`text-sm ${metric.changeType === 'increase' ? 'text-green-600' : metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'}`}>
                    {metric.changeType === 'increase' ? '+' : ''}{metric.change}% from last {metric.period}
                  </div>
                </div>
              ))}
              {metrics.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-500">No metrics found</div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{report.name}</h3>
                    <p className="text-sm text-gray-500">{report.type} • Generated {report.generatedAt.toLocaleDateString()}</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-900">
                    <FileText className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center py-8 text-gray-500">No reports found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <DashboardModal
          dashboard={selectedDashboard}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedDashboard(null)
          }}
          onSubmit={handleSubmitDashboard}
        />
      )}

      {isReportModalOpen && (
        <ReportModal
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleGenerateReportSubmit}
        />
      )}
    </div>
  )
}

function DashboardModal({
  dashboard,
  onClose,
  onSubmit,
}: {
  dashboard: AnalyticsDashboard | null
  onClose: () => void
  onSubmit: (data: CreateAnalyticsDashboardRequest | UpdateAnalyticsDashboardRequest) => void
}) {
  const [formData, setFormData] = useState<CreateAnalyticsDashboardRequest | UpdateAnalyticsDashboardRequest>({
    name: dashboard?.name || '',
    description: dashboard?.description || '',
    widgets: dashboard?.widgets || [],
  } as CreateAnalyticsDashboardRequest)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{dashboard ? 'Edit Dashboard' : 'New Dashboard'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {dashboard ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ReportModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (data: GenerateAnalyticsReportRequest) => void
}) {
  const [formData, setFormData] = useState<GenerateAnalyticsReportRequest>({
    name: '',
    type: 'tender',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Generate Report</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="tender">Tender</option>
              <option value="contract">Contract</option>
              <option value="project">Project</option>
              <option value="team">Team</option>
              <option value="financial">Financial</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

