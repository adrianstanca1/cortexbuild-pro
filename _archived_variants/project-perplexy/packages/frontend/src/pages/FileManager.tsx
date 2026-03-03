import { useState, useEffect, useCallback } from 'react'
import FileExplorer from '../components/file-manager/FileExplorer'
import CodeEditor from '../components/code-editor/CodeEditor'
import { fileService, FileNode } from '../services/fileService'
import { Save, X, FileText, Download, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FileManager() {
    const [selectedFile, setSelectedFile] = useState<string | undefined>(undefined)
    const [fileContent, setFileContent] = useState<string>('')
    const [fileInfo, setFileInfo] = useState<FileNode | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [originalContent, setOriginalContent] = useState<string>('')
    const [refreshKey, setRefreshKey] = useState(0)

    // Load file content when a file is selected
    useEffect(() => {
        if (selectedFile) {
            loadFileContent(selectedFile)
        } else {
            setFileContent('')
            setFileInfo(null)
            setHasChanges(false)
        }
    }, [selectedFile])

    // Load file content
    const loadFileContent = async (filePath: string) => {
        try {
            setIsLoading(true)
            const file = await fileService.getFile(filePath)
            setFileInfo(file)
            setFileContent(file.content || '')
            setOriginalContent(file.content || '')
            setHasChanges(false)
        } catch (error: any) {
            console.error('Failed to load file:', error)
            toast.error(error.response?.data?.message || 'Failed to load file')
            setSelectedFile(undefined)
        } finally {
            setIsLoading(false)
        }
    }

    // Save file
    const handleSave = useCallback(async () => {
        if (!selectedFile) return

        try {
            setIsSaving(true)
            await fileService.updateFile(selectedFile, fileContent)
            setOriginalContent(fileContent)
            setHasChanges(false)
            toast.success('File saved successfully')
        } catch (error: any) {
            console.error('Failed to save file:', error)
            toast.error(error.response?.data?.message || 'Failed to save file')
        } finally {
            setIsSaving(false)
        }
    }, [selectedFile, fileContent])

    // Handle content change
    const handleContentChange = (content: string) => {
        setFileContent(content)
        setHasChanges(content !== originalContent)
    }

    // Handle file deletion
    const handleDelete = async () => {
        if (!selectedFile) return

        if (!confirm(`Delete file "${selectedFile}"?`)) return

        try {
            await fileService.deleteFile(selectedFile)
            toast.success('File deleted successfully')
            setSelectedFile(undefined)
            setFileContent('')
            setFileInfo(null)
            setHasChanges(false)
        } catch (error: any) {
            console.error('Failed to delete file:', error)
            toast.error(error.response?.data?.message || 'Failed to delete file')
        }
    }

    // Handle download
    const handleDownload = () => {
        if (!selectedFile || !fileContent) return

        const blob = new Blob([fileContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = selectedFile.split('/').pop() || 'file'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Get file language based on extension
    const getFileLanguage = (fileName: string): string => {
        const ext = fileName.split('.').pop()?.toLowerCase()
        const languageMap: Record<string, string> = {
            py: 'python',
            js: 'javascript',
            ts: 'typescript',
            jsx: 'javascript',
            tsx: 'typescript',
            json: 'json',
            html: 'html',
            css: 'css',
            md: 'markdown',
            txt: 'plaintext',
            csv: 'csv',
        }
        return languageMap[ext || ''] || 'plaintext'
    }

    // Close file
    const handleClose = () => {
        if (hasChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
                return
            }
        }
        setSelectedFile(undefined)
        setFileContent('')
        setFileInfo(null)
        setHasChanges(false)
    }

    // Handle file upload
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            const uploadedFile = await fileService.uploadFile(file)
            toast.success(`File '${uploadedFile.name}' uploaded successfully`)
            // Trigger file explorer refresh
            setRefreshKey((prev) => prev + 1)
        } catch (error: any) {
            console.error('Failed to upload file:', error)
            toast.error(error.response?.data?.message || 'Failed to upload file')
        } finally {
            // Reset input
            event.target.value = ''
        }
    }

    return (
        <div className="flex h-full bg-gray-900 text-white">
            {/* File Explorer Sidebar */}
            <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold mb-3">Files</h3>
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                            multiple={false}
                        />
                        <div className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors text-sm">
                            <Upload className="w-4 h-4" />
                            <span>Upload File</span>
                        </div>
                    </label>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <FileExplorer
                        key={refreshKey}
                        onFileSelect={setSelectedFile}
                        selectedFile={selectedFile}
                    />
                </div>
            </div>

            {/* File Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedFile ? (
                    <>
                        {/* File Header */}
                        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-primary-400" />
                                <div>
                                    <h2 className="text-lg font-semibold">{fileInfo?.name || selectedFile}</h2>
                                    {fileInfo && (
                                        <p className="text-sm text-gray-400">
                                            {fileInfo.size ? `${(fileInfo.size / 1024).toFixed(2)} KB` : 'Unknown size'} •{' '}
                                            {fileInfo.modified
                                                ? new Date(fileInfo.modified).toLocaleString()
                                                : 'Unknown date'}
                                        </p>
                                    )}
                                </div>
                                {hasChanges && (
                                    <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">Unsaved</span>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handleDownload}
                                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2"
                                    title="Download file"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2"
                                    title="Delete file"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-2"
                                    title="Close file"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges || isSaving}
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Save file"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                                </button>
                            </div>
                        </div>

                        {/* File Editor */}
                        <div className="flex-1 min-h-0">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mx-auto mb-4"></div>
                                        <p className="text-gray-400">Loading file...</p>
                                    </div>
                                </div>
                            ) : (
                                <CodeEditor
                                    value={fileContent}
                                    onChange={handleContentChange}
                                    language={getFileLanguage(fileInfo?.name || selectedFile)}
                                    theme="vs-dark"
                                />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                            <p className="text-lg">Select a file to view or edit</p>
                            <p className="text-sm mt-2">Use the file explorer on the left to browse files</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
