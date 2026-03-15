import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { createLogger, logger } from '../lib/logger'

describe('Logger', () => {
  // Store original NODE_ENV
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    // Reset console mocks before each test
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv
  })

  describe('createLogger', () => {
    test('should create a logger with module name', () => {
      const testLogger = createLogger('test-module')
      expect(testLogger).toBeDefined()
    })

    test('should log error messages in all environments', () => {
      process.env.NODE_ENV = 'production'
      const testLogger = createLogger('test-module')

      testLogger.error('Test error message')

      expect(console.error).toHaveBeenCalled()
    })

    test('should log warning messages in all environments', () => {
      process.env.NODE_ENV = 'production'
      const testLogger = createLogger('test-module')

      testLogger.warn('Test warning message')

      expect(console.warn).toHaveBeenCalled()
    })

    test('should suppress debug and info in production', () => {
      process.env.NODE_ENV = 'production'
      const testLogger = createLogger('test-module')

      testLogger.debug('Test debug message')
      testLogger.info('Test info message')

      expect(console.debug).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
    })

    test('should show debug and info in development', () => {
      process.env.NODE_ENV = 'development'
      const testLogger = createLogger('test-module')

      testLogger.debug('Test debug message')
      testLogger.info('Test info message')

      expect(console.debug).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalled()
    })

    test('should include module name in log output', () => {
      const testLogger = createLogger('my-module')

      testLogger.error('Test message')

      const call = (console.error as ReturnType<typeof vi.spyOn>).mock.calls[0]
      const message = call[0]

      expect(message).toContain('[ERROR]')
      expect(message).toContain('[my-module]')
    })

    test('should include timestamp when enabled', () => {
      const testLogger = createLogger({ module: 'test-module', timestamp: true })

      testLogger.error('Test message')

      const call = (console.error as ReturnType<typeof vi.spyOn>).mock.calls[0]
      const message = call[0]

      // Should contain ISO timestamp format
      expect(message).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('should pass additional arguments to console methods', () => {
      const testLogger = createLogger('test-module')
      const error = new Error('Test error')

      testLogger.error('Error occurred', error)

      const call = (console.error as ReturnType<typeof vi.spyOn>).mock.calls[0]
      expect(call[1]).toBe(error)
    })
  })

  describe('default logger', () => {
    test('should be exported and usable', () => {
      expect(logger).toBeDefined()
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.info).toBe('function')
      expect(typeof logger.debug).toBe('function')
    })
  })
})