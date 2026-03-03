import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { Folder, Play, Map, LayoutDashboard, Settings, Building2, History, Code, Package, Monitor, FileText, Truck, FileSignature, Mail, Calendar, Users, Sparkles, MessageSquare, Workflow, BarChart3, Calculator, Plug, ClipboardList, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useConnectivityStatus } from '../../hooks/useConnectivityStatus'

export default function MainLayout() {
  const location = useLocation()
  const { user, hasPermission, logout, getDashboardRoute, loading } = useAuth()
  const connectivity = useConnectivityStatus()

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Define all navigation items with permission requirements
  const allNavItems = [
    { to: getDashboardRoute(), icon: LayoutDashboard, label: 'Dashboard', permission: null },
    { to: '/tasks', icon: ClipboardList, label: 'Tasks', permission: null },
    { to: '/projects', icon: Building2, label: 'Projects', permission: 'view:all:projects' },
    { to: '/map', icon: Map, label: 'Live Map', permission: null },
    { to: '/files', icon: Folder, label: 'Files', permission: null },
    { to: '/messages', icon: Mail, label: 'Messages', permission: null },
    { to: '/calendar', icon: Calendar, label: 'Calendar', permission: null },
    { to: '/team', icon: Users, label: 'Team', permission: 'manage:users' },
    { to: '/tenders', icon: FileText, label: 'Tenders', permission: 'view:reports' },
    { to: '/suppliers', icon: Truck, label: 'Suppliers', permission: 'view:reports' },
    { to: '/contracts', icon: FileSignature, label: 'Contracts', permission: 'view:reports' },
    { to: '/ai-tools', icon: Sparkles, label: 'AI Tools', permission: null },
    { to: '/collaboration', icon: MessageSquare, label: 'Collaboration', permission: null },
    { to: '/workflows', icon: Workflow, label: 'Workflows', permission: 'view:reports' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics', permission: 'view:company:analytics' },
    { to: '/cost-estimator', icon: Calculator, label: 'Cost Estimator', permission: 'view:reports' },
    { to: '/integrations', icon: Plug, label: 'Integrations', permission: 'view:reports' },
    { to: '/sandbox', icon: Code, label: 'Developer Sandbox', permission: null },
    { to: '/marketplace', icon: Package, label: 'Marketplace', permission: null },
    { to: '/desktop', icon: Monitor, label: 'myAppDesktop', permission: null },
    { to: '/interpreter', icon: Play, label: 'Interpreter', permission: null },
    { to: '/history', icon: History, label: 'History', permission: null },
    { to: '/settings', icon: Settings, label: 'Settings', permission: null },
  ]

  // Filter navigation items based on user permissions
  const navItems = allNavItems.filter((item) => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  })

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-primary-400">ConstructAI</h1>
          <p className="text-xs text-gray-400 mt-1">Construction Management</p>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.role === 'SUPER_ADMIN' && (
                <span className="px-2 py-1 bg-yellow-500 bg-opacity-20 text-yellow-400 rounded text-xs font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {user.role.replace('_', ' ')}
                </span>
              )}
              {user.role === 'COMPANY_ADMIN' && (
                <span className="px-2 py-1 bg-primary-500 bg-opacity-20 text-primary-400 rounded text-xs font-semibold">
                  {user.role.replace('_', ' ')}
                </span>
              )}
              {user.role === 'SUPERVISOR' && (
                <span className="px-2 py-1 bg-orange-500 bg-opacity-20 text-orange-400 rounded text-xs font-semibold">
                  {user.role}
                </span>
              )}
              {user.role === 'OPERATIVE' && (
                <span className="px-2 py-1 bg-green-500 bg-opacity-20 text-green-400 rounded text-xs font-semibold">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.to ||
              (item.to === getDashboardRoute() && (location.pathname === '/' || location.pathname.startsWith('/dashboard'))) ||
              (item.to !== getDashboardRoute() && location.pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        {user && (
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-2 p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {connectivity.state !== 'online' && (
          <div
            className={`px-4 py-2 text-sm flex items-center justify-between ${
              connectivity.state === 'offline'
                ? 'bg-red-900 text-red-100'
                : 'bg-yellow-900 text-yellow-100'
            }`}
          >
            <span>
              {connectivity.state === 'offline'
                ? 'Unable to reach ConstructAI services. Some features may be unavailable.'
                : 'Connectivity degraded. Retrying connection...'}
            </span>
            {connectivity.lastError && (
              <span className="ml-4 text-xs opacity-80 truncate max-w-xs">
                {connectivity.lastError}
              </span>
            )}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  )
}

