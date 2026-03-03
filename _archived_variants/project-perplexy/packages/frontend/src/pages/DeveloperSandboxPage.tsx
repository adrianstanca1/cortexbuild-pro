import { useState, useEffect, useCallback } from 'react'
import CodeEditor from '../components/code-editor/CodeEditor'
import OutputPanel from '../components/code-editor/OutputPanel'
import { useCodeExecution } from '../hooks/useCodeExecution'
import { fileService } from '../services/fileService'
import { marketplaceService } from '../services/marketplaceService'
import { Play, Square, Save, Upload, Code, FileCode, Package, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

type Language = 'python' | 'javascript' | 'typescript' | 'html' | 'css'

const LANGUAGE_EXTENSIONS: Record<Language, string[]> = {
  python: ['.py'],
  javascript: ['.js', '.jsx'],
  typescript: ['.ts', '.tsx'],
  html: ['.html', '.htm'],
  css: ['.css'],
}

interface AppTemplate {
  id: string
  name: string
  description: string
  language: Language
  code: string
  category: string
}

const APP_TEMPLATES: AppTemplate[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'Simple hello world application',
    language: 'python',
    code: 'print("Hello, World!")',
    category: 'basic',
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Simple calculator app',
    language: 'javascript',
    code: `function add(a, b) { return a + b; }\nfunction subtract(a, b) { return a - b; }\nfunction multiply(a, b) { return a * b; }\nfunction divide(a, b) { return a / b; }\n\nconsole.log("Calculator ready!");`,
    category: 'utility',
  },
  {
    id: 'web-app',
    name: 'Web App',
    description: 'Basic HTML web application',
    language: 'html',
    code: `<!DOCTYPE html>\n<html>\n<head>\n    <title>My App</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>`,
    category: 'web',
  },
]

export default function DeveloperSandboxPage() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<Language>('python')
  const [appName, setAppName] = useState('')
  const [appDescription, setAppDescription] = useState('')
  const [appCategory, setAppCategory] = useState('utility')
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const { executeCode, output, isRunning, stopExecution } = useCodeExecution()

  const loadTemplate = useCallback((template: AppTemplate) => {
    setCode(template.code)
    setLanguage(template.language)
    setAppName(template.name)
    setAppDescription(template.description)
    setAppCategory(template.category)
    toast.success(`Loaded template: ${template.name}`)
  }, [])

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to execute')
      return
    }

    try {
      await executeCode(code, undefined, language)
    } catch (error) {
      toast.error('Failed to execute code')
    }
  }

  const handleSave = async () => {
    if (!code.trim()) {
      toast.error('No code to save')
      return
    }

    if (!appName.trim()) {
      toast.error('Please enter an app name')
      return
    }

    try {
      setIsSaving(true)
      const fileName = `${appName}.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : 'html'}`
      await fileService.createFile(fileName, code)
      toast.success('App saved successfully')
    } catch (error: any) {
      console.error('Failed to save app:', error)
      toast.error(error.response?.data?.message || 'Failed to save app')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!code.trim()) {
      toast.error('No code to publish')
      return
    }

    if (!appName.trim()) {
      toast.error('Please enter an app name')
      return
    }

    if (!appDescription.trim()) {
      toast.error('Please enter an app description')
      return
    }

    try {
      setIsPublishing(true)
      await marketplaceService.publishApp({
        name: appName,
        description: appDescription,
        code,
        language,
        category: appCategory,
      })
      toast.success('App published to marketplace successfully!')
      setShowPublishModal(false)
      // Reset form
      setCode('')
      setAppName('')
      setAppDescription('')
    } catch (error: any) {
      console.error('Failed to publish app:', error)
      toast.error(error.response?.data?.message || 'Failed to publish app')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleStop = () => {
    stopExecution()
    toast.success('Execution stopped')
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Developer Sandbox</h2>
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-gray-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-gray-400" />
            <select
              value={appCategory}
              onChange={(e) => setAppCategory(e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="utility">Utility</option>
              <option value="web">Web App</option>
              <option value="automation">Automation</option>
              <option value="data">Data Processing</option>
              <option value="basic">Basic</option>
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={isSaving || !code.trim()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save app"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            onClick={() => setShowPublishModal(true)}
            disabled={!code.trim() || !appName.trim()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Publish to marketplace"
          >
            <Upload className="w-4 h-4" />
            <span>Publish</span>
          </button>
          {isRunning ? (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={!code.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>Run</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Templates Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-300">App Templates</h3>
          <div className="space-y-2">
            {APP_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => loadTemplate(template)}
                className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Code className="w-4 h-4 text-primary-400" />
                  <span className="font-medium text-sm">{template.name}</span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{template.description}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-gray-600 text-xs rounded text-gray-300">
                  {template.language}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor and Output */}
        <div className="flex-1 flex flex-col">
          {/* App Info */}
          <div className="bg-gray-800 border-b border-gray-700 p-3">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="App Name"
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-primary-500 flex-1 max-w-xs"
              />
              <input
                type="text"
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                placeholder="App Description"
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-primary-500 flex-1"
              />
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              theme="vs-dark"
            />
          </div>

          {/* Output Panel */}
          <div className="h-64 border-t border-gray-700">
            <OutputPanel output={output} isRunning={isRunning} />
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
              <Globe className="w-6 h-6 text-primary-400" />
              <span>Publish to Marketplace</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">App Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Enter app name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="Describe your app"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={appCategory}
                  onChange={(e) => setAppCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="utility">Utility</option>
                  <option value="web">Web App</option>
                  <option value="automation">Automation</option>
                  <option value="data">Data Processing</option>
                  <option value="basic">Basic</option>
                </select>
              </div>
              <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg p-3">
                <p className="text-sm text-yellow-300">
                  ⚠️ Your app will be reviewed before being published to the marketplace. This ensures security and quality standards.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || !appName.trim() || !appDescription.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

