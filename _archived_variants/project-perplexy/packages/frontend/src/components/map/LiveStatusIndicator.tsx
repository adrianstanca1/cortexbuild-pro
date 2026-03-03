import { Wifi, WifiOff } from 'lucide-react'

interface LiveStatusIndicatorProps {
    isConnected: boolean
    userCount?: number
    lastUpdate?: Date
}

export default function LiveStatusIndicator({
    isConnected,
    userCount,
    lastUpdate,
}: LiveStatusIndicatorProps) {
    return (
        <div className="flex items-center space-x-4">
            <div className={`live-indicator ${isConnected ? '' : 'opacity-50'}`}>
                {isConnected ? (
                    <>
                        <Wifi className="w-3 h-3" />
                        <span>Live</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-3 h-3" />
                        <span>Offline</span>
                    </>
                )}
            </div>
            {userCount !== undefined && (
                <div className="text-sm text-gray-400">
                    {userCount} active {userCount === 1 ? 'user' : 'users'}
                </div>
            )}
            {lastUpdate && (
                <div className="text-xs text-gray-500">
                    Updated {formatTimeAgo(lastUpdate)}
                </div>
            )}
        </div>
    )
}

function formatTimeAgo(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

