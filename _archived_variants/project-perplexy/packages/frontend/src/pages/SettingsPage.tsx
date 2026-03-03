import { useState, useEffect } from 'react'
import { Save, User, Bell, Map, Globe, Moon, Sun } from 'lucide-react'
import toast from 'react-hot-toast'

interface Settings {
  userName: string
  userRole: 'manager' | 'foreman' | 'labour'
  region: string
  theme: 'dark' | 'light'
  notifications: boolean
  locationTracking: boolean
  updateInterval: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    userName: 'User',
    userRole: 'labour',
    region: 'london',
    theme: 'dark',
    notifications: true,
    locationTracking: true,
    updateInterval: 10,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedName = localStorage.getItem('userName')
    const savedRole = localStorage.getItem('userRole')
    const savedRegion = localStorage.getItem('selectedRegion')
    const savedTheme = localStorage.getItem('theme')
    const savedNotifications = localStorage.getItem('notifications')
    const savedLocationTracking = localStorage.getItem('locationTracking')
    const savedUpdateInterval = localStorage.getItem('updateInterval')

    if (savedName) setSettings((s) => ({ ...s, userName: savedName }))
    if (savedRole && ['manager', 'foreman', 'labour'].includes(savedRole)) {
      setSettings((s) => ({ ...s, userRole: savedRole as 'manager' | 'foreman' | 'labour' }))
    }
    if (savedRegion) setSettings((s) => ({ ...s, region: savedRegion }))
    if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
      setSettings((s) => ({ ...s, theme: savedTheme as 'dark' | 'light' }))
    }
    if (savedNotifications !== null) {
      setSettings((s) => ({ ...s, notifications: savedNotifications === 'true' }))
    }
    if (savedLocationTracking !== null) {
      setSettings((s) => ({ ...s, locationTracking: savedLocationTracking === 'true' }))
    }
    if (savedUpdateInterval) {
      setSettings((s) => ({ ...s, updateInterval: parseInt(savedUpdateInterval, 10) }))
    }
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)

      // Save to localStorage
      localStorage.setItem('userName', settings.userName)
      localStorage.setItem('userRole', settings.userRole)
      localStorage.setItem('selectedRegion', settings.region)
      localStorage.setItem('theme', settings.theme)
      localStorage.setItem('notifications', settings.notifications.toString())
      localStorage.setItem('locationTracking', settings.locationTracking.toString())
      localStorage.setItem('updateInterval', settings.updateInterval.toString())

      // Apply theme
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const UK_REGIONS = [
    { id: 'london', name: 'London' },
    { id: 'south-east', name: 'South East' },
    { id: 'south-west', name: 'South West' },
    { id: 'midlands', name: 'Midlands' },
    { id: 'north', name: 'North England' },
    { id: 'scotland', name: 'Scotland' },
    { id: 'wales', name: 'Wales' },
    { id: 'northern-ireland', name: 'Northern Ireland' },
  ]

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Manage your application preferences</p>
        </div>

        {/* User Settings */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-primary-500 bg-opacity-20 rounded-lg">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold">User Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">User Name</label>
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={settings.userRole}
                onChange={(e) =>
                  setSettings({ ...settings, userRole: e.target.value as 'manager' | 'foreman' | 'labour' })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="manager">Manager</option>
                <option value="foreman">Foreman</option>
                <option value="labour">Labour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">UK Region</label>
              <select
                value={settings.region}
                onChange={(e) => setSettings({ ...settings, region: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
              >
                {UK_REGIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500 bg-opacity-20 rounded-lg">
              {settings.theme === 'dark' ? (
                <Moon className="w-5 h-5 text-purple-400" />
              ) : (
                <Sun className="w-5 h-5 text-purple-400" />
              )}
            </div>
            <h2 className="text-xl font-semibold">Appearance</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                    settings.theme === 'dark'
                      ? 'border-primary-500 bg-primary-500 bg-opacity-20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <Moon className="w-5 h-5 mx-auto mb-2" />
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                    settings.theme === 'light'
                      ? 'border-primary-500 bg-primary-500 bg-opacity-20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <Sun className="w-5 h-5 mx-auto mb-2" />
                  <span className="text-sm font-medium">Light</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Map Settings */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
              <Map className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">Map & Location</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Location Tracking</label>
                <p className="text-sm text-gray-400">Enable real-time location tracking</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, locationTracking: !settings.locationTracking })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.locationTracking ? 'bg-primary-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.locationTracking ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Location Update Interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.updateInterval}
                onChange={(e) =>
                  setSettings({ ...settings, updateInterval: parseInt(e.target.value, 10) })
                }
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
              />
              <p className="text-sm text-gray-400 mt-1">
                How often to update your location (1-60 minutes)
              </p>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-yellow-500 bg-opacity-20 rounded-lg">
              <Bell className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Enable Notifications</label>
                <p className="text-sm text-gray-400">Receive notifications for updates</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.notifications ? 'bg-primary-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

