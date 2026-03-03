import { useState, useEffect, useCallback } from 'react'
import { Activity, Folder, Map, Users, FileText, TrendingUp, Clock, Code as CodeIcon, Package, Monitor, Sparkles, MessageSquare, Workflow, BarChart3, Calculator, Plug, FileText as TenderIcon, Truck, FileSignature, Mail, Calendar } from 'lucide-react'
import { projectService, Project } from '../services/projectService'
import { locationService } from '../services/locationService'
import { fileService } from '../services/fileService'
import { mapService } from '../services/mapService'
import { tenderService } from '../services/tenderService'
import { supplierService } from '../services/supplierService'
import { contractService } from '../services/contractService'
import { messageService } from '../services/messageService'
import { calendarService } from '../services/calendarService'
import { teamService } from '../services/teamService'
import { aiToolsService } from '../services/aiToolsService'
import { collaborationService } from '../services/collaborationService'
import { workflowService } from '../services/workflowService'
import { analyticsService } from '../services/analyticsService'
import { costEstimatorService } from '../services/costEstimatorService'
import { integrationsService } from '../services/integrationsService'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

interface DashboardStats {
    totalProjects: number
    activeUsers: number
    totalFiles: number
    totalDrawings: number
    recentProjects: Project[]
    tenderStats?: any
    supplierStats?: any
    contractStats?: any
    messageStats?: any
    teamStats?: any
    aiToolsStats?: any
    collaborationStats?: any
    workflowStats?: any
    analyticsStats?: any
    costEstimatorStats?: any
    integrationsStats?: any
}

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalProjects: 0,
        activeUsers: 0,
        totalFiles: 0,
        totalDrawings: 0,
        recentProjects: [],
        tenderStats: undefined,
        supplierStats: undefined,
        contractStats: undefined,
        messageStats: undefined,
        teamStats: undefined,
        aiToolsStats: undefined,
        collaborationStats: undefined,
        workflowStats: undefined,
        analyticsStats: undefined,
        costEstimatorStats: undefined,
        integrationsStats: undefined,
    })
    const [loading, setLoading] = useState(true)

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true)
            const [
                projects,
                users,
                drawings,
                fileStats,
                tenderStats,
                supplierStats,
                contractStats,
                messageStats,
                teamStats,
                aiToolsStats,
                collaborationStats,
                workflowStats,
                analyticsStats,
                costEstimatorStats,
                integrationsStats,
            ] = await Promise.all([
                projectService.getProjects(),
                locationService.getActiveUsers(),
                mapService.getAllDrawingMaps().catch(() => []),
                fileService.getFileStats().catch(() => ({ totalFiles: 0, totalSize: 0, totalDirectories: 0, fileTypes: {} })),
                tenderService.getTenderStats().catch(() => ({ total: 0, active: 0, submitted: 0, won: 0, lost: 0, totalValue: 0, avgWinProbability: 0 })),
                supplierService.getSupplierStats().catch(() => ({ total: 0, verified: 0, active: 0, totalContracts: 0, totalValue: 0 })),
                contractService.getContractStats().catch(() => ({ total: 0, active: 0, pending: 0, expired: 0, needRenewal: 0, totalValue: 0 })),
                messageService.getMessageStats().catch(() => ({ total: 0, unread: 0, tenderRelated: 0, thisWeek: 0 })),
                teamService.getTeamStats().catch(() => ({ total: 0, averageEfficiency: 0, averageRate: 0, activeProjects: 0 })),
                aiToolsService.getAIToolStats().catch(() => ({ total: 0, active: 0, totalUsage: 0, byCategory: {} })),
                collaborationService.getCollaborationStats().catch(() => ({ totalRooms: 0, totalMessages: 0, activeRooms: 0 })),
                workflowService.getWorkflowStats().catch(() => ({ total: 0, active: 0, totalRuns: 0, successRate: 0 })),
                analyticsService.getAnalyticsStats().catch(() => ({ totalDashboards: 0, totalReports: 0, totalMetrics: 0 })),
                costEstimatorService.getCostEstimatorStats().catch(() => ({ total: 0, approved: 0, pending: 0, totalValue: 0 })),
                integrationsService.getIntegrationsStats().catch(() => ({ total: 0, active: 0, totalSyncs: 0, successRate: 0 })),
            ])

            setStats({
                totalProjects: projects.length,
                activeUsers: users.length,
                totalFiles: fileStats.totalFiles,
                totalDrawings: drawings.length,
                recentProjects: projects.slice(0, 5),
                // Store additional stats for display
                tenderStats,
                supplierStats,
                contractStats,
                messageStats,
                teamStats,
                aiToolsStats,
                collaborationStats,
                workflowStats,
                analyticsStats,
                costEstimatorStats,
                integrationsStats,
            })
        } catch (error) {
            console.error('Failed to load dashboard data:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDashboardData()

        // Refresh dashboard data every 30 seconds for real-time updates
        const interval = setInterval(() => {
            loadDashboardData()
        }, 30000)

        return () => clearInterval(interval)
    }, [loadDashboardData])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                    <p className="text-gray-400">Overview of your construction projects and activities</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                    {/* Total Projects */}
                    <Link to="/projects" className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-primary-500 bg-opacity-20 rounded-lg">
                                <Folder className="w-5 h-5 text-primary-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.totalProjects}</h3>
                        <p className="text-gray-400 text-xs">Projects</p>
                    </Link>

                    {/* Active Users */}
                    <Link to="/team" className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                                <Users className="w-5 h-5 text-green-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.activeUsers}</h3>
                        <p className="text-gray-400 text-xs">Active Users</p>
                    </Link>

                    {/* Total Files */}
                    <Link to="/files" className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.totalFiles}</h3>
                        <p className="text-gray-400 text-xs">Files</p>
                    </Link>

                    {/* Tenders */}
                    <Link to="/tenders" className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                                <TenderIcon className="w-5 h-5 text-blue-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.tenderStats?.total || 0}</h3>
                        <p className="text-gray-400 text-xs">Tenders</p>
                        {stats.tenderStats?.active && (
                            <p className="text-green-400 text-xs mt-1">{stats.tenderStats.active} active</p>
                        )}
                    </Link>

                    {/* Contracts */}
                    <Link to="/contracts" className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                                <FileSignature className="w-5 h-5 text-green-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.contractStats?.total || 0}</h3>
                        <p className="text-gray-400 text-xs">Contracts</p>
                        {stats.contractStats?.active && (
                            <p className="text-green-400 text-xs mt-1">{stats.contractStats.active} active</p>
                        )}
                    </Link>

                    {/* Messages */}
                    <Link to="/messages" className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors relative">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                                <Mail className="w-5 h-5 text-blue-400" />
                            </div>
                            {stats.messageStats?.unread && stats.messageStats.unread > 0 && (
                                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {stats.messageStats.unread}
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{stats.messageStats?.total || 0}</h3>
                        <p className="text-gray-400 text-xs">Messages</p>
                        {stats.messageStats?.unread && stats.messageStats.unread > 0 && (
                            <p className="text-red-400 text-xs mt-1">{stats.messageStats.unread} unread</p>
                        )}
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Link
                        to="/sandbox"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-500 bg-opacity-20 rounded-lg group-hover:bg-purple-500 transition-colors">
                                <CodeIcon className="w-5 h-5 text-purple-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Developer Sandbox</h3>
                                <p className="text-xs text-gray-400">Create apps</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/marketplace"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-orange-500 bg-opacity-20 rounded-lg group-hover:bg-orange-500 transition-colors">
                                <Package className="w-5 h-5 text-orange-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Marketplace</h3>
                                <p className="text-xs text-gray-400">Discover apps</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/desktop"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg group-hover:bg-blue-500 transition-colors">
                                <Monitor className="w-5 h-5 text-blue-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">myAppDesktop</h3>
                                <p className="text-xs text-gray-400">Virtual desktop</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/ai-tools"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-500 bg-opacity-20 rounded-lg group-hover:bg-purple-500 transition-colors">
                                <Sparkles className="w-5 h-5 text-purple-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">AI Tools</h3>
                                <p className="text-xs text-gray-400">AI-powered tools</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/collaboration"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg group-hover:bg-blue-500 transition-colors">
                                <MessageSquare className="w-5 h-5 text-blue-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Collaboration</h3>
                                <p className="text-xs text-gray-400">Team rooms</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/workflows"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-indigo-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-500 bg-opacity-20 rounded-lg group-hover:bg-indigo-500 transition-colors">
                                <Workflow className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Workflows</h3>
                                <p className="text-xs text-gray-400">Automation</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/analytics"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg group-hover:bg-blue-500 transition-colors">
                                <BarChart3 className="w-5 h-5 text-blue-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Analytics</h3>
                                <p className="text-xs text-gray-400">Insights & reports</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/cost-estimator"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg group-hover:bg-green-500 transition-colors">
                                <Calculator className="w-5 h-5 text-green-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Cost Estimator</h3>
                                <p className="text-xs text-gray-400">Estimate costs</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/integrations"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-orange-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-orange-500 bg-opacity-20 rounded-lg group-hover:bg-orange-500 transition-colors">
                                <Plug className="w-5 h-5 text-orange-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Integrations</h3>
                                <p className="text-xs text-gray-400">Connect services</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/tenders"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg group-hover:bg-blue-500 transition-colors">
                                <TenderIcon className="w-5 h-5 text-blue-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Tenders</h3>
                                <p className="text-xs text-gray-400">Manage tenders</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/suppliers"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-yellow-500 bg-opacity-20 rounded-lg group-hover:bg-yellow-500 transition-colors">
                                <Truck className="w-5 h-5 text-yellow-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Suppliers</h3>
                                <p className="text-xs text-gray-400">Manage suppliers</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/contracts"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg group-hover:bg-green-500 transition-colors">
                                <FileSignature className="w-5 h-5 text-green-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Contracts</h3>
                                <p className="text-xs text-gray-400">Manage contracts</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/messages"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg group-hover:bg-blue-500 transition-colors">
                                <Mail className="w-5 h-5 text-blue-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Messages</h3>
                                <p className="text-xs text-gray-400">
                                    {stats.messageStats?.unread || 0} unread
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/calendar"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-red-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-500 bg-opacity-20 rounded-lg group-hover:bg-red-500 transition-colors">
                                <Calendar className="w-5 h-5 text-red-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Calendar</h3>
                                <p className="text-xs text-gray-400">View events</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/team"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg group-hover:bg-green-500 transition-colors">
                                <Users className="w-5 h-5 text-green-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Team</h3>
                                <p className="text-xs text-gray-400">
                                    {stats.teamStats?.total || 0} members
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/map"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg group-hover:bg-green-500 transition-colors">
                                <Map className="w-5 h-5 text-green-400 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold">Live Map</h3>
                                <p className="text-xs text-gray-400">Project tracking</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Recent Projects */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">Recent Projects</h2>
                        <Link
                            to="/projects"
                            className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                        >
                            View All
                        </Link>
                    </div>

                    {stats.recentProjects.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recentProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    to={`/projects/${project.id}`}
                                    className="block p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">{project.name}</h3>
                                            {project.description && (
                                                <p className="text-sm text-gray-400 mb-2">{project.description}</p>
                                            )}
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        Created {project.createdAt?.toLocaleDateString() || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <Map className="w-5 h-5 text-primary-400" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No projects yet</p>
                            <Link
                                to="/projects"
                                className="text-primary-400 hover:text-primary-300 text-sm font-medium mt-2 inline-block"
                            >
                                Create your first project
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


