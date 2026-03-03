import { MapPin } from 'lucide-react'

interface UKRegion {
    id: string
    name: string
    adjustment: number
}

const UK_REGIONS: UKRegion[] = [
    { id: 'london', name: 'London', adjustment: 1.15 },
    { id: 'south-east', name: 'South East', adjustment: 1.05 },
    { id: 'south-west', name: 'South West', adjustment: 1.0 },
    { id: 'midlands', name: 'Midlands', adjustment: 0.97 },
    { id: 'north', name: 'North England', adjustment: 0.92 },
    { id: 'scotland', name: 'Scotland', adjustment: 0.95 },
    { id: 'wales', name: 'Wales', adjustment: 0.92 },
    { id: 'northern-ireland', name: 'Northern Ireland', adjustment: 0.88 },
]

interface UKRegionIndicatorProps {
    region: string
    onRegionChange?: (region: string) => void
    showSelector?: boolean
}

export default function UKRegionIndicator({
    region,
    onRegionChange,
    showSelector = false,
}: UKRegionIndicatorProps) {
    const currentRegion = UK_REGIONS.find((r) => r.id === region) || UK_REGIONS[0]

    if (showSelector && onRegionChange) {
        return (
            <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <select
                    value={region}
                    onChange={(e) => onRegionChange(e.target.value)}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                >
                    {UK_REGIONS.map((reg) => (
                        <option key={reg.id} value={reg.id}>
                            {reg.name} ({reg.adjustment > 1 ? '+' : ''}
                            {((reg.adjustment - 1) * 100).toFixed(0)}%)
                        </option>
                    ))}
                </select>
            </div>
        )
    }

    return (
        <div className="uk-region-indicator flex items-center space-x-2">
            <span className="uk-flag"></span>
            <span>{currentRegion.name}</span>
        </div>
    )
}

export { UK_REGIONS }
export type { UKRegion }

