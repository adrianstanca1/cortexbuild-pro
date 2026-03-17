// =====================================================
// AI Module Exports
// Centralized exports for AI providers and utilities
// =====================================================

// Types
export {
  AIProvider,
  AICompletionOptions,
  AIEmbeddingOptions,
  VisionOptions,
  AIResponse,
  AIModel,
  AIAdapter,
  UnifiedAIConfig,
} from './types';

// Providers
export { geminiProvider, default as GeminiProvider } from './gemini-provider';
export { ollamaClient, default as OllamaClient } from '../ollama-client';

// Adapters
export { localAIAdapter, LocalAIAdapter, DEFAULT_MODELS } from './local-ai-adapter';

// Re-export ollama types
export type {
  OllamaChatMessage,
  OllamaChatRequest,
  OllamaGenerateRequest,
  OllamaResponse,
  OllamaChatResponse,
} from '../ollama-client';
