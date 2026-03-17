import { ollamaClient } from "../ollama-client";
import { geminiProvider } from "./gemini-provider";
import {
  AICompletionOptions,
  AIEmbeddingOptions,
  VisionOptions,
  AIResponse,
  AIProvider,
} from "./types";

export interface LocalAIModel {
  id: string;
  name: string;
  provider: "ollama" | "gemini" | "openrouter" | "cloud";
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
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    type: ["chat", "vision"],
    description: "Google's fast multimodal model",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    provider: "gemini",
    type: ["chat"],
    description: "Lightweight Gemini model for efficient tasks",
  },
];

export class LocalAIAdapter {
  private defaultProvider: AIProvider;

  constructor() {
    // Determine default provider from environment
    const envProvider = process.env.AI_PROVIDER || process.env.DEFAULT_AI_PROVIDER;
    this.defaultProvider =
      envProvider === "gemini" ? AIProvider.GEMINI :
      envProvider === "ollama" ? AIProvider.OLLAMA :
      AIProvider.OLLAMA; // Default to Ollama for backwards compatibility
  }

  /**
   * Get the configured provider
   */
  private getProvider(options?: { provider?: AIProvider }): AIProvider {
    return options?.provider || this.defaultProvider;
  }

  /**
   * Check if a specific provider is available
   */
  async isProviderAvailable(provider: AIProvider): Promise<boolean> {
    switch (provider) {
      case AIProvider.GEMINI:
        return await geminiProvider.isAvailable();
      case AIProvider.OLLAMA:
        return await ollamaClient.isAvailable();
      default:
        return false;
    }
  }

  async complete(options: AICompletionOptions): Promise<AIResponse<string>> {
    const provider = this.getProvider(options);
    const startTime = Date.now();

    // Check if the selected provider is available
    const isAvailable = await this.isProviderAvailable(provider);

    if (!isAvailable) {
      // Try fallback to the other provider
      const fallbackProvider =
        provider === AIProvider.GEMINI ? AIProvider.OLLAMA : AIProvider.GEMINI;
      const fallbackAvailable = await this.isProviderAvailable(fallbackProvider);

      if (fallbackAvailable) {
        console.warn(`Provider ${provider} unavailable, falling back to ${fallbackProvider}`);
        return this.complete({ ...options, provider: fallbackProvider });
      }

      return {
        success: false,
        error: `AI provider ${provider} is not available and no fallback is available`,
      };
    }

    // Route to the appropriate provider
    switch (provider) {
      case AIProvider.GEMINI:
        return geminiProvider.complete({
          prompt: options.prompt,
          model: options.model,
          temperature: options.temperature,
          thinkingBudget: options.thinkingBudget,
        });

      case AIProvider.OLLAMA:
        return ollamaClient.complete({
          prompt: options.prompt,
          model: options.model,
          temperature: options.temperature,
        });

      default:
        return {
          success: false,
          error: `Unsupported AI provider: ${provider}`,
          responseTime: Date.now() - startTime,
        };
    }
  }

  async embed(
    options: AIEmbeddingOptions,
  ): Promise<AIResponse<{ embeddings: number[][] }>> {
    const provider = this.getProvider(options);

    // Gemini doesn't support embeddings, always use Ollama
    if (provider === AIProvider.GEMINI) {
      // Try Ollama for embeddings
      const ollamaAvailable = await ollamaClient.isAvailable();
      if (ollamaAvailable) {
        return ollamaClient.embed(options);
      }
      return {
        success: false,
        error: "Embeddings not available. Gemini does not support embeddings; Ollama is unavailable.",
      };
    }

    // Use Ollama for embeddings
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

    return {
      success: false,
      error: "Embeddings not available via Ollama",
    };
  }

  async vision(
    options: VisionOptions,
  ): Promise<AIResponse<{ description: string }>> {
    const provider = this.getProvider(options);
    const startTime = Date.now();

    // Check provider availability
    const isAvailable = await this.isProviderAvailable(provider);

    if (!isAvailable) {
      // Try fallback
      const fallbackProvider =
        provider === AIProvider.GEMINI ? AIProvider.OLLAMA : AIProvider.GEMINI;
      const fallbackAvailable = await this.isProviderAvailable(fallbackProvider);

      if (fallbackAvailable) {
        return this.vision({ ...options, provider: fallbackProvider });
      }

      return {
        success: false,
        error: `Vision provider ${provider} is not available`,
      };
    }

    // Route to the appropriate provider
    switch (provider) {
      case AIProvider.GEMINI:
        return geminiProvider.vision({
          image: options.image,
          prompt: options.prompt,
          model: options.model,
        });

      case AIProvider.OLLAMA:
        return ollamaClient.vision({
          image: options.image,
          prompt: options.prompt,
          model: options.model,
        });

      default:
        return {
          success: false,
          error: `Unsupported AI provider: ${provider}`,
          responseTime: Date.now() - startTime,
        };
    }
  }

  async getAvailableModels(): Promise<LocalAIModel[]> {
    const available: LocalAIModel[] = [];

    // Check Ollama models
    const ollamaAvailable = await ollamaClient.isAvailable();
    if (ollamaAvailable) {
      const ollamaModels = await ollamaClient.listModels();
      for (const model of DEFAULT_MODELS.filter(m => m.provider === "ollama")) {
        if (ollamaModels.some((m) => m.startsWith(model.id))) {
          available.push({ ...model, available: true } as any);
        }
      }
    }

    // Check Gemini models
    const geminiAvailable = await geminiProvider.isAvailable();
    if (geminiAvailable) {
      const geminiModels = await geminiProvider.listModels();
      for (const model of DEFAULT_MODELS.filter(m => m.provider === "gemini")) {
        if (geminiModels.includes(model.id)) {
          available.push({ ...model, available: true } as any);
        }
      }
    }

    return available.length > 0 ? available : DEFAULT_MODELS;
  }

  async isLocalAvailable(): Promise<boolean> {
    return ollamaClient.isAvailable();
  }

  async isGeminiAvailable(): Promise<boolean> {
    return geminiProvider.isAvailable();
  }

  setDefaultProvider(provider: AIProvider) {
    this.defaultProvider = provider;
  }

  getDefaultProvider(): AIProvider {
    return this.defaultProvider;
  }
}

export const localAIAdapter = new LocalAIAdapter();
