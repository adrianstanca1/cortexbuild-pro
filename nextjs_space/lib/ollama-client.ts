// =====================================================
// OLLAMA AI CLIENT
// Local LLM integration for CortexBuildPro
// =====================================================

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  temperature?: number;
  top_k?: number;
  top_p?: number;
}

export interface OllamaChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  temperature?: number;
}

export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaChatResponse {
  model: string;
  message: OllamaChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl?: string, defaultModel?: string) {
    this.baseUrl = baseUrl || process.env.OLLAMA_URL || "http://host.docker.internal:11434";
    this.defaultModel = defaultModel || process.env.OLLAMA_MODEL || "qwen2.5:7b";
  }

  /**
   * Generate text from a prompt using /api/generate
   */
  async generateText(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      topK?: number;
      topP?: number;
      stream?: boolean;
    }
  ): Promise<string> {
    const model = options?.model || this.defaultModel;
    
    try {
      const requestBody: OllamaGenerateRequest = {
        model,
        prompt,
        stream: options?.stream ?? false,
        temperature: options?.temperature ?? 0.7,
        top_k: options?.topK ?? 40,
        top_p: options?.topP ?? 0.9,
      };

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`
        );
      }

      if (options?.stream) {
        // For streaming, return the response body directly
        return response.body as any;
      }

      // For non-streaming, read the full response
      const data = (await response.json()) as OllamaResponse;
      return data.response || "";
    } catch (error) {
      console.error("Ollama generateText error:", error);
      throw error;
    }
  }

  /**
   * Chat with Ollama using /api/chat
   */
  async chat(
    messages: OllamaChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      stream?: boolean;
    }
  ): Promise<string> {
    const model = options?.model || this.defaultModel;

    try {
      const requestBody: OllamaChatRequest = {
        model,
        messages,
        stream: options?.stream ?? false,
        temperature: options?.temperature ?? 0.7,
      };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`
        );
      }

      if (options?.stream) {
        // For streaming, return the response body directly
        return response.body as any;
      }

      // For non-streaming, read the full response
      const data = (await response.json()) as OllamaChatResponse;
      return data.message.content || "";
    } catch (error) {
      console.error("Ollama chat error:", error);
      throw error;
    }
  }

  /**
   * Analyze document content with optional custom prompt
   */
  async analyzeDocument(
    content: string,
    customPrompt?: string,
    model?: string
  ): Promise<string> {
    const prompt =
      customPrompt ||
      `Please analyze the following construction document and provide:
1. Summary of key information
2. Any risks or issues identified
3. Action items or recommendations

Document Content:
---
${content}
---

Analysis:`;

    return this.generateText(prompt, {
      model: model || this.defaultModel,
      temperature: 0.5,
    });
  }

  /**
   * Stream response - converts Ollama streaming format to SSE
   */
  async *streamChat(
    messages: OllamaChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
    }
  ): AsyncGenerator<string> {
    const model = options?.model || this.defaultModel;

    try {
      const requestBody: OllamaChatRequest = {
        model,
        messages,
        stream: true,
        temperature: options?.temperature ?? 0.7,
      };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line) as OllamaChatResponse;
            if (json.message?.content) {
              yield json.message.content;
            }
          } catch (e) {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Ollama streaming error:", error);
      throw error;
    }
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.warn("Ollama availability check failed:", error);
      return false;
    }
  }

  /**
   * List available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
      });

      if (!response.ok) {
        return [this.defaultModel];
      }

      const data = (await response.json()) as { models: Array<{ name: string }> };
      return data.models?.map((m) => m.name) || [this.defaultModel];
    } catch (error) {
      console.warn("Failed to get available models:", error);
      return [this.defaultModel];
    }
  }
}

  /**
   * List available models (alias for getAvailableModels)
   */
  async listModels(): Promise<string[]> {
    return this.getAvailableModels();
  }

  /**
   * Complete a prompt (wrapper for generateText for compatibility)
   */
  async complete(options: { prompt: string; model?: string; temperature?: number }): Promise<{ success: boolean; data?: string; error?: string; responseTime?: number }> {
    const startTime = Date.now();
    try {
      const result = await this.generateText(options.prompt, {
        model: options.model,
        temperature: options.temperature,
      });
      return { success: true, data: result, responseTime: Date.now() - startTime };
    } catch (error) {
      return { success: false, error: String(error), responseTime: Date.now() - startTime };
    }
  }

  /**
   * Generate embeddings using nomic-embed-text or similar model
   */
  async embed(options: { input: string | string[]; model?: string }): Promise<{ success: boolean; data?: { embeddings: number[][] }; error?: string; responseTime?: number }> {
    const startTime = Date.now();
    const model = options.model || "nomic-embed-text";

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          input: options.input,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings error: ${response.status}`);
      }

      const data = await response.json();
      const embeddings = Array.isArray(data.embeddings) ? data.embeddings : [data.embedding];
      return { success: true, data: { embeddings }, responseTime: Date.now() - startTime };
    } catch (error) {
      return { success: false, error: String(error), responseTime: Date.now() - startTime };
    }
  }

  /**
   * Vision model for image analysis (uses llava or similar)
   */
  async vision(options: { image: string; prompt?: string; model?: string }): Promise<{ success: boolean; data?: { description: string }; error?: string; responseTime?: number }> {
    const startTime = Date.now();
    const model = options.model || "llava";

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: options.prompt || "Describe this image in detail.",
          images: [options.image],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama vision error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: { description: data.response || "" }, responseTime: Date.now() - startTime };
    } catch (error) {
      return { success: false, error: String(error), responseTime: Date.now() - startTime };
    }
  }
}

// Export singleton instance
export const ollamaClient = new OllamaClient();

export default OllamaClient;

