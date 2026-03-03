import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ActiveUser, Coordinates } from '../../services/locationService'

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface RealMapViewProps {
  center: Coordinates
  zoom?: number
  users: ActiveUser[]
  currentUserLocation?: Coordinates
}

function MapCenter({ center, zoom }: { center: Coordinates; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom)
  }, [center, zoom, map])

  return null
}

export default function RealMapView({
  center,
  zoom = 15,
  users,
  currentUserLocation,
}: RealMapViewProps) {
  // Create custom icon for users with enhanced styling
  const createUserIcon = (color: string, userName: string, role: string, isCurrentUser: boolean = false) => {
    const size = isCurrentUser ? 32 : 28
    return L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${isCurrentUser ? '4px' : '3px'} solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isCurrentUser ? '14px' : '12px'};
        font-weight: bold;
        color: white;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        ${isCurrentUser ? 'animation: pulse 2s infinite;' : ''}
      ">${userName.charAt(0).toUpperCase()}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  }

  // Calculate bounds to fit all users (optional - can be used for auto-fit)
  // const allCoordinates = users.map((user) => user.coordinates)
  // if (currentUserLocation) {
  //   allCoordinates.push(currentUserLocation)
  // }
  // const bounds = allCoordinates.length > 0 ? {
  //   north: Math.max(...allCoordinates.map(c => c.lat)),
  //   south: Math.min(...allCoordinates.map(c => c.lat)),
  //   east: Math.max(...allCoordinates.map(c => c.lng)),
  //   west: Math.min(...allCoordinates.map(c => c.lng)),
  // } : null

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="real-map"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <MapCenter center={center} zoom={zoom} />

      {/* Current user marker */}
      {currentUserLocation && (
        <Marker
          position={[currentUserLocation.lat, currentUserLocation.lng]}
          icon={createUserIcon('#21808d', 'You', 'current', true)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 rounded-full bg-teal-500"></div>
                <strong className="text-base">You (Current Location)</strong>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-600">Coordinates:</span>{' '}
                  <span className="font-mono text-xs">
                    {currentUserLocation.lat.toFixed(4)}, {currentUserLocation.lng.toFixed(4)}
                  </span>
                </div>
                <div className="text-xs text-teal-600 mt-2">
                  🎯 Your current position
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Other users markers */}
      {users.map((user) => (
        <Marker
          key={user.userId}
          position={[user.coordinates.lat, user.coordinates.lng]}
          icon={createUserIcon(user.color, user.userName, user.role, false)}
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

