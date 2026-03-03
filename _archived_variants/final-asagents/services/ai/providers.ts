import { GoogleGenerativeAI } from '@google/genai';
import OpenAI from 'openai';

// AI Provider Types
export type AIProvider = 'openai' | 'gemini' | 'copilot' | 'anthropic';
export type MessageRole = 'system' | 'user' | 'assistant';
export type MediaType = 'text' | 'image' | 'audio' | 'video' | 'file';

// Unified Message Interface
export interface AIMessage {
  id: string;
  role: MessageRole;
  content: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  provider?: AIProvider;
  language?: string;
  codeLanguage?: string;
}

// AI Provider Configuration
export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  capabilities: {
    text: boolean;
    image: boolean;
    audio: boolean;
    video: boolean;
    code: boolean;
    realtime: boolean;
  };
}

// Provider Configurations
export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 4000,
    capabilities: {
      text: true,
      image: true,
      audio: true,
      video: false,
      code: true,
      realtime: true
    }
  },
  gemini: {
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 4000,
    capabilities: {
      text: true,
      image: true,
      audio: true,
      video: true,
      code: true,
      realtime: false
    }
  },
  copilot: {
    model: 'gpt-4-copilot',
    temperature: 0.3,
    maxTokens: 2000,
    capabilities: {
      text: true,
      image: false,
      audio: false,
      video: false,
      code: true,
      realtime: true
    }
  },
  anthropic: {
    model: 'claude-3-opus',
    temperature: 0.7,
    maxTokens: 4000,
    capabilities: {
      text: true,
      image: true,
      audio: false,
      video: false,
      code: true,
      realtime: false
    }
  }
};

// Response Interface
export interface AIResponse {
  id: string;
  provider: AIProvider;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  model?: string;
  timestamp: Date;
  language?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

// Multimodal Input Interface
export interface MultimodalInput {
  text?: string;
  images?: File[] | string[];
  audio?: File | string;
  video?: File | string;
  files?: File[];
  language?: string;
  context?: Record<string, any>;
}

// Abstract AI Provider Interface
export abstract class AIProviderBase {
  protected config: AIProviderConfig;
  protected provider: AIProvider;

  constructor(provider: AIProvider, config?: Partial<AIProviderConfig>) {
    this.provider = provider;
    this.config = { ...AI_PROVIDERS[provider], ...config };
  }

  abstract sendMessage(
    messages: AIMessage[],
    input?: MultimodalInput
  ): Promise<AIResponse>;

  abstract streamMessage(
    messages: AIMessage[],
    input?: MultimodalInput,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse>;

  abstract analyzeMedia(
    mediaUrl: string,
    mediaType: MediaType,
    prompt?: string
  ): Promise<AIResponse>;

  getCapabilities() {
    return this.config.capabilities;
  }

  supportsMediaType(mediaType: MediaType): boolean {
    switch (mediaType) {
      case 'text': return this.config.capabilities.text;
      case 'image': return this.config.capabilities.image;
      case 'audio': return this.config.capabilities.audio;
      case 'video': return this.config.capabilities.video;
      default: return false;
    }
  }
}

// Gemini Provider Implementation
export class GeminiProvider extends AIProviderBase {
  private readonly client?: GoogleGenerativeAI;

  constructor(apiKey?: string, config?: Partial<AIProviderConfig>) {
    super('gemini', config);
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  async sendMessage(messages: AIMessage[], input?: MultimodalInput): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = this.client.getGenerativeModel({ 
        model: this.config.model || 'gemini-1.5-pro' 
      });

      // Convert messages to Gemini format
      const prompt = this.formatMessages(messages, input);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return {
        id: crypto.randomUUID(),
        provider: 'gemini',
        content: response.text(),
        timestamp: new Date(),
        model: this.config.model,
        metadata: {
          candidates: response.candidates,
          promptFeedback: response.promptFeedback
        }
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  async streamMessage(
    messages: AIMessage[],
    input?: MultimodalInput,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Gemini API key not configured');
    }

    const model = this.client.getGenerativeModel({ 
      model: this.config.model || 'gemini-1.5-pro' 
    });

    const prompt = this.formatMessages(messages, input);
    const result = await model.generateContentStream(prompt);

    let fullContent = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullContent += chunkText;
      onChunk(chunkText);
    }

    return {
      id: crypto.randomUUID(),
      provider: 'gemini',
      content: fullContent,
      timestamp: new Date(),
      model: this.config.model
    };
  }

  async analyzeMedia(mediaUrl: string, mediaType: MediaType, prompt?: string): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Gemini API key not configured');
    }

    const model = this.client.getGenerativeModel({ 
      model: 'gemini-1.5-pro' 
    });

    let parts: any[] = [];
    
    if (mediaType === 'image') {
      // Handle image analysis
      const response = await fetch(mediaUrl);
      const imageData = await response.arrayBuffer();
      
      parts = [
        { text: prompt || 'Analyze this image' },
        {
          inlineData: {
            data: Buffer.from(imageData).toString('base64'),
            mimeType: 'image/jpeg'
          }
        }
      ];
    }

    const result = await model.generateContent(parts);
    const response = await result.response;

    return {
      id: crypto.randomUUID(),
      provider: 'gemini',
      content: response.text(),
      timestamp: new Date(),
      model: 'gemini-1.5-pro'
    };
  }

  private formatMessages(messages: AIMessage[], input?: MultimodalInput): string {
    let prompt = '';
    
    // Add system messages
    const systemMessages = messages.filter(m => m.role === 'system');
    if (systemMessages.length > 0) {
      prompt += systemMessages.map(m => m.content).join('\n\n') + '\n\n';
    }

    // Add conversation history
    const conversationMessages = messages.filter(m => m.role !== 'system');
    for (const message of conversationMessages) {
      const rolePrefix = message.role === 'user' ? 'Human: ' : 'Assistant: ';
      prompt += `${rolePrefix}${message.content}\n\n`;
    }

    // Add current input if provided
    if (input?.text) {
      prompt += `Human: ${input.text}\n\nAssistant: `;
    }

    return prompt;
  }
}

// OpenAI Provider Implementation
export class OpenAIProvider extends AIProviderBase {
  private readonly client?: OpenAI;

  constructor(apiKey?: string, config?: Partial<AIProviderConfig>) {
    super('openai', config);
    if (apiKey) {
      this.client = new OpenAI({
        apiKey: apiKey
      });
    }
  }

  async sendMessage(messages: AIMessage[], input?: MultimodalInput): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const openaiMessages = this.formatMessages(messages, input);
      
      const completion = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4-turbo-preview',
        messages: openaiMessages,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 4000,
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No response content from OpenAI');
      }

      return {
        id: completion.id,
        provider: 'openai',
        content: choice.message.content,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined,
        finishReason: choice.finish_reason || undefined,
        model: completion.model,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async streamMessage(
    messages: AIMessage[],
    input?: MultimodalInput,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const openaiMessages = this.formatMessages(messages, input);
      
      const stream = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4-turbo-preview',
        messages: openaiMessages,
        temperature: this.config.temperature || 0.7,
        max_tokens: this.config.maxTokens || 4000,
        stream: true,
      });

      let fullContent = '';
      let responseId = '';
      let model = '';
      let finishReason = '';

      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        if (choice?.delta?.content) {
          const content = choice.delta.content;
          fullContent += content;
          onChunk(content);
        }
        
        if (chunk.id) responseId = chunk.id;
        if (chunk.model) model = chunk.model;
        if (choice?.finish_reason) finishReason = choice.finish_reason;
      }

      return {
        id: responseId || crypto.randomUUID(),
        provider: 'openai',
        content: fullContent,
        finishReason: finishReason || undefined,
        model: model,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw error;
    }
  }

  async analyzeMedia(mediaUrl: string, mediaType: MediaType, prompt?: string): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    if (mediaType !== 'image') {
      throw new Error('OpenAI currently only supports image analysis');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt || 'Analyze this image and describe what you see.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: mediaUrl
                }
              }
            ]
          }
        ],
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.7
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No response content from OpenAI vision');
      }

      return {
        id: completion.id,
        provider: 'openai',
        content: choice.message.content,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined,
        model: completion.model,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('OpenAI vision API error:', error);
      throw error;
    }
  }

  private formatMessages(messages: AIMessage[], input?: MultimodalInput): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    for (const message of messages) {
      openaiMessages.push({
        role: message.role as 'system' | 'user' | 'assistant',
        content: message.content
      });
    }

    // Add current input if provided
    if (input?.text) {
      openaiMessages.push({
        role: 'user',
        content: input.text
      });
    }

    return openaiMessages;
  }
}

// Copilot Provider Implementation (basic placeholder)
export class CopilotProvider extends AIProviderBase {
  constructor(config?: Partial<AIProviderConfig>) {
    super('copilot', config);
  }

  async sendMessage(messages: AIMessage[], input?: MultimodalInput): Promise<AIResponse> {
    // Mock implementation - would integrate with GitHub Copilot Chat API
    const lastMessage = messages[messages.length - 1]?.content || input?.text || '';
    const isCodeRelated = lastMessage.includes('code') || lastMessage.includes('function') || 
                         lastMessage.includes('class') || lastMessage.includes('implement');

    const mockResponse = isCodeRelated 
      ? `// Mock Copilot code suggestion for: ${lastMessage}\n\n` +
        `function mockSuggestion() {\n  // This would provide AI-powered code suggestions\n  return "Generated by Copilot";\n}`
      : `Mock Copilot response: This would provide development-focused assistance for: ${lastMessage}`;

    return {
      id: crypto.randomUUID(),
      provider: 'copilot',
      content: mockResponse,
      timestamp: new Date(),
      model: this.config.model,
      metadata: { 
        status: 'mock_response',
        note: 'Copilot provider needs GitHub API integration'
      }
    };
  }

  async streamMessage(
    messages: AIMessage[],
    input?: MultimodalInput,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    const response = await this.sendMessage(messages, input);
    
    // Simulate streaming by chunking the response
    const words = response.content.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise(resolve => setTimeout(resolve, 30)); // Faster for code suggestions
    }

    return response;
  }

  async analyzeMedia(mediaUrl: string, mediaType: MediaType, prompt?: string): Promise<AIResponse> {
    throw new Error('Copilot does not support media analysis - it focuses on code assistance');
  }
}

// Provider Factory
export class AIProviderFactory {
  static createProvider(
    provider: AIProvider,
    apiKey?: string,
    config?: Partial<AIProviderConfig>
  ): AIProviderBase {
    switch (provider) {
      case 'gemini':
        return new GeminiProvider(apiKey, config);
      case 'openai':
        return new OpenAIProvider(apiKey, config);
      case 'copilot':
        return new CopilotProvider(config);
      case 'anthropic':
        return new AnthropicProvider(apiKey, config);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}

// Anthropic Provider Implementation (basic placeholder)
export class AnthropicProvider extends AIProviderBase {
  constructor(apiKey?: string, config?: Partial<AIProviderConfig>) {
    super('anthropic', config);
    // Note: Anthropic SDK would be initialized here when implemented
  }

  async sendMessage(messages: AIMessage[], input?: MultimodalInput): Promise<AIResponse> {
    // Fallback to mock response for now - would implement Anthropic Claude API
    const mockResponse = `This is a mock response from Anthropic Claude. The Anthropic provider is not yet fully implemented but would integrate with Claude API here.

Input received: ${input?.text || messages[messages.length - 1]?.content || 'No input'}`;

    return {
      id: crypto.randomUUID(),
      provider: 'anthropic',
      content: mockResponse,
      timestamp: new Date(),
      model: this.config.model,
      metadata: { 
        status: 'mock_response',
        note: 'Anthropic provider needs full implementation'
      }
    };
  }

  async streamMessage(
    messages: AIMessage[],
    input?: MultimodalInput,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    // Simulate streaming for mock response
    const mockResponse = `This is a mock streaming response from Anthropic Claude.`;
    const words = mockResponse.split(' ');
    
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay
    }

    return {
      id: crypto.randomUUID(),
      provider: 'anthropic',
      content: mockResponse,
      timestamp: new Date(),
      model: this.config.model
    };
  }

  async analyzeMedia(mediaUrl: string, mediaType: MediaType, prompt?: string): Promise<AIResponse> {
    if (mediaType !== 'image') {
      throw new Error('Anthropic currently supports image analysis only');
    }

    return {
      id: crypto.randomUUID(),
      provider: 'anthropic',
      content: `Mock image analysis: This would analyze the image at ${mediaUrl} with Claude's vision capabilities. Prompt: ${prompt || 'No specific prompt provided'}`,
      timestamp: new Date(),
      model: this.config.model
    };
  }
}