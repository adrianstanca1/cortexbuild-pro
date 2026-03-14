import { logger } from '../utils/logger.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://172.18.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

interface OllamaMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface OllamaResponse {
    message: {
        role: string;
        content: string;
    };
    done: boolean;
}

interface OllamaStreamChunk {
    message?: {
        role: string;
        content: string;
    };
    done: boolean;
}

export const isOllamaAvailable = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`, { method: 'GET' });
        return response.ok;
    } catch (error) {
        logger.error('Ollama health check failed:', error);
        return false;
    }
};

export const generateCompletion = async (
    messages: OllamaMessage[],
    options: { temperature?: number; model?: string } = {}
): Promise<string> => {
    const model = options.model || OLLAMA_MODEL;
    
    try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                options: {
                    temperature: options.temperature ?? 0.7
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data: OllamaResponse = await response.json();
        return data.message?.content || '';
    } catch (error: any) {
        logger.error('Ollama completion error:', error);
        throw error;
    }
};

export const generateCompletionStream = async function* (
    messages: OllamaMessage[],
    options: { temperature?: number; model?: string } = {}
): AsyncGenerator<string, void, unknown> {
    const model = options.model || OLLAMA_MODEL;
    
    try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
                options: {
                    temperature: options.temperature ?? 0.7
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body from Ollama');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const chunk: OllamaStreamChunk = JSON.parse(line);
                        if (chunk.message?.content) {
                            yield chunk.message.content;
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }
        }
    } catch (error: any) {
        logger.error('Ollama stream error:', error);
        throw error;
    }
};

export const generateWithImage = async (
    prompt: string,
    imageBuffer: Buffer,
    mimeType: string,
    options: { temperature?: number; model?: string } = {}
): Promise<string> => {
    const model = options.model || OLLAMA_MODEL;
    
    try {
        // Convert image to base64
        const imageBase64 = imageBuffer.toString('base64');
        
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                images: [imageBase64],
                stream: false,
                options: {
                    temperature: options.temperature ?? 0.1
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response || '';
    } catch (error: any) {
        logger.error('Ollama image analysis error:', error);
        throw error;
    }
};

export const generateStructured = async (
    messages: OllamaMessage[],
    schema: any,
    options: { temperature?: number; model?: string } = {}
): Promise<any> => {
    const model = options.model || OLLAMA_MODEL;
    
    // Add schema instruction to the system message or first user message
    const schemaInstruction = `\n\nYou must respond with valid JSON matching this schema: ${JSON.stringify(schema)}`;
    
    const modifiedMessages = messages.map((msg, idx) => {
        if (idx === 0 && msg.role === 'system') {
            return { ...msg, content: msg.content + schemaInstruction };
        }
        return msg;
    });

    // If no system message, add one
    if (modifiedMessages[0]?.role !== 'system') {
        modifiedMessages.unshift({
            role: 'system',
            content: `You are a helpful assistant. ${schemaInstruction}`
        });
    }

    try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages: modifiedMessages,
                stream: false,
                format: 'json',
                options: {
                    temperature: options.temperature ?? 0.1
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data: OllamaResponse = await response.json();
        const content = data.message?.content || '';
        
        // Try to parse JSON from the response
        try {
            // First try direct parsing
            return JSON.parse(content);
        } catch {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || 
                              content.match(/```\s*([\s\S]*?)```/) ||
                              content.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            throw new Error('Could not parse JSON from response');
        }
    } catch (error: any) {
        logger.error('Ollama structured generation error:', error);
        throw error;
    }
};

export { OLLAMA_URL, OLLAMA_MODEL };
