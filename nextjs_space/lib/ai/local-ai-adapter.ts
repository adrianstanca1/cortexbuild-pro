import { ollamaClient } from "./ollama-client";
import { AIAdapter } from "../service-adapters";
import { AICompletionOptions, AIEmbeddingOptions, VisionOptions, AIResponse } from "./types";

export interface LocalAIModel {
  id: string;
  name: string;
  provider: "ollama" | "openrouter" | "cloud";
  type: ("chat" | "vision" | "embedding")[];
  size?: string;
  description?: string;
}

export const DEFAULT_MODELS: LocalAIModel[] = [
  {
    id: "llama3.1",
    name: "Llama 3.1 (8B)",
    provider: "ollama",
    type: ["chat"],
    size: "4.7GB",
    description: "Fast, capable general purpose model",
  },
  {
    id: "llava",
    name: "LLaVA 1.6 (13B)",
    provider: "ollama",
    type: ["vision", "chat"],
    size: "7.5GB",
    description: "Vision model for document OCR and image analysis",
  },
  {
    id: "nomic-embed-text",
    name: "Nomic Embed Text",
    provider: "ollama",
    type: ["embedding"],
    size: "275MB",
    description: "Efficient text embeddings for search",
  },
];

export class LocalAIAdapter {
  private useLocal: boolean = true; // Prefer local by default for optimization
  private cloudAdapter: AIAdapter;

  constructor() {
    this.cloudAdapter = new AIAdapter("PRODUCTION");
  }

  async complete(options: AICompletionOptions): Promise<AIResponse<string>> {
    // Try local first (optimization preference)
    if (this.useLocal) {
      const isAvailable = await ollamaClient.isAvailable();
      if (isAvailable) {
        const result = await ollamaClient.complete(options);
        if (result.success) return result;
      }
    }

    // Fallback to cloud only if local unavailable or explicitly disabled
    const cloudResult = await this.cloudAdapter.complete(options);
    return {
      success: cloudResult.success,
      data: cloudResult.data,
      error: cloudResult.error,
      responseTime: cloudResult.responseTime,
    };
  }

  async embed(options: AIEmbeddingOptions): Promise<AIResponse<{ embeddings: number[][] }>> {
    if (this.useLocal) {
      const isAvailable = await ollamaClient.isAvailable();
      if (isAvailable) {
        const result = await ollamaClient.embed(options);
        if (result.success && result.data) {
          return {
            success: true,
            data: { embeddings: result.data.embeddings },
            responseTime: result.responseTime,
          };
        }
      }
    }

    return {
      success: false,
      error: "Embeddings not available via local or cloud fallback",
    };
  }

  async vision(options: VisionOptions): Promise<AIResponse<{ description: string }>> {
    if (this.useLocal) {
      const isAvailable = await ollamaClient.isAvailable();
      if (isAvailable) {
        const result = await ollamaClient.vision(options);
        if (result.success && result.data) {
          return {
            success: true,
            data: { description: result.data.description },
            responseTime: result.responseTime,
          };
        }
      }
    }

    return {
      success: false,
      error: "Vision not available via local or cloud fallback",
    };
  }

  async getAvailableModels(): Promise<LocalAIModel[]> {
    const available: LocalAIModel[] = [];

    // Check Ollama models
    const ollamaModels = await ollamaClient.listModels();
    for (const model of DEFAULT_MODELS) {
      if (ollamaModels.some(m => m.startsWith(model.id))) {
        available.push({ ...model, available: true } as any);
      }
    }

    return available.length > 0 ? available : DEFAULT_MODELS;
  }

  async isLocalAvailable(): Promise<boolean> {
    return ollamaClient.isAvailable();
  }

  setUseLocal(value: boolean) {
    this.useLocal = value;
  }
}

export const localAIAdapter = new LocalAIAdapter();