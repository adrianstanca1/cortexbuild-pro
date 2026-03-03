import { useState, useEffect, useCallback } from 'react'
import { Search, Download, Star, Code, Filter, Package, TrendingUp, Clock } from 'lucide-react'
import { marketplaceService, MarketplaceApp } from '../services/marketplaceService'
import { desktopService } from '../services/desktopService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'utility', name: 'Utilities' },
  { id: 'web', name: 'Web Apps' },
  { id: 'automation', name: 'Automation' },
  { id: 'data', name: 'Data Processing' },
  { id: 'basic', name: 'Basic' },
]

export default function MarketplacePage() {
  const [apps, setApps] = useState<MarketplaceApp[]>([])
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedApp, setSelectedApp] = useState<MarketplaceApp | null>(null)

  const loadApps = useCallback(async () => {
    try {
      setLoading(true)
      const [allApps, installed] = await Promise.all([
        marketplaceService.getApps(selectedCategory === 'all' ? undefined : selectedCategory, searchQuery || undefined),
        marketplaceService.getInstalledApps().catch(() => []),
      ])
      setApps(allApps)
      setInstalledApps(new Set(installed.map((app: MarketplaceApp) => app.id)))
    } catch (error) {
      console.error('Failed to load apps:', error)
      toast.error('Failed to load marketplace apps')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery])

  useEffect(() => {
    loadApps()
  }, [loadApps])

  const handleInstall = async (app: MarketplaceApp) => {
    try {
      await marketplaceService.installApp(app.id)
      await desktopService.installApp(app)
      setInstalledApps((prev) => new Set([...prev, app.id]))
      toast.success(`App "${app.name}" installed successfully!`)
      loadApps()
    } catch (error: any) {
      console.error('Failed to install app:', error)
      toast.error(error.response?.data?.message || 'Failed to install app')
    }
  }

  const handleUninstall = async (app: MarketplaceApp) => {
    if (!confirm(`Are you sure you want to uninstall "${app.name}"?`)) {
      return
    }

    try {
      await marketplaceService.uninstallApp(app.id)
      await desktopService.uninstallApp(app.id)
      setInstalledApps((prev) => {
        const next = new Set(prev)
        next.delete(app.id)
        return next
      })
      toast.success(`App "${app.name}" uninstalled successfully`)
      loadApps()
    } catch (error: any) {
      console.error('Failed to uninstall app:', error)
      toast.error(error.response?.data?.message || 'Failed to uninstall app')
    }
  }

  const filteredApps = apps.filter((app) => {
    if (selectedCategory !== 'all' && app.category !== selectedCategory) {
      return false
    }
    if (searchQuery && !app.name.toLowerCase().includes(searchQuery.toLowerCase()) && !app.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading marketplace..." />
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center space-x-3">
            <Package className="w-8 h-8 text-primary-400" />
            <span>Marketplace</span>
          </h1>
          <p className="text-gray-400">Discover and install apps for your desktop</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-500"
            >
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Apps Grid */}
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Code className="w-5 h-5 text-primary-400" />
                      <h3 className="text-xl font-semibold">{app.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{app.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-700 rounded">{app.language}</span>
                      <span className="px-2 py-1 bg-gray-700 rounded">{app.category}</span>
                      {app.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span>{app.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Download className="w-3 h-3" />
                      <span>{app.downloads} downloads</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                    >
                      View
                    </button>
                    {installedApps.has(app.id) ? (
                      <button
                        onClick={() => handleUninstall(app)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                      >
                        Uninstall
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInstall(app)}
                        className="px-3 py-1 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm transition-colors flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Install</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No apps found.</p>
            <p className="text-sm mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* App Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-3xl h-5/6 flex flex-col border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center space-x-3">
                <Code className="w-7 h-7 text-primary-400" />
                <span>{selectedApp.name}</span>
              </h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <span className="text-2xl text-gray-400">&times;</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-sm custom-scrollbar pr-2">
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <p className="font-semibold text-gray-300 mb-2">Description:</p>
                <p className="text-gray-400">{selectedApp.description}</p>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <p className="font-semibold text-gray-300 mb-2">Details:</p>
                <div className="grid grid-cols-2 gap-2 text-gray-400">
                  <p><strong>Language:</strong> {selectedApp.language}</p>
                  <p><strong>Category:</strong> {selectedApp.category}</p>
                  <p><strong>Author:</strong> {selectedApp.author}</p>
                  <p><strong>Version:</strong> {selectedApp.version}</p>
                  <p><strong>Downloads:</strong> {selectedApp.downloads}</p>
                  {selectedApp.rating && <p><strong>Rating:</strong> {selectedApp.rating.toFixed(1)} / 5.0</p>}
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <p className="font-semibold text-gray-300 mb-2">Code Preview:</p>
                <pre className="whitespace-pre-wrap font-mono text-gray-200 bg-gray-950 p-3 rounded-md overflow-x-auto text-xs">
                  {selectedApp.code.substring(0, 500)}
                  {selectedApp.code.length > 500 && '...'}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Close
              </button>
              {installedApps.has(selectedApp.id) ? (
                <button
                  onClick={() => {
                    handleUninstall(selectedApp)
                    setSelectedApp(null)
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Uninstall
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleInstall(selectedApp)
                    setSelectedApp(null)
                  }}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Install</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

