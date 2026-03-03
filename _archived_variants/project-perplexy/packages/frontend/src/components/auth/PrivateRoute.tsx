import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface PrivateRouteProps {
  children: ReactNode
  requiredRole?: string[]
  requiredPermission?: string
}

export function PrivateRoute({ children, requiredRole, requiredPermission }: PrivateRouteProps) {
  const { user, loading, getDashboardRoute } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role requirement
  if (requiredRole && !requiredRole.includes(user.role)) {
    // Redirect to user's dashboard if they don't have required role
    return <Navigate to={getDashboardRoute()} replace />
  }

  // Check permission requirement
  if (requiredPermission) {
    const { hasPermission } = useAuth()
    if (!hasPermission(requiredPermission)) {
      return <Navigate to={getDashboardRoute()} replace />
    }
  }

  return <>{children}</>
}

