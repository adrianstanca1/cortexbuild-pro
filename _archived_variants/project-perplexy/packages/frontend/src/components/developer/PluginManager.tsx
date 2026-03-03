/**
 * Plugin Manager Component
 * Manage and configure plugins
 */

import { useState, useEffect } from 'react'
import { Package, Plus, Trash2, Settings, Play, Square } from 'lucide-react'
import toast from 'react-hot-toast'

interface Plugin {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  enabled: boolean
  permissions?: string[]
}

export default function PluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      // Load from plugin registry
      const response = await fetch('/api/v1/plugins')
      const data = await response.json()
      setPlugins(data.plugins || [])
    } catch (error: any) {
      toast.error('Failed to load plugins')
    } finally {
      setLoading(false)
    }
  }

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      await fetch(`/api/v1/plugins/${pluginId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      
      setPlugins((prev) =>
        prev.map((p) => (p.id === pluginId ? { ...p, enabled } : p))
      )
      toast.success(`Plugin ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error: any) {
      toast.error('Failed to toggle plugin')
    }
  }

  const uninstallPlugin = async (pluginId: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin?')) {
      return
    }

    try {
      await fetch(`/api/v1/plugins/${pluginId}`, {
        method: 'DELETE',
      })
      
      setPlugins((prev) => prev.filter((p) => p.id !== pluginId))
      toast.success('Plugin uninstalled')
    } catch (error: any) {
      toast.error('Failed to uninstall plugin')
    }
  }

  if (loading) {
    return <div className="p-6">Loading plugins...</div>
  }

  return (
    <div className="p-6 bg-gray-900 text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" />
          Plugin Manager
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 rounded hover:bg-primary-700">
          <Plus className="w-4 h-4" />
          Install Plugin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{plugin.name}</h3>
                <p className="text-sm text-gray-400">v{plugin.version}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  plugin.enabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                {plugin.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>

            {plugin.description && (
              <p className="text-sm text-gray-300 mb-3">{plugin.description}</p>
            )}

            {plugin.author && (
              <p className="text-xs text-gray-500 mb-3">By {plugin.author}</p>
            )}

            {plugin.permissions && plugin.permissions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {plugin.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-xs bg-gray-700 px-2 py-1 rounded"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => togglePlugin(plugin.id, !plugin.enabled)}
                className={`flex-1 px-3 py-2 rounded text-sm ${
                  plugin.enabled
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {plugin.enabled ? (
                  <>
                    <Square className="w-4 h-4 inline mr-1" />
                    Disable
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 inline mr-1" />
                    Enable
                  </>
                )}
              </button>
              <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded">
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => uninstallPlugin(plugin.id)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

