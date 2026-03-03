import { Editor } from '@monaco-editor/react'
import { useRef } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: string
  readOnly?: boolean
}

export default function CodeEditor({
  value,
  onChange,
  language = 'python',
  theme = 'vs-dark',
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
    })
  }

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        theme={theme}
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          fontSize: 14,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  )
}

