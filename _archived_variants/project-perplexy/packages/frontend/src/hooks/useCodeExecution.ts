import { useState, useCallback } from 'react'
import { codeService } from '../services/codeService'
import toast from 'react-hot-toast'

export function useCodeExecution() {
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeCode = useCallback(async (code: string, filePath?: string, language?: string) => {
    setIsRunning(true)
    setError(null)
    setOutput('')

    try {
      // For now, we'll use a simple HTTP request
      // In a real app, you might want to use WebSockets for streaming output
      const result = await codeService.executeCode(code, filePath, language)
      
      if (result.error) {
        setError(result.error)
        setOutput(result.error)
        toast.error('Execution failed')
      } else {
        setOutput(result.output)
        toast.success('Code executed successfully')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to execute code'
      setError(errorMessage)
      setOutput(`Error: ${errorMessage}`)
      toast.error(errorMessage)
    } finally {
      setIsRunning(false)
    }
  }, [])

  const stopExecution = useCallback(async () => {
    try {
      await codeService.stopExecution()
      setIsRunning(false)
    } catch (err) {
      toast.error('Failed to stop execution')
    }
  }, [])

  return {
    output,
    error,
    isRunning,
    executeCode,
    stopExecution,
  }
}

