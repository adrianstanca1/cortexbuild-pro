import { useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DrawingMap, Zone, Boundary, Coordinates } from '../../services/mapService'
import { ActiveUser } from '../../services/locationService'

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface VirtualMapViewProps {
  drawingMap: DrawingMap | null
  users: ActiveUser[]
  center: Coordinates
  zoom?: number
}

function MapBounds({ bounds }: { bounds: { north: number; south: number; east: number; west: number } }) {
  const map = useMap()

  useEffect(() => {
    if (bounds) {
      map.fitBounds(
        [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ],
        { padding: [50, 50] }
      )
    }
  }, [bounds, map])

  return null
}

export default function VirtualMapView({ drawingMap, users, center, zoom = 15 }: VirtualMapViewProps) {
  // Calculate bounds from drawing map
  const getBounds = (): { north: number; south: number; east: number; west: number } | null => {
    if (!drawingMap?.layoutData?.zones && !drawingMap?.layoutData?.boundaries) {
      return null
    }

    const allCoordinates: Coordinates[] = []

    // Collect all coordinates from zones
    drawingMap.layoutData.zones?.forEach((zone) => {
      allCoordinates.push(...zone.coordinates)
    })

    // Collect all coordinates from boundaries
    drawingMap.layoutData.boundaries?.forEach((boundary) => {
      allCoordinates.push(...boundary.coordinates)
    })

    if (allCoordinates.length === 0) {
      return null
    }

    const lats = allCoordinates.map((coord) => coord.lat)
    const lngs = allCoordinates.map((coord) => coord.lng)

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    }
  }

  const bounds = getBounds()

  // Create custom icon for users with role-based styling
  const createUserIcon = (color: string, userName: string, role: string) => {
    return L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="
        width: 28px;
        height: 28px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      ">${userName.charAt(0).toUpperCase()}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
  }

  if (!drawingMap) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        <div className="text-center">
          <p className="mb-2">No drawing map available.</p>
          <p className="text-sm">Please upload a construction drawing PDF to generate a virtual map.</p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="virtual-map"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {bounds && <MapBounds bounds={bounds} />}

      {/* Render zones with enhanced styling */}
      {drawingMap.layoutData.zones?.map((zone: Zone) => (
        <Polygon
          key={zone.id}
          positions={zone.coordinates.map((coord) => [coord.lat, coord.lng])}
          pathOptions={{
            color: '#21808d', // Teal color matching UK theme
            fillColor: '#21808d',
            fillOpacity: 0.25,
            weight: 2,
          }}
        >
          <Popup>
            <div className="p-2">
              <strong className="text-teal-600">{zone.name}</strong>
              <br />
              <span className="text-sm text-gray-600">Type: {zone.type || 'Zone'}</span>
              <br />
              <span className="text-xs text-gray-500">
                Coordinates: {zone.coordinates.length} points
              </span>
            </div>
          </Popup>
        </Polygon>
      ))}

      {/* Render boundaries with enhanced styling */}
      {drawingMap.layoutData.boundaries?.map((boundary: Boundary, index: number) => {
        const boundaryColor = boundary.type === 'fence' ? '#FF6600' : // HSE Orange
                             boundary.type === 'building' ? '#C8102E' : // UK Red
                             '#f59e0b' // Warning Orange
        
        return (
          <Polygon
            key={`boundary-${index}`}
            positions={boundary.coordinates.map((coord) => [coord.lat, coord.lng])}
            pathOptions={{
              color: boundaryColor,
              fillColor: boundaryColor,
              fillOpacity: 0.15,
              weight: 3,
              dashArray: boundary.type === 'fence' ? '10, 5' : undefined,
            }}
          >
            <Popup>
              <div className="p-2">
                <strong className="text-red-600">{boundary.type.charAt(0).toUpperCase() + boundary.type.slice(1)}</strong>
                <br />
                <span className="text-xs text-gray-500">
                  Boundary marker
                </span>
              </div>
            </Popup>
          </Polygon>
        )
      })}

      {/* Render user markers with enhanced popups */}
      {users.map((user) => (
        <Marker
          key={user.userId}
          position={[user.coordinates.lat, user.coordinates.lng]}
          icon={createUserIcon(user.color, user.userName, user.role)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: user.color }}
                ></div>
                <strong className="text-base">{user.userName}</strong>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-600">Role:</span>{' '}
                  <span className="font-medium capitalize">{user.role}</span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>{' '}
                  <span className="font-mono text-xs">
                    {user.coordinates.lat.toFixed(4)}, {user.coordinates.lng.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Updated:</span>{' '}
                  <span className="text-xs">
                    {new Date(user.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
                {user.projectId && (
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                    Project: {user.projectId}
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
