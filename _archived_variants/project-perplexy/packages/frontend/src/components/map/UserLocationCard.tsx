import { MapPin, Clock, User } from 'lucide-react'
import { ActiveUser } from '../../services/locationService'

interface UserLocationCardProps {
  user: ActiveUser
  isCurrentUser?: boolean
  onUserClick?: (user: ActiveUser) => void
}

export default function UserLocationCard({
  user,
  isCurrentUser = false,
  onUserClick,
}: UserLocationCardProps) {
  const roleLabels: Record<string, string> = {
    manager: 'Manager',
    foreman: 'Foreman',
    labour: 'Labour',
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div
      className={`card-enhanced p-4 cursor-pointer transition-all hover:shadow-lg ${
        isCurrentUser ? 'ring-2 ring-teal-500' : ''
      }`}
      onClick={() => onUserClick?.(user)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: user.color }}
          >
            {user.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-base flex items-center space-x-2">
              <span>{user.userName}</span>
              {isCurrentUser && (
                <span className="text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <div className="text-sm text-gray-400 flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{roleLabels[user.role] || user.role}</span>
            </div>
          </div>
        </div>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: user.color }}
          title={roleLabels[user.role] || user.role}
        ></div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2 text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>
            {user.coordinates.lat.toFixed(4)}, {user.coordinates.lng.toFixed(4)}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Updated {formatTimeAgo(user.lastUpdated)}</span>
        </div>
        {user.projectId && (
          <div className="text-xs text-gray-500 mt-2">
            Project: {user.projectId}
          </div>
        )}
      </div>
    </div>
  )
}

