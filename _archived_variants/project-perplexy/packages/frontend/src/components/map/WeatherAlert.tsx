import { AlertTriangle, Cloud, Droplets, Wind, Sun } from 'lucide-react'

interface WeatherAlertProps {
    temperature?: number
    condition?: string
    windSpeed?: number
    humidity?: number
    alert?: string
    alertType?: 'success' | 'warning' | 'error'
}

export default function WeatherAlert({
    temperature,
    condition,
    windSpeed,
    humidity,
    alert,
    alertType = 'success',
}: WeatherAlertProps) {
    const getConditionIcon = () => {
        if (!condition) return <Cloud className="w-5 h-5" />
        const lower = condition.toLowerCase()
        if (lower.includes('rain') || lower.includes('drizzle')) {
            return <Droplets className="w-5 h-5" />
        }
        if (lower.includes('wind')) {
            return <Wind className="w-5 h-5" />
        }
        if (lower.includes('sun') || lower.includes('clear')) {
            return <Sun className="w-5 h-5" />
        }
        return <Cloud className="w-5 h-5" />
    }

    const alertClasses = {
        success: 'bg-green-500 bg-opacity-10 border-green-500 text-green-400',
        warning: 'bg-yellow-500 bg-opacity-10 border-yellow-500 text-yellow-400',
        error: 'bg-red-500 bg-opacity-10 border-red-500 text-red-400',
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                    {getConditionIcon()}
                    <div>
                        {temperature !== undefined && (
                            <div className="text-2xl font-bold">{temperature}°C</div>
                        )}
                        {condition && (
                            <div className="text-sm text-gray-400">{condition}</div>
                        )}
                    </div>
                </div>
                {(windSpeed !== undefined || humidity !== undefined) && (
                    <div className="text-xs text-gray-500 space-y-1">
                        {windSpeed !== undefined && (
                            <div className="flex items-center space-x-1">
                                <Wind className="w-3 h-3" />
                                <span>{windSpeed} km/h</span>
                            </div>
                        )}
                        {humidity !== undefined && (
                            <div className="flex items-center space-x-1">
                                <Droplets className="w-3 h-3" />
                                <span>{humidity}%</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {alert && (
                <div
                    className={`flex items-start space-x-2 p-3 rounded border ${alertClasses[alertType]}`}
                >
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">{alert}</div>
                </div>
            )}
        </div>
    )
}

