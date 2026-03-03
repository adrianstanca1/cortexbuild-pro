import { useEffect, useRef } from 'react'
import { Terminal, Loader2 } from 'lucide-react'

interface OutputPanelProps {
  output: string
  isRunning: boolean
}

export default function OutputPanel({ output, isRunning }: OutputPanelProps) {
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100">
      <div className="flex items-center space-x-2 p-2 border-b border-gray-700 bg-gray-800">
        <Terminal className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Output</span>
        {isRunning && (
          <Loader2 className="w-4 h-4 text-primary-400 animate-spin ml-2" />
        )}
      </div>
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm whitespace-pre-wrap"
        style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
      >
        {output || (
          <span className="text-gray-500">No output yet. Run your code to see results here.</span>
        )}
      </div>
    </div>
  )
}

