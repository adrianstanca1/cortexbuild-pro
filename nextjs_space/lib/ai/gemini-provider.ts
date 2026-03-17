// =====================================================
// GEMINI AI PROVIDER
// Google Generative AI integration for CortexBuildPro
// =====================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiChatConfig {
  model?: string;
  systemInstruction?: string;
  thinkingBudget?: number;
  tools?: any[];
  responseMimeType?: string;
  temperature?: number;
  topP?: number;
}

export interface GeminiGenerateRequest {
  model: string;
  contents: { parts: { text: string }[] } | { role: string; parts: { text: string }[] }[];
  config?: {
    temperature?: number;
    topP?: number;
    responseMimeType?: string;
    systemInstruction?: string;
    thinkingConfig?: { thinkingBudget: number };
    tools?: any[];
    toolConfig?: any;
  };
}

export interface GeminiResponse {
  text: string;
  model: string;
  candidates?: Array<{
    content: { parts: { text: string }[] };
    groundingMetadata?: any;
  }>;
}

class GeminiProvider {
  private apiKey: string;
  private client: GoogleGenerativeAI | null;
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.defaultModel = defaultModel || process.env.DEFAULT_GEMINI_MODEL || "gemini-2.0-flash";

    if (!this.apiKey) {
      this.client = null;
    } else {
      this.client = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Check if Gemini API is available (key configured)
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  /**
   * Generate text from a prompt using models.generateContent
   */
  async generateText(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      topP?: number;
      systemInstruction?: string;
      thinkingBudget?: number;
      responseMimeType?: string;
    },
  ): Promise<string> {
    const model = options?.model || this.defaultModel;

    if (!this.client) {
      throw new Error("Gemini API key not configured");
    }

    try {
      const config: any = {};

      if (options?.temperature !== undefined) {
        config.temperature = options.temperature;
      }
      if (options?.topP !== undefined) {
        config.topP = options.topP;
      }
      if (options?.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options?.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }

      // Apply thinking budget only to Gemini models that support it
      if (options?.thinkingBudget && model.includes("gemini")) {
        config.thinkingConfig = { thinkingBudget: options.thinkingBudget };
      }

      const response = await this.client.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config,
      });

      return response.text || "";
    } catch (error) {
      console.error("Gemini generateText error:", error);
      throw error;
    }
  }

  /**
   * Chat with Gemini using chat sessions
   */
  async chat(
    messages: { role: "user" | "system" | "assistant"; content: string }[],
    options?: {
      model?: string;
      temperature?: number;
      systemInstruction?: string;
      thinkingBudget?: number;
    },
  ): Promise<string> {
    const model = options?.model || this.defaultModel;

    if (!this.client) {
      throw new Error("Gemini API key not configured");
    }

    try {
      // Extract system message
      const systemMessage = messages.find(m => m.role === "system");
      const chatMessages = messages.filter(m => m.role !== "system");

      // Convert to Gemini format
      const history: GeminiMessage[] = chatMessages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const chatConfig: any = {};
      if (options?.systemInstruction) {
        chatConfig.systemInstruction = options.systemInstruction;
      } else if (systemMessage) {
        chatConfig.systemInstruction = systemMessage.content;
      }
      if (options?.temperature !== undefined) {
        chatConfig.temperature = options.temperature;
      }
      if (options?.thinkingBudget && model.includes("gemini")) {
        chatConfig.thinkingConfig = { thinkingBudget: options.thinkingBudget };
      }

      const chat = this.client.chats.create({
        model,
        config: chatConfig,
        history: history.length > 0 ? history : undefined,
      });

      // Get the last user message
      const lastUserMessage = chatMessages.filter(m => m.role === "user").pop();
      if (!lastUserMessage) {
        throw new Error("No user message in chat history");
      }

      const result = await chat.sendMessage({ message: [{ text: lastUserMessage.content }] });
      return result.text || "";
    } catch (error) {
      console.error("Gemini chat error:", error);
      throw error;
    }
  }

  /**
   * Analyze document content with optional custom prompt
   */
  async analyzeDocument(
    content: string,
    customPrompt?: string,
    model?: string,
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
      thinkingBudget: 4096,
    });
  }

  /**
   * Stream response - yields text chunks
   */
  async *streamChat(
    messages: { role: "user" | "system" | "assistant"; content: string }[],
    options?: {
      model?: string;
      temperature?: number;
      systemInstruction?: string;
      thinkingBudget?: number;
    },
  ): AsyncGenerator<string> {
    const model = options?.model || this.defaultModel;

    if (!this.client) {
      throw new Error("Gemini API key not configured");
    }

    try {
      // Extract system message
      const systemMessage = messages.find(m => m.role === "system");
      const chatMessages = messages.filter(m => m.role !== "system");

      // Convert to Gemini format
      const history: GeminiMessage[] = chatMessages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const chatConfig: any = {};
      if (options?.systemInstruction) {
        chatConfig.systemInstruction = options.systemInstruction;
      } else if (systemMessage) {
        chatConfig.systemInstruction = systemMessage.content;
      }
      if (options?.temperature !== undefined) {
        chatConfig.temperature = options.temperature;
      }
      if (options?.thinkingBudget && model.includes("gemini")) {
        chatConfig.thinkingConfig = { thinkingBudget: options.thinkingBudget };
      }

      const chat = this.client.chats.create({
        model,
        config: chatConfig,
        history: history.length > 0 ? history : undefined,
      });

      // Get the last user message
      const lastUserMessage = chatMessages.filter(m => m.role === "user").pop();
      if (!lastUserMessage) {
        throw new Error("No user message in chat history");
      }

      const result = await chat.sendMessageStream({ message: [{ text: lastUserMessage.content }] });

      for await (const chunk of result) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error("Gemini streaming error:", error);
      throw error;
    }
  }

  /**
   * List available models (common Gemini models)
   */
  async getAvailableModels(): Promise<string[]> {
    if (!this.client) {
      return [this.defaultModel];
    }

    try {
      // Note: Gemini SDK doesn't have a direct listModels for generative models
      // Return common available models
      return [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
      ];
    } catch (error) {
      console.warn("Failed to get available models:", error);
      return [this.defaultModel];
    }
  }

  /**
   * List available models (alias)
   */
  async listModels(): Promise<string[]> {
    return this.getAvailableModels();
  }

  /**
   * Complete a prompt (wrapper for generateText)
   */
  async complete(options: {
    prompt: string;
    model?: string;
    temperature?: number;
    thinkingBudget?: number;
  }): Promise<{
    success: boolean;
    data?: string;
    error?: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    try {
      const result = await this.generateText(options.prompt, {
        model: options.model,
        temperature: options.temperature,
        thinkingBudget: options.thinkingBudget,
      });
      return {
        success: true,
        data: result,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate embeddings (Gemini doesn't natively support embeddings, fallback)
   */
  async embed(options: { input: string | string[]; model?: string }): Promise<{
    success: boolean;
    data?: { embeddings: number[][] };
    error?: string;
    responseTime?: number;
  }> {
    return {
      success: false,
      error: "Gemini does not support embeddings. Use Ollama with nomic-embed-text model.",
    };
  }

  /**
   * Vision model for image analysis
   */
  async vision(options: {
    image: string; // base64
    prompt?: string;
    model?: string;
  }): Promise<{
    success: boolean;
    data?: { description: string };
    error?: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    if (!this.client) {
      return {
        success: false,
        error: "Gemini API key not configured",
      };
    }

    try {
      // Parse base64 image
      const base64Data = options.image.includes(",")
        ? options.image.split(",")[1]
        : options.image;
      const mimeType = options.image.match(/^data:(.+);base64/)?.[1] || "image/jpeg";

      const prompt = options.prompt || "Describe this image in detail.";

      const response = await this.client.models.generateContent({
        model,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } },
          ],
        },
        config: {
          temperature: 0.5,
        },
      });

      return {
        success: true,
        data: { description: response.text || "" },
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get the current API key
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Get the default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }
}

// Export singleton instance
export const geminiProvider = new GeminiProvider();

export default GeminiProvider;
