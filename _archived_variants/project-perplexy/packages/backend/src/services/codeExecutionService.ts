import { exec, ChildProcess } from 'child_process'
import { promisify } from 'util'
import { ApiError } from '../utils/ApiError.js'
import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import os from 'os'
import { executionHistoryService } from './executionHistoryService.js'
import logger from '../config/logger.js'

const execAsync = promisify(exec)

interface ExecutionResult {
  output: string
  error?: string
  status: 'success' | 'error' | 'running'
  executionTime?: number
}

let currentProcess: ChildProcess | null = null
let isRunning = false
const TEMP_DIR = path.join(os.tmpdir(), 'code-interpreter')

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

export const codeExecutionService = {
  async executeCode(
    code: string,
    filePath?: string,
    language: string = 'python'
  ): Promise<ExecutionResult> {
    if (isRunning) {
      throw new ApiError('Code execution is already in progress', 409)
    }

    isRunning = true
    const startTime = Date.now()

    try {
      let result: ExecutionResult
      if (language === 'python') {
        result = await this.executePython(code, startTime, filePath)
      } else if (language === 'javascript' || language === 'typescript') {
        result = await this.executeJavaScript(code, startTime, filePath)
      } else {
        throw new ApiError(`Unsupported language: ${language}`, 400)
      }

      // Save to execution history (async, don't wait)
      executionHistoryService
        .addExecution({
          code,
          language,
          filePath,
          output: result.output,
          error: result.error,
          status: result.status,
          executionTime: result.executionTime,
        })
        .catch((error) => {
          logger.error('Failed to save execution history:', { error: error.message })
        })

      return result
    } catch (error: any) {
      // Save error to history as well
      const errorResult: ExecutionResult = {
        output: '',
        error: error.message || 'Execution failed',
        status: 'error',
        executionTime: Date.now() - startTime,
      }
      executionHistoryService
        .addExecution({
          code,
          language,
          filePath,
          output: errorResult.output,
          error: errorResult.error,
          status: errorResult.status,
          executionTime: errorResult.executionTime,
        })
        .catch((err) => {
          logger.error('Failed to save execution history:', { error: err.message })
        })
      throw error
    } finally {
      isRunning = false
      currentProcess = null
    }
  },

  async executePython(
    code: string,
    startTime: number,
    _filePath?: string
  ): Promise<ExecutionResult> {
    await ensureTempDir()
    const tempFile = path.join(TEMP_DIR, `temp_${randomUUID()}.py`)

    try {
      // Write code to temporary file
      await fs.writeFile(tempFile, code, 'utf-8')

      // Execute Python code (try python3 first, fallback to python)
      let command = `python3 -u "${tempFile}"`
      let result: ExecutionResult

      try {
        const { stdout, stderr } = await execAsync(command, {
          timeout: 30000, // 30 second timeout
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        })
        const executionTime = Date.now() - startTime

        result = {
          output: stdout,
          error: stderr || undefined,
          status: stderr ? 'error' : 'success',
          executionTime,
        }
      } catch (error: any) {
        // If python3 fails, try python
        if (error.code === 'ENOENT') {
          command = `python -u "${tempFile}"`
          try {
            const { stdout, stderr } = await execAsync(command, {
              timeout: 30000,
              maxBuffer: 1024 * 1024 * 10,
            })
            const executionTime = Date.now() - startTime

            result = {
              output: stdout,
              error: stderr || undefined,
              status: stderr ? 'error' : 'success',
              executionTime,
            }
          } catch (fallbackError: any) {
            const executionTime = Date.now() - startTime
            result = {
              output: fallbackError.stdout || '',
              error: fallbackError.stderr || fallbackError.message || 'Execution failed',
              status: 'error',
              executionTime,
            }
          }
        } else {
          const executionTime = Date.now() - startTime
          result = {
            output: error.stdout || '',
            error: error.stderr || error.message || 'Execution failed',
            status: 'error',
            executionTime,
          }
        }
      }

      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {
        // Ignore cleanup errors
      })

      return result
    } catch (error: any) {
      const executionTime = Date.now() - startTime

      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {
        // Ignore cleanup errors
      })

      return {
        output: error.stdout || '',
        error: error.stderr || error.message || 'Execution failed',
        status: 'error',
        executionTime,
      }
    }
  },

  async executeJavaScript(
    code: string,
    startTime: number,
    _filePath?: string
  ): Promise<ExecutionResult> {
    try {
      // For JavaScript execution, we'll use Node.js eval in a sandboxed environment
      // In production, you should use a proper sandboxing solution
      const wrappedCode = `
        (async () => {
          try {
            ${code}
          } catch (error) {
            console.error(error.message);
            process.exit(1);
          }
        })();
      `

      const { stdout, stderr } = await execAsync(
        `node -e "${wrappedCode.replace(/"/g, '\\"')}"`,
        { timeout: 30000 } // 30 second timeout
      )

      const executionTime = Date.now() - startTime

      if (stderr) {
        return {
          output: stdout || stderr,
          error: stderr,
          status: 'error',
          executionTime,
        }
      }

      return {
        output: stdout,
        status: 'success',
        executionTime,
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime
      return {
        output: error.stdout || '',
        error: error.stderr || error.message,
        status: 'error',
        executionTime,
      }
    }
  },

  async stopExecution(): Promise<void> {
    if (currentProcess && isRunning) {
      currentProcess.kill('SIGTERM')
      currentProcess = null
      isRunning = false
    }
  },
}

