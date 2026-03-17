// AI-related types

export enum AIProvider {
  GEMINI = "gemini",
  OLLAMA = "ollama",
}

export interface AICompletionOptions {
  prompt: string;
  model?: string;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  thinkingBudget?: number;
}

export interface AIEmbeddingOptions {
  input: string | string[];
  model?: string;
  provider?: AIProvider;
}

export interface VisionOptions {
  image: string; // base64 encoded image
  prompt?: string;
  model?: string;
  provider?: AIProvider;
}

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  responseTime?: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: string[];
}

export interface AIAdapter {
  complete(options: AICompletionOptions): Promise<AIResponse<string>>;
  embed(
    options: AIEmbeddingOptions,
  ): Promise<AIResponse<{ embeddings: number[][] }>>;
  vision(options: VisionOptions): Promise<AIResponse<{ description: string }>>;
}

export interface UnifiedAIConfig {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  topP?: number;
  responseMimeType?: string;
  systemInstruction?: string;
  thinkingBudget?: number;
}
