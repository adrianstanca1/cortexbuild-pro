import { Users, Map, Layers } from 'lucide-react'

interface MapLegendProps {
  showRoles?: boolean
  showLayers?: boolean
  layers?: Array<{ name: string; visible: boolean; color?: string }>
  onToggleLayer?: (layerName: string) => void
}

export default function MapLegend({
  showRoles = true,
  showLayers = false,
  layers = [],
  onToggleLayer,
}: MapLegendProps) {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-gray-800 bg-opacity-95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 shadow-lg max-w-xs">
      <div className="space-y-3">
        {showRoles && (
          <div>
            <div className="flex items-center space-x-2 mb-2 text-sm font-semibold text-gray-300">
              <Users className="w-4 h-4" />
              <span>User Roles</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-black rounded-full"></div>
                <span>Manager</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span>Foreman</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Labour</span>
              </div>
            </div>
          </div>
        )}

        {showLayers && layers.length > 0 && (
          <div className="border-t border-gray-700 pt-3">
            <div className="flex items-center space-x-2 mb-2 text-sm font-semibold text-gray-300">
              <Layers className="w-4 h-4" />
              <span>Map Layers</span>
            </div>
            <div className="space-y-2">
              {layers.map((layer) => (
                <label
                  key={layer.name}
                  className="flex items-center space-x-2 text-sm cursor-pointer hover:text-teal-400 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() => onToggleLayer?.(layer.name)}
                    className="rounded border-gray-600 text-teal-500 focus:ring-teal-500"
                  />
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: layer.color || '#999' }}
                  ></div>
                  <span>{layer.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-700 pt-3">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Map className="w-3 h-3" />
            <span>Interactive Map</span>
          </div>
        </div>
      </div>
    </div>
  )
}

