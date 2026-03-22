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
export { ollamaClient, default as OllamaClient } from '@/lib/ollama-client';

// Adapters
export { localAIAdapter, LocalAIAdapter, DEFAULT_MODELS } from './local-ai-adapter';

// Re-export ollama types
export type {
  OllamaChatMessage,
  OllamaChatRequest,
  OllamaGenerateRequest,
  OllamaResponse,
  OllamaChatResponse,
} from '@/lib/ollama-client';

// Ollama Integration (from unified codebase)
export {
  chat as ollamaChat,
  stream as ollamaStream,
  checkConnection as checkOllamaConnection,
  loadModel,
  listModels,
  generate as ollamaGenerate,
  streamGenerate as ollamaStreamGenerate,
  OllamaError,
} from './ollama';
export type {
  Message as OllamaMessage,
  ChatOptions as OllamaChatOptions,
  StreamOptions as OllamaStreamOptions,
  ChatResponse as OllamaChatResponse,
} from './ollama';
export { OLLAMA_BASE_URL, DEFAULT_MODEL } from './ollama';

// Construction Domain Prompts
export {
  SYSTEM_PROMPTS,
  ANALYSIS_PROMPTS,
  buildChatPrompt,
  buildRFIAnalysisPrompt,
  buildSafetyAnalysisPrompt,
  buildRiskAssessmentPrompt,
  buildScheduleAnalysisPrompt,
  buildCostAnalysisPrompt,
} from './prompts';
