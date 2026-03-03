import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Map, Upload, Users, RefreshCw, Layers, Maximize2, Minimize2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import VirtualMapView from '../components/map/VirtualMapView'
import RealMapView from '../components/map/RealMapView'
import UserRoleSelector from '../components/map/UserRoleSelector'
import ProjectSelector from '../components/map/ProjectSelector'
import UKRegionIndicator from '../components/map/UKRegionIndicator'
import MapControls from '../components/map/MapControls'
import LiveStatusIndicator from '../components/map/LiveStatusIndicator'
import MapLegend from '../components/map/MapLegend'
import WeatherAlert from '../components/map/WeatherAlert'
import UserLocationCard from '../components/map/UserLocationCard'
import { useGeolocation } from '../hooks/useGeolocation'
import { useWebSocket } from '../hooks/useWebSocket'
import { locationService, ActiveUser, Coordinates } from '../services/locationService'
import { mapService, DrawingMap } from '../services/mapService'
import { projectService, Project } from '../services/projectService'
import toast from 'react-hot-toast'

type MapViewType = 'virtual' | 'real'

export default function LiveMapPage() {
  const { user, hasPermission } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mapViewType, setMapViewType] = useState<MapViewType>('virtual')
  const [drawingMap, setDrawingMap] = useState<DrawingMap | null>(null)
  const [allUsers, setAllUsers] = useState<ActiveUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<ActiveUser[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    searchParams.get('project') || 'default-project'
  )
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string>('london')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showUserList, setShowUserList] = useState(true)
  const [showLegend, setShowLegend] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Get user's geolocation
  const {
    position,
    error: geolocationError,
    isLoading: geolocationLoading,
  } = useGeolocation({
    enableHighAccuracy: true,
    watch: true,
  })

  const userCoordinates = position
    ? { lat: position.latitude, lng: position.longitude }
    : null

  // Default center (can be updated based on project)
  const [mapCenter, setMapCenter] = useState<Coordinates>({
    lat: 51.5074, // London default
    lng: -0.1278,
  })

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      const projectsList = await projectService.getProjects()
      setProjects(projectsList)

      // Set default project if available
      if (projectsList.length > 0 && !projectsList.find(p => p.id === selectedProjectId)) {
        setSelectedProjectId(projectsList[0].id)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast.error('Failed to load projects')
    }
  }, [selectedProjectId])

  // Load active users
  const loadActiveUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true)
      const activeUsers = await locationService.getActiveUsers(selectedProjectId)
      setAllUsers(activeUsers)
      
      // Filter users based on role
      let filtered = activeUsers
      if (user?.role === 'OPERATIVE') {
        // Operatives can only see themselves
        filtered = activeUsers.filter((u) => u.userId === user.id)
      } else if (user?.role === 'SUPERVISOR') {
        // Supervisors can see team members in their projects
        filtered = activeUsers.filter((u) => {
          // Show users in same project or same organization
          return u.projectId === selectedProjectId
        })
      } else if (user?.role === 'COMPANY_ADMIN') {
        // Company admins can see all users in their organization
        filtered = activeUsers.filter((u) => {
          // Filter by organization (would need to add orgId to ActiveUser)
          return true // For now, show all in selected project
        })
      }
      // SUPER_ADMIN can see all users
      
      setFilteredUsers(filtered)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to load active users:', error)
      toast.error('Failed to load active users')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [selectedProjectId, user])

  // Load drawing map
  const loadDrawingMap = useCallback(async () => {
    try {
      const map = await mapService.getDrawingMap(selectedProjectId)
      setDrawingMap(map)
      // Update map center based on drawing map
      if (map.layoutData.coordinates && map.layoutData.coordinates.length > 0) {
        const center = map.layoutData.coordinates[0]
        setMapCenter(center)
      }
    } catch (error) {
      // Drawing map not found is okay
      setDrawingMap(null)
    }
  }, [selectedProjectId])

  // Update user location
  const updateUserLocation = useCallback(async (coordinates: Coordinates) => {
    if (!user) return
    try {
      // Map user role to location service role format
      type LocationRole = 'manager' | 'foreman' | 'labour'
      const roleMap: Record<string, LocationRole> = {
        'SUPER_ADMIN': 'manager',
        'COMPANY_ADMIN': 'manager',
        'SUPERVISOR': 'foreman',
        'OPERATIVE': 'labour',
      }
      const locationRole: LocationRole = roleMap[user.role] || 'labour'
      await locationService.updateLocation(coordinates, locationRole, selectedProjectId, user.name)
      // Reload users after updating location
      loadActiveUsers()
    } catch (error) {
      console.error('Failed to update location:', error)
    }
  }, [user, selectedProjectId, loadActiveUsers])

  // WebSocket for real-time updates
  const { isConnected: isWsConnected } = useWebSocket({
    projectId: selectedProjectId,
    onMessage: (message) => {
      if (message.type === 'location_update' || message.type === 'active_users') {
        const receivedUsers = message.users || []
        setAllUsers(receivedUsers)
        
        // Apply role-based filtering
        let filtered = receivedUsers
        if (user?.role === 'OPERATIVE') {
          filtered = receivedUsers.filter((u: ActiveUser) => u.userId === user.id)
        } else if (user?.role === 'SUPERVISOR') {
          filtered = receivedUsers.filter((u: ActiveUser) => u.projectId === selectedProjectId)
        }
        
        setFilteredUsers(filtered)
        setLastUpdate(new Date())
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
    },
    reconnect: true,
  })

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Update URL when project changes
  useEffect(() => {
    if (selectedProjectId) {
      setSearchParams({ project: selectedProjectId })
    }
  }, [selectedProjectId, setSearchParams])

  // Load project from URL on mount
  useEffect(() => {
    const projectParam = searchParams.get('project')
    if (projectParam && projectParam !== selectedProjectId) {
      setSelectedProjectId(projectParam)
    }
  }, []) // Only run on mount

  // Load drawing map when project changes
  useEffect(() => {
    loadDrawingMap()
  }, [loadDrawingMap])

  // Load users when project changes
  useEffect(() => {
    loadActiveUsers()
    const interval = setInterval(loadActiveUsers, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [loadActiveUsers])

  // Update user location when coordinates change
  useEffect(() => {
    if (userCoordinates) {
      updateUserLocation(userCoordinates)
      setMapCenter(userCoordinates)
    }
  }, [userCoordinates, updateUserLocation])

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    try {
      setIsUploading(true)
      const uploadedMap = await mapService.uploadDrawing(file, selectedProjectId)
      setDrawingMap(uploadedMap)
      toast.success('Drawing uploaded and processed successfully')
      loadDrawingMap()
    } catch (error: any) {
      console.error('Failed to upload drawing:', error)
      toast.error(error.response?.data?.message || 'Failed to upload drawing')
    } finally {
      setIsUploading(false)
    }
  }

  // Toggle map view
  const toggleMapView = () => {
    setMapViewType((prev) => (prev === 'virtual' ? 'real' : 'virtual'))
    toast.success(`Switched to ${mapViewType === 'virtual' ? 'Real' : 'Virtual'} Map`)
  }

  // Handle new project
  const handleNewProject = async () => {
    const name = prompt('Enter project name:')
    if (!name) return

    try {
      const project = await projectService.createProject(name)
      setProjects([...projects, project])
      setSelectedProjectId(project.id)
      toast.success('Project created successfully')
    } catch (error: any) {
      console.error('Failed to create project:', error)
      toast.error(error.response?.data?.message || 'Failed to create project')
    }
  }

  // Handle fullscreen
  const handleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  // Handle map controls
  const handleZoomIn = () => {
    // Zoom is handled by Leaflet's built-in controls
    // This is a placeholder for future implementation
    toast('Use zoom controls or mouse wheel to zoom', { icon: 'ℹ️' })
  }

  const handleZoomOut = () => {
    // Zoom is handled by Leaflet's built-in controls
    // This is a placeholder for future implementation
    toast('Use zoom controls or mouse wheel to zoom', { icon: 'ℹ️' })
  }

  const handleResetView = () => {
    // Reset map center
    if (drawingMap && drawingMap.layoutData.coordinates && drawingMap.layoutData.coordinates.length > 0) {
      const center = drawingMap.layoutData.coordinates[0]
      setMapCenter(center)
    } else if (userCoordinates) {
      setMapCenter(userCoordinates)
    }
    toast.success('Map view reset')
  }

  const handleLocate = () => {
    if (userCoordinates) {
      setMapCenter(userCoordinates)
      toast.success('Centered on your location')
    } else {
      toast.error('Location not available')
    }
  }

  // Load region from localStorage
  useEffect(() => {
    const savedRegion = localStorage.getItem('selectedRegion')
    if (savedRegion) setSelectedRegion(savedRegion)
  }, [])

  // Save region to localStorage
  useEffect(() => {
    localStorage.setItem('selectedRegion', selectedRegion)
  }, [selectedRegion])

  // Mock weather data (would come from API in production)
  const weatherData = {
    temperature: 12,
    condition: 'Overcast',
    windSpeed: 15,
    humidity: 78,
    alert: 'Moderate construction conditions - monitor wind speeds',
    alertType: 'warning' as const,
  }

  // Map layers for legend
  const mapLayers = [
    { name: 'User Locations', visible: true, color: '#3b82f6' },
    { name: 'Drawing Zones', visible: !!drawingMap, color: '#3b82f6' },
    { name: 'Boundaries', visible: !!drawingMap, color: '#ef4444' },
  ]

  // Get current user
  const currentUser = filteredUsers.find((u) => u.userId === user?.id) || null

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Enhanced Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 shadow-md">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-500 rounded-lg">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Live Project Map</h1>
                <p className="text-sm text-gray-400">UK Construction Site Tracking</p>
              </div>
            </div>
            <UKRegionIndicator region={selectedRegion} onRegionChange={setSelectedRegion} showSelector={true} />
          </div>
          <div className="flex items-center space-x-2 flex-wrap">
            {/* File upload - only for supervisors and above */}
            {hasPermission('upload:drawing') && (
              <label className="btn-secondary cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload Drawing</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
            {/* Refresh users */}
            <button
              onClick={loadActiveUsers}
              disabled={isLoadingUsers}
              className="btn-secondary disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {/* Toggle map view */}
            <button onClick={toggleMapView} className="btn-primary">
              <Layers className="w-4 h-4" />
              <span>{mapViewType === 'virtual' ? 'Real Map' : 'Virtual Map'}</span>
            </button>
            {/* Fullscreen */}
            <button onClick={handleFullscreen} className="btn-secondary">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Enhanced Settings bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 mt-4">
          <div className="flex items-center space-x-4 flex-wrap">
            <ProjectSelector
              projects={projects}
              selectedProject={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              onNewProject={handleNewProject}
            />
            {user && (
              <div className="px-3 py-2 bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-300">
                  {user.name} ({user.role.replace('_', ' ')})
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm flex-wrap">
            <LiveStatusIndicator
              isConnected={isWsConnected}
              userCount={filteredUsers.length}
              lastUpdate={lastUpdate}
            />
            {geolocationError && (
              <div className="text-red-400 text-sm">Location Error: {geolocationError.message}</div>
            )}
            {geolocationLoading && <div className="text-gray-400 text-sm">Getting location...</div>}
            {userCoordinates && (
              <div className="text-green-400 text-sm">
                Your Location: {userCoordinates.lat.toFixed(4)}, {userCoordinates.lng.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative min-h-0 flex">
        {/* Map container */}
        <div className="flex-1 relative min-h-0">
          {mapViewType === 'virtual' ? (
            <VirtualMapView
              drawingMap={drawingMap}
              users={filteredUsers}
              center={mapCenter}
              zoom={15}
            />
          ) : (
            <RealMapView
              center={mapCenter}
              zoom={15}
              users={filteredUsers}
              currentUserLocation={userCoordinates || undefined}
            />
          )}

          {/* Map Controls */}
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            onFullscreen={handleFullscreen}
            onToggleLayers={() => setShowLegend(!showLegend)}
            onLocate={handleLocate}
          />

          {/* Map Legend */}
          {showLegend && (
            <MapLegend
              showRoles={true}
              showLayers={mapViewType === 'virtual'}
              layers={mapLayers}
            />
          )}
        </div>

        {/* Sidebar - User List and Weather */}
        {showUserList && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
            {/* Weather Alert */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Weather Conditions</h3>
              <WeatherAlert
                temperature={weatherData.temperature}
                condition={weatherData.condition}
                windSpeed={weatherData.windSpeed}
                humidity={weatherData.humidity}
                alert={weatherData.alert}
                alertType={weatherData.alertType}
              />
            </div>

            {/* Active Users List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  Active Users ({filteredUsers.length}
                  {user?.role !== 'SUPER_ADMIN' && allUsers.length !== filteredUsers.length && ` / ${allUsers.length}`})
                </h3>
                <button
                  onClick={() => setShowUserList(false)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Hide
                </button>
              </div>
              <div className="space-y-3">
                {filteredUsers
                  .filter((u) => u.userId === user?.id)
                  .map((u) => (
                    <UserLocationCard
                      key={u.userId}
                      user={u}
                      isCurrentUser={true}
                    />
                  ))}
                {filteredUsers
                  .filter((u) => u.userId !== user?.id)
                  .map((u) => (
                    <UserLocationCard
                      key={u.userId}
                      user={u}
                    />
                  ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No active users</p>
                    {user?.role === 'OPERATIVE' && (
                      <p className="text-xs mt-1">You can only see your own location</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Role Legend */}
            <div className="p-4 border-t border-gray-700 bg-gray-900">
              <h4 className="font-semibold mb-2 text-sm">Role Legend</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-black rounded-full"></div>
                  <span>Manager</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Foreman</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Labour</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show User List Button (when hidden) */}
        {!showUserList && (
          <button
            onClick={() => setShowUserList(true)}
            className="absolute top-4 left-4 z-[1000] bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-3 shadow-lg transition-colors"
            title="Show User List"
          >
            <Users className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
