import { Message } from "@/lib/types";

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'nemotron-3-super:latest';

export interface OllamaChatConfig {
  model?: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  keep_alive?: string | number;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
    seed?: number;
  };
}

export interface OllamaGenConfig {
  temperature?: number;
  top_p?: number;
  response_format?: { type: string };
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  keep_alive?: string | number;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
    seed?: number;
  };
  model?: string;
}

export const checkOllamaAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`);
    return response.ok;
  } catch (error) {
    console.warn('Ollama service unavailable:', error);
    return false;
  }
};

export const listOllamaModels = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.models.map((model: any) => model.name);
  } catch (error) {
    console.error('Error listing Ollama models:', error);
    return [];
  }
};

export const streamOllamaChatResponse = async (
  history: Message[],
  newMessage: string,
  imageData?: string,
  mimeType: string = 'image/jpeg',
  onChunk?: (text: string, metadata?: any) => void,
  configOverride?: OllamaChatConfig
): Promise<any> => {
  try {
    const isAvailable = await checkOllamaAvailability();
    if (!isAvailable) {
      throw new Error('Ollama service is not available. Please ensure Ollama is running.');
    }

    const promptParts: string[] = [];
    
    if (configOverride?.system) {
      promptParts.push(`System: ${configOverride.system}`);
    }
    
    history
      .filter(msg => !msg.isThinking && msg.id !== 'intro')
      .forEach(msg => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        promptParts.push(`${role}: ${msg.text}`);
      });
    
    promptParts.push(`User: ${newMessage}`);
    
    let images: string[] = [];
    if (imageData) {
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      images.push(base64Data);
    }

    const payload = {
      model: configOverride?.model || OLLAMA_MODEL,
      prompt: promptParts.join('\n'),
      stream: true,
      images: images.length > 0 ? images : undefined,
      format: 'json',
      options: {
        temperature: configOverride?.options?.temperature ?? 0.7,
        top_p: configOverride?.options?.top_p ?? 0.9,
        ...(configOverride?.options ?? {})
      },
      ...(configOverride?.keep_alive && { keep_alive: configOverride.keep_alive })
    };

    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    if (payload.options) {
      Object.keys(payload.options).forEach(key => payload.options[key] === undefined && delete payload.options[key]);
    }

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader from Ollama');
    }

    let accumulatedText = '';
    let finalMetadata: any = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkText = new TextDecoder().decode(value);
      const lines = chunkText.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            accumulatedText += data.response;
            if (onChunk) {
              onChunk(data.response, {
                ...data,
                model: data.model,
                created_at: data.created_at,
                done: data.done
              });
            }
          }
          
          if (data.done) {
            finalMetadata = {
              model: data.model,
              created_at: data.created_at,
              done: data.done,
              total_duration: data.total_duration,
              load_duration: data.load_duration,
              prompt_eval_count: data.prompt_eval_count,
              eval_count: data.eval_count,
              eval_duration: data.eval_duration
            };
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (finalMetadata.done) break;
    }

    return {
      text: accumulatedText,
      model: configOverride?.model || OLLAMA_MODEL,
      done: true,
      metadata: finalMetadata
    };

  } catch (error) {
    console.error('Ollama chat error:', error);
    throw error;
  }
};

export const ollamaChatCompletion = async (
  history: Message[],
  newMessage: string,
  imageData?: string,
  mimeType: string = 'image/jpeg',
  configOverride?: OllamaChatConfig
): Promise<{ text: string; model: string }> => {
  try {
    const response = await streamOllamaChatResponse(
      history, 
      newMessage, 
      imageData, 
      mimeType, 
      (text, metadata) => {},
      configOverride
    );
    
    return {
      text: response.text,
      model: response.model
    };
  } catch (error) {
    console.error('Ollama completion error:', error);
    throw error;
  }
};

export const runOllamaPrompt = async (
  prompt: string,
  config?: OllamaGenConfig,
  imageData?: string,
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  try {
    const isAvailable = await checkOllamaAvailability();
    if (!isAvailable) {
      throw new Error('Ollama service is not available. Please ensure Ollama is running.');
    }

    let images: string[] = [];
    if (imageData) {
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      images.push(base64Data);
    }

    const payload = {
      model: config?.model || OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      images: images.length > 0 ? images : undefined,
      format: 'json',
      options: {
        temperature: config?.temperature ?? 0.7,
        top_p: config?.top_p ?? 0.9,
        ...(config?.options ?? {})
      },
      ...(config?.keep_alive && { keep_alive: config.keep_alive })
    };

    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    if (payload.options) {
      Object.keys(payload.options).forEach(key => payload.options[key] === undefined && delete payload.options[key]);
    }

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';

  } catch (error) {
    console.error('Ollama prompt error:', error);
    throw error;
  }
};
