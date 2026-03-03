import { useState, useEffect } from 'react'
import CodeEditor from '../components/code-editor/CodeEditor'
import OutputPanel from '../components/code-editor/OutputPanel'
import FileExplorer from '../components/file-manager/FileExplorer'
import { useCodeExecution } from '../hooks/useCodeExecution'
import { fileService } from '../services/fileService'
import { Play, Square, Trash2, Save, FileCode } from 'lucide-react'
import toast from 'react-hot-toast'

type Language = 'python' | 'javascript' | 'typescript'

const LANGUAGE_EXTENSIONS: Record<Language, string[]> = {
  python: ['.py'],
  javascript: ['.js', '.jsx'],
  typescript: ['.ts', '.tsx'],
}

export default function CodeInterpreter() {
  const [code, setCode] = useState('')
  const [selectedFile, setSelectedFile] = useState<string | undefined>(undefined)
  const [language, setLanguage] = useState<Language>('python')
  const [isSaving, setIsSaving] = useState(false)
  const { executeCode, output, isRunning, stopExecution } = useCodeExecution()

  // Get language from file extension
  const getLanguageFromFile = (fileName: string): Language => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'py') return 'python'
    if (ext === 'js' || ext === 'jsx') return 'javascript'
    if (ext === 'ts' || ext === 'tsx') return 'typescript'
    return 'python'
  }

  // Load file content when a file is selected
  useEffect(() => {
    if (selectedFile) {
      fileService
        .getFile(selectedFile)
        .then((file) => {
          if (file.content) {
            setCode(file.content)
            setLanguage(getLanguageFromFile(file.name))
          }
        })
        .catch((error) => {
          toast.error('Failed to load file')
          console.error('Error loading file:', error)
        })
    } else {
      setCode('')
    }
  }, [selectedFile])

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to execute')
      return
    }

    try {
      await executeCode(code, selectedFile, language)
    } catch (error) {
      toast.error('Failed to execute code')
    }
  }

  const handleStop = () => {
    stopExecution()
    toast.success('Execution stopped')
  }

  const handleClear = () => {
    if (code.trim() && !confirm('Are you sure you want to clear the editor?')) {
      return
    }
    setCode('')
    setSelectedFile(undefined)
    toast.success('Editor cleared')
  }

  const handleSave = async () => {
    if (!code.trim()) {
      toast.error('No code to save')
      return
    }

    if (selectedFile) {
      // Save existing file
      try {
        setIsSaving(true)
        await fileService.updateFile(selectedFile, code)
        toast.success('File saved successfully')
      } catch (error: any) {
        console.error('Failed to save file:', error)
        toast.error(error.response?.data?.message || 'Failed to save file')
      } finally {
        setIsSaving(false)
      }
    } else {
      // Create new file
      const fileName = prompt('Enter file name (e.g., script.py):')
      if (!fileName) return

      try {
        setIsSaving(true)
        const extension = fileName.split('.').pop()?.toLowerCase()
        const fileLanguage = getLanguageFromFile(fileName)
        const newFile = await fileService.createFile(fileName, code)
        setSelectedFile(newFile.path)
        setLanguage(fileLanguage)
        toast.success('File saved successfully')
      } catch (error: any) {
        console.error('Failed to save file:', error)
        toast.error(error.response?.data?.message || 'Failed to save file')
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Code Interpreter</h2>
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
            </select>
          </div>
          {selectedFile && (
            <span className="text-sm text-gray-400 px-2 py-1 bg-gray-700 rounded">
              {selectedFile}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={isSaving || !code.trim()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save file"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
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
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>Run</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <FileExplorer
            onFileSelect={(file) => {
              setSelectedFile(file)
            }}
            selectedFile={selectedFile}
          />
        </div>

        {/* Code Editor and Output */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={language}
              theme="vs-dark"
            />
          </div>
          <div className="h-64 border-t border-gray-700">
            <OutputPanel output={output} isRunning={isRunning} />
          </div>
        </div>
      </div>
    </div>
  )
}

