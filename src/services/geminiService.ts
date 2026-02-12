import { GenerateContentResponse } from '@google/genai';
import { Message } from '@/types';

// Initialize the client with the environment key (prefer GEMINI_API_KEY, fallback to API_KEY)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || 'placeholder_key';
if (!import.meta.env.VITE_GEMINI_API_KEY && !import.meta.env.VITE_API_KEY) {
    console.warn('Missing Gemini API Key');
}

// Helper function to get auth headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };

    // Get current session token from Local Storage
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

export interface ChatConfig {
    model?: string;
    systemInstruction?: string;
    thinkingBudget?: number;
    thinkingConfig?: { thinkingBudget: number };
    tools?: any[];
    responseMimeType?: string;
    responseSchema?: any;
    temperature?: number;
    topP?: number;
    projectId?: string;
    contextType?: string;
}

export type GenConfig = ChatConfig;

export const streamChatResponse = async (
    history: Message[],
    newMessage: string,
    imageData?: string,
    mimeType: string = 'image/jpeg',
    onChunk?: (text: string) => void,
    configOverride?: ChatConfig
): Promise<GenerateContentResponse> => {
    try {
        // Prepare payload
        const payload = {
            history: history
                .filter((msg) => !msg.isThinking && msg.id !== 'intro')
                .map((msg) => ({
                    role: msg.role,
                    parts: [
                        { text: msg.text },
                        ...(msg.image && msg.role === 'user'
                            ? [
                                {
                                    inlineData: {
                                        mimeType: msg.image.match(/^data:(.+);base64/)?.[1] || 'image/jpeg',
                                        data: msg.image.split(',')[1]
                                    }
                                }
                            ]
                            : [])
                    ]
                })),
            newMessage,
            mimeType,
            config: configOverride,
            projectId: configOverride?.projectId,
            contextType: configOverride?.contextType
        };

        const headers = await getAuthHeaders();
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`AI Request Failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Backend sends raw text chunks
            if (chunk) {
                fullText += chunk;
                if (onChunk) onChunk(chunk);
            }
        }

        // Construct a mock GenerateContentResponse to satisfy the interface
        return {
            candidates: [
                {
                    content: {
                        role: 'model',
                        parts: [{ text: fullText }]
                    },
                    finishReason: 'STOP'
                }
            ],
            usageMetadata: {}
        } as unknown as GenerateContentResponse;
    } catch (error) {
        console.error('Chat error:', error);
        throw error;
    }
};

export const generateImage = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/ai/image', {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt, aspectRatio })
        });

        if (!response.ok) throw new Error('Image generation failed');

        const data = await response.json();
        if (!data.imageUri) throw new Error('No image returned');

        return data.imageUri;
    } catch (error) {
        console.error('Image gen error:', error);
        throw error;
    }
};

export const runRawPrompt = async (
    prompt: string,
    config?: ChatConfig,
    imageData?: string,
    mimeType?: string
): Promise<string> => {
    try {
        const res = await streamChatResponse([], prompt, imageData, mimeType, undefined, config);
        return res.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
        console.error('runRawPrompt failed', e);
        return '';
    }
};

export const parseAIJSON = (text: string) => {
    try {
        const cleaned = text
            .replace(/```json\n?|\n?```/g, '')
            .replace(/```\n?|\n?```/g, '')
            .trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('JSON Parse error', e);
        return null; // or throw
    }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string = 'audio/webm'): Promise<string> => {
    try {
        const res = await streamChatResponse(
            [],
            'Please transcribe this audio exactly. Return ONLY the transcription.',
            audioBase64,
            mimeType,
            undefined,
            { model: 'gemini-2.0-flash-exp' }
        );
        return res.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
        console.error('Transcription failed', e);
        return '';
    }
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
    // Placeholder to fix build - requires specific TTS backend

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx.createBuffer(1, 1, 44100);
};

import { io, Socket } from 'socket.io-client';

export interface LiveClient {
    connect: (config: any) => Promise<{
        sendRealtimeInput: (input: any) => void;
        close: () => void;
    }>;
}

export const getLiveClient = (): LiveClient => {
    return {
        connect: async (config: any) => {
            // Use the backend API URL for Socket.io connection
            let apiUrl = import.meta.env?.VITE_API_URL || 'https://api.cortexbuildpro.com';
            // Do not strip /api for subdirectory deployment
            apiUrl = apiUrl.replace('wss://', 'https://').replace('ws://', 'http://');

            return new Promise((resolve, reject) => {
                // Get token from storage
                const token = localStorage.getItem('token') || '';

                const socket = io(apiUrl, {
                    path: '/live',
                    auth: { token },
                    query: { token },
                    transports: ['polling']
                });

                socket.on('connect', () => {
                    if (config.callbacks?.onopen) config.callbacks.onopen();
                    socket.emit('message', { setup: config });

                    resolve({
                        sendRealtimeInput: (input: any) => {
                            socket.emit('message', input);
                        },
                        close: () => socket.disconnect()
                    });
                });

                socket.on('message', (msg: any) => {
                    if (config.callbacks?.onmessage) config.callbacks.onmessage(msg);
                });

                socket.on('connect_error', (e) => {
                    console.error('AI Live Socket Error', e);
                    if (config.callbacks?.onerror) config.callbacks.onerror(e);
                    reject(e);
                });

                socket.on('disconnect', (reason) => {
                    if (config.callbacks?.onclose) config.callbacks.onclose(reason);
                });
            });
        }
    };
};

export const generateVideo = async (prompt: string, aspectRatio?: string): Promise<string> => {
    // Mock video generation by returning a high-quality relevant stock video URL
    // In a real implementation, this would call a Gemini Video API or similar service
    console.debug('Generating video with prompt:', prompt);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return a sample construction-related video from a CDN
    return 'https://cdn.coverr.co/videos/coverr-construction-site-in-the-city-5211/1080p.mp4';
};
