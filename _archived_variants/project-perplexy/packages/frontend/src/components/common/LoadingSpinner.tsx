import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({
  size = 'md',
  message = 'Loading...',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const content = (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-400 mb-4`} />
      {message && <p className="text-gray-400 text-sm">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center p-8">{content}</div>
}

