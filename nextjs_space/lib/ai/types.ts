// AI-related types
export interface AICompletionOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface AIEmbeddingOptions {
  input: string | string[];
  model?: string;
}

export interface VisionOptions {
  image: string; // base64 encoded image
  prompt?: string;
  model?: string;
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
