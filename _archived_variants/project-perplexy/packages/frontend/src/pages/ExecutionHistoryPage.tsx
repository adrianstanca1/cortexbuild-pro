import { useState, useEffect, useCallback } from 'react'
import { History, Trash2, Code, Clock, CheckCircle, XCircle } from 'lucide-react'
import { executionHistoryService, ExecutionHistory } from '../services/executionHistoryService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SearchBar from '../components/common/SearchBar'
import toast from 'react-hot-toast'

export default function ExecutionHistoryPage() {
    const [history, setHistory] = useState<ExecutionHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedExecution, setSelectedExecution] = useState<ExecutionHistory | null>(null)

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = useCallback(async () => {
        try {
            setLoading(true)
            const executionHistory = await executionHistoryService.getExecutionHistory(100)
            setHistory(executionHistory)
        } catch (error) {
            console.error('Failed to load execution history:', error)
            toast.error('Failed to load execution history')
        } finally {
            setLoading(false)
        }
    }, [])

    const handleClearHistory = async () => {
        if (!confirm('Are you sure you want to clear all execution history? This action cannot be undone.')) {
            return
        }

        try {
            await executionHistoryService.clearHistory()
            setHistory([])
            toast.success('Execution history cleared')
        } catch (error) {
            console.error('Failed to clear history:', error)
            toast.error('Failed to clear execution history')
        }
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
    }

    const filteredHistory = history.filter((execution) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            execution.code.toLowerCase().includes(query) ||
            execution.output.toLowerCase().includes(query) ||
            execution.language.toLowerCase().includes(query) ||
            execution.filePath?.toLowerCase().includes(query)
        )
    })

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading execution history..." />
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Execution History</h1>
                        <p className="text-gray-400">View past code execution results</p>
                    </div>
                    <button
                        onClick={handleClearHistory}
                        disabled={history.length === 0}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear History</span>
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <SearchBar
                        placeholder="Search execution history..."
                        onSearch={handleSearch}
                        className="max-w-md"
                    />
                </div>

                {/* History List */}
                {filteredHistory.length > 0 ? (
                    <div className="space-y-4">
                        {filteredHistory.map((execution) => (
                            <div
                                key={execution.id}
                                className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-primary-500 transition-colors cursor-pointer"
                                onClick={() => setSelectedExecution(execution)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        {execution.status === 'success' ? (
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        )}
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {execution.filePath || `Execution ${execution.id.slice(0, 8)}`}
                                            </h3>
                                            <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                                <div className="flex items-center space-x-1">
                                                    <Code className="w-4 h-4" />
                                                    <span className="capitalize">{execution.language}</span>
                                                </div>
                                                {execution.executionTime && (
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{execution.executionTime}ms</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center space-x-1">
                                                    <History className="w-4 h-4" />
                                                    <span>{execution.timestamp.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Code Preview */}
                                <div className="mb-3">
                                    <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto max-h-32 text-gray-300">
                                        {execution.code.slice(0, 200)}
                                        {execution.code.length > 200 && '...'}
                                    </pre>
                                </div>

                                {/* Output Preview */}
                                {execution.output && (
                                    <div className="mb-2">
                                        <p className="text-xs text-gray-400 mb-1">Output:</p>
                                        <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto max-h-24 text-green-300">
                                            {execution.output.slice(0, 150)}
                                            {execution.output.length > 150 && '...'}
                                        </pre>
                                    </div>
                                )}

                                {/* Error Preview */}
                                {execution.error && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Error:</p>
                                        <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto max-h-24 text-red-300">
                                            {execution.error.slice(0, 150)}
                                            {execution.error.length > 150 && '...'}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">
                            {searchQuery ? 'No executions found' : 'No execution history yet'}
                        </p>
                        {!searchQuery && (
                            <p className="text-sm">Execute some code to see execution history</p>
                        )}
                    </div>
                )}

                {/* Execution Detail Modal */}
                {selectedExecution && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedExecution(null)}
                    >
                        <div
                            className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold">Execution Details</h2>
                                <button
                                    onClick={() => setSelectedExecution(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Execution Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Language</p>
                                        <p className="font-medium capitalize">{selectedExecution.language}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Status</p>
                                        <p className="font-medium capitalize">{selectedExecution.status}</p>
                                    </div>
                                    {selectedExecution.executionTime && (
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Execution Time</p>
                                            <p className="font-medium">{selectedExecution.executionTime}ms</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Timestamp</p>
                                        <p className="font-medium">{selectedExecution.timestamp.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Code */}
                                <div>
                                    <p className="text-sm text-gray-400 mb-2">Code</p>
                                    <pre className="bg-gray-900 p-4 rounded text-sm overflow-x-auto text-gray-300">
                                        {selectedExecution.code}
                                    </pre>
                                </div>

                                {/* Output */}
                                {selectedExecution.output && (
                                    <div>
                                        <p className="text-sm text-gray-400 mb-2">Output</p>
                                        <pre className="bg-gray-900 p-4 rounded text-sm overflow-x-auto text-green-300">
                                            {selectedExecution.output}
                                        </pre>
                                    </div>
                                )}

                                {/* Error */}
                                {selectedExecution.error && (
                                    <div>
                                        <p className="text-sm text-gray-400 mb-2">Error</p>
                                        <pre className="bg-gray-900 p-4 rounded text-sm overflow-x-auto text-red-300">
                                            {selectedExecution.error}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

