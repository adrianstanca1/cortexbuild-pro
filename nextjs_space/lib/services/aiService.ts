import { Message } from "@/lib/types";
import * as GeminiService from "./geminiService";
import * as OllamaClient from "./ollamaClient";

export enum AIProvider {
  GEMINI = 'gemini',
  OLLAMA = 'ollama'
}

export interface AIConfig {
  provider: AIProvider;
  model?: string;
  temperature?: number;
  topP?: number;
  responseMimeType?: string;
  systemInstruction?: string;
  thinkingBudget?: number;
  tools?: any[];
  toolConfig?: any;
  keepAlive?: string | number;
}

export interface UnifiedGenConfig {
  temperature?: number;
  topP?: number;
  responseMimeType?: string;
  systemInstruction?: string;
  thinkingBudget?: number;
  tools?: any[];
  toolConfig?: any;
  keepAlive?: string | number;
  model?: string;
  provider?: AIProvider;
}

export const checkAIProviderAvailability = async (
  provider: AIProvider
): Promise<boolean> => {
  switch (provider) {
    case AIProvider.GEMINI:
      return !!process.env.API_KEY || !!process.env.GEMINI_API_KEY;
    case AIProvider.OLLAMA:
      return await OllamaClient.checkOllamaAvailability();
    default:
      return false;
  }
};

export const listAvailableModels = async (
  provider: AIProvider
): Promise<string[]> => {
  switch (provider) {
    case AIProvider.GEMINI:
      return [
        'gemini-3-pro-preview',
        'gemini-3-flash-preview',
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-2.0-flash-exp'
      ];
    case AIProvider.OLLAMA:
      return await OllamaClient.listOllamaModels();
    default:
      return [];
  }
};

export const streamChatResponse = async (
  history: Message[],
  newMessage: string,
  imageData?: string,
  mimeType: string = 'image/jpeg',
  onChunk?: (text: string, metadata?: any) => void,
  config?: AIConfig
): Promise<any> => {
  const provider = config?.provider || 
    (process.env.DEFAULT_AI_PROVIDER === 'ollama' ? AIProvider.OLLAMA : AIProvider.GEMINI);
  
  const isAvailable = await checkAIProviderAvailability(provider);
  if (!isAvailable) {
    const fallbackProvider = provider === AIProvider.GEMINI ? AIProvider.OLLAMA : AIProvider.GEMINI;
    const isFallbackAvailable = await checkAIProviderAvailability(fallbackProvider);
    if (isFallbackAvailable) {
      console.warn(`${provider} unavailable, falling back to ${fallbackProvider}`);
      return streamChatResponse(history, newMessage, imageData, mimeType, onChunk, 
        {...config, provider: fallbackProvider});
    }
    throw new Error(`AI provider ${provider} is not available and no fallback is available`);
  }

  switch (provider) {
    case AIProvider.GEMINI: {
      const geminiConfig: GeminiService.ChatConfig = {
        model: config?.model,
        systemInstruction: config?.systemInstruction,
        thinkingBudget: config?.thinkingBudget,
        tools: config?.tools,
        toolConfig: config?.toolConfig,
        responseMimeType: config?.responseMimeType
      };
      
      return GeminiService.streamChatResponse(
        history,
        newMessage,
        imageData,
        mimeType,
        onChunk,
        geminiConfig
      );
    }
    
    case AIProvider.OLLAMA: {
      const ollamaConfig: OllamaClient.OllamaChatConfig = {
        model: config?.model,
        system: config?.systemInstruction,
        options: {
          temperature: config?.temperature,
          top_p: config?.topP,
        },
        keep_alive: config?.keepAlive
      };
      
      return OllamaClient.streamOllamaChatResponse(
        history,
        newMessage,
        imageData,
        mimeType,
        onChunk,
        ollamaConfig
      );
    }
    
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};

export const chatCompletion = async (
  history: Message[],
  newMessage: string,
  imageData?: string,
  mimeType: string = 'image/jpeg',
  config?: AIConfig
): Promise<{ text: string; model: string }> => {
  const provider = config?.provider || 
    (process.env.DEFAULT_AI_PROVIDER === 'ollama' ? AIProvider.OLLAMA : AIProvider.GEMINI);
  
  const isAvailable = await checkAIProviderAvailability(provider);
  if (!isAvailable) {
    const fallbackProvider = provider === AIProvider.GEMINI ? AIProvider.OLLAMA : AIProvider.GEMINI;
    const isFallbackAvailable = await checkAIProviderAvailability(fallbackProvider);
    if (isFallbackAvailable) {
      console.warn(`${provider} unavailable, falling back to ${fallbackProvider}`);
      return chatCompletion(history, newMessage, imageData, mimeType, 
        {...config, provider: fallbackProvider});
    }
    throw new Error(`AI provider ${provider} is not available and no fallback is available`);
  }

  switch (provider) {
    case AIProvider.GEMINI: {
      const geminiConfig: GeminiService.ChatConfig = {
        model: config?.model,
        systemInstruction: config?.systemInstruction,
        thinkingBudget: config?.thinkingBudget,
        tools: config?.tools,
        toolConfig: config?.toolConfig,
        responseMimeType: config?.responseMimeType
      };
      
      const result = await GeminiService.runRawPrompt(
        newMessage,
        geminiConfig,
        imageData,
        mimeType
      );
      
      return {
        text: result,
        model: config?.model || 'gemini-3-flash-preview'
      };
    }
    
    case AIProvider.OLLAMA: {
      const ollamaConfig: OllamaClient.OllamaChatConfig = {
        model: config?.model,
        system: config?.systemInstruction,
        options: {
          temperature: config?.temperature,
          top_p: config?.topP,
        },
        keep_alive: config?.keepAlive
      };
      
      const result = await OllamaClient.ollamaChatCompletion(
        history,
        newMessage,
        imageData,
        mimeType,
        ollamaConfig
      );
      
      return {
        text: result.text,
        model: result.model
      };
    }
    
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};

export const runPrompt = async (
  prompt: string,
  config?: UnifiedGenConfig,
  imageData?: string,
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  const provider = config?.provider || 
    (process.env.DEFAULT_AI_PROVIDER === 'ollama' ? AIProvider.OLLAMA : AIProvider.GEMINI);
  
  const isAvailable = await checkAIProviderAvailability(provider);
  if (!isAvailable) {
    const fallbackProvider = provider === AIProvider.GEMINI ? AIProvider.OLLAMA : AIProvider.GEMINI;
    const isFallbackAvailable = await checkAIProviderAvailability(fallbackProvider);
    if (isFallbackAvailable) {
      console.warn(`${provider} unavailable, falling back to ${fallbackProvider}`);
      return runPrompt(prompt, 
        {...config, provider: fallbackProvider}, 
        imageData, 
        mimeType);
    }
    throw new Error(`AI provider ${provider} is not available and no fallback is available`);
  }

  switch (provider) {
    case AIProvider.GEMINI: {
      const geminiConfig: GeminiService.GenConfig = {
        temperature: config?.temperature,
        topP: config?.topP,
        responseMimeType: config?.responseMimeType,
        systemInstruction: config?.systemInstruction,
        thinkingConfig: config?.thinkingBudget ? { thinkingBudget: config.thinkingBudget } : undefined,
        model: config?.model,
        tools: config?.tools,
        toolConfig: config?.toolConfig
      };
      
      return GeminiService.runRawPrompt(prompt, geminiConfig, imageData, mimeType);
    }
    
    case AIProvider.OLLAMA: {
      const ollamaConfig: OllamaClient.OllamaGenConfig = {
        temperature: config?.temperature,
        top_p: config?.topP,
        response_format: config?.responseMimeType ? { type: config.responseMimeType } : undefined,
        system: config?.systemInstruction,
        model: config?.model,
        options: {
          temperature: config?.temperature,
          top_p: config?.topP,
        },
        keep_alive: config?.keepAlive
      };
      
      return await OllamaClient.runOllamaPrompt(prompt, ollamaConfig, imageData, mimeType);
    }
    
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
};

export const getDefaultAIProvider = (): AIProvider => {
  return process.env.DEFAULT_AI_PROVIDER === 'ollama' ? AIProvider.OLLAMA : AIProvider.GEMINI;
};

export const getDefaultModel = (provider: AIProvider): string => {
  switch (provider) {
    case AIProvider.GEMINI:
      return process.env.DEFAULT_GEMINI_MODEL || 'gemini-3-pro-preview';
    case AIProvider.OLLAMA:
      return process.env.OLLAMA_MODEL || 'nemotron-3-super:latest';
    default:
      return 'gemini-3-pro-preview';
  }
};
