import { useState, useEffect } from 'react'
import { File, Folder, FolderOpen, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { fileService } from '../../services/fileService'
import toast from 'react-hot-toast'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'directory'
  path: string
  children?: FileNode[]
}

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void
  selectedFile: string | undefined
}

export default function FileExplorer({ onFileSelect, selectedFile }: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const fileList = await fileService.listFiles()
      setFiles(fileList)
    } catch (error) {
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'directory') {
      toggleFolder(file.path)
    } else {
      onFileSelect(file.path)
    }
  }

  const handleCreateFile = async () => {
    const name = prompt('Enter file name:')
    if (!name) return

    try {
      await fileService.createFile(name, '')
      toast.success('File created')
      loadFiles()
    } catch (error) {
      toast.error('Failed to create file')
    }
  }

  const handleDeleteFile = async (file: FileNode, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete ${file.name}?`)) return

    try {
      await fileService.deleteFile(file.path)
      toast.success('File deleted')
      loadFiles()
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  const renderFileNode = (file: FileNode, level = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(file.path)
    const isSelected = selectedFile === file.path

    return (
      <div key={file.id}>
        <div
          onClick={() => handleFileClick(file)}
          className={`flex items-center space-x-2 p-2 cursor-pointer hover:bg-gray-700 rounded ${
            isSelected ? 'bg-primary-600' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {file.type === 'directory' ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-yellow-400" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-400" />
            )
          ) : (
            <File className="w-4 h-4 text-gray-400" />
          )}
          <span className="flex-1 text-sm truncate">{file.name}</span>
          {file.type === 'file' && (
            <button
              onClick={(e) => handleDeleteFile(file, e)}
              className="p-1 hover:bg-red-600 rounded opacity-0 hover:opacity-100 transition-opacity"
              title="Delete file"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {file.type === 'directory' && isExpanded && file.children && (
          <div>
            {file.children.map((child) => renderFileNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Files</h3>
        <div className="flex space-x-1">
          <button
            onClick={handleCreateFile}
            className="p-1 hover:bg-gray-700 rounded"
            title="New File"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={loadFiles}
            className="p-1 hover:bg-gray-700 rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center text-gray-500 text-sm py-4">Loading...</div>
        ) : files.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">No files</div>
        ) : (
          files.map((file) => renderFileNode(file))
        )}
      </div>
    </div>
  )
}

