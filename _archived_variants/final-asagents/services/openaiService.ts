// OpenAI Service Integration
// Provides a thin wrapper around the OpenAI REST API that the UI can call safely.

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

type ChatCompletionRole = 'system' | 'user' | 'assistant';

type VisionContent = {
    type: 'image_url';
    image_url: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
    };
};

type TextContent = {
    type: 'text';
    text: string;
};

export interface OpenAIConfig {
    apiKey: string;
    baseUrl?: string;
    organization?: string;
    enabled: boolean;
}

export type OpenAIMessage =
    | { role: ChatCompletionRole; content: string }
    | { role: ChatCompletionRole; content: Array<TextContent | VisionContent> };

export interface OpenAICompletionRequest {
    model: string;
    messages: OpenAIMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stream?: boolean;
    functions?: Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
    function_call?: 'auto' | 'none' | { name: string };
}

export interface OpenAICompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: ChatCompletionRole;
            content: string | null;
            function_call?: {
                name: string;
                arguments: string;
            };
        };
        finish_reason: string | null;
    }>;
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    };
}

export interface OpenAIEmbeddingRequest {
    model: string;
    input: string | string[];
    encoding_format?: 'float' | 'base64';
    dimensions?: number;
    user?: string;
}

export interface OpenAIEmbeddingResponse {
    object: string;
    data: Array<{
        object: string;
        embedding: number[];
        index: number;
    }>;
    model: string;
    usage?: {
        prompt_tokens?: number;
        total_tokens?: number;
    };
}

interface FunctionCallResult {
    content: string;
    functionCall?: {
        name: string;
        arguments: Record<string, unknown>;
    };
}

export class OpenAIService {
    private config: OpenAIConfig;
    private readonly defaultModel = 'gpt-4o-mini';
    private readonly defaultEmbeddingModel = 'text-embedding-3-small';

    constructor(config: OpenAIConfig) {
        this.config = config;
    }

    setConfig(nextConfig: Partial<OpenAIConfig>): void {
        this.config = { ...this.config, ...nextConfig } as OpenAIConfig;
    }

    getConfig(): OpenAIConfig {
        return this.config;
    }

    isEnabled(): boolean {
        return Boolean(this.config.enabled && this.config.apiKey);
    }

    async generateCompletion(
        messages: OpenAIMessage[],
        options: { model?: string; temperature?: number; maxTokens?: number; stream?: boolean } = {},
    ): Promise<string> {
        this.assertEnabled();

        const request: OpenAICompletionRequest = {
            model: options.model ?? this.defaultModel,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1024,
            stream: options.stream ?? false,
        };

        const response = await this.makeRequest<OpenAICompletionResponse>('/chat/completions', {
            method: 'POST',
            body: JSON.stringify(request),
        });

        const [firstChoice] = response.choices;
        if (!firstChoice || firstChoice.message.content == null) {
            throw new Error('OpenAI returned an empty response');
        }
        return firstChoice.message.content;
    }

    async generateVisionCompletion(
        prompt: string,
        imageUrl: string,
        options: { model?: string; temperature?: number; maxTokens?: number; detail?: 'low' | 'high' | 'auto' } = {},
    ): Promise<string> {
        const messages: OpenAIMessage[] = [
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: imageUrl, detail: options.detail ?? 'auto' } },
                ],
            },
        ];

        return this.generateCompletion(messages, {
            model: options.model,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
        });
    }

    async generateEmbeddings(
        input: string | string[],
        options: { model?: string; dimensions?: number } = {},
    ): Promise<number[][]> {
        this.assertEnabled();

        const request: OpenAIEmbeddingRequest = {
            model: options.model ?? this.defaultEmbeddingModel,
            input,
            encoding_format: 'float',
            dimensions: options.dimensions,
        };

        const response = await this.makeRequest<OpenAIEmbeddingResponse>('/embeddings', {
            method: 'POST',
            body: JSON.stringify(request),
        });

        return response.data.map(item => item.embedding);
    }

    async callFunction(
        messages: OpenAIMessage[],
        functions: Array<{ name: string; description: string; parameters: Record<string, unknown> }>,
        options: { model?: string; temperature?: number; functionCall?: 'auto' | 'none' | { name: string } } = {},
    ): Promise<FunctionCallResult> {
        this.assertEnabled();

        const request: OpenAICompletionRequest = {
            model: options.model ?? this.defaultModel,
            messages,
            temperature: options.temperature ?? 0.7,
            functions,
            function_call: options.functionCall ?? 'auto',
        };

        const response = await this.makeRequest<OpenAICompletionResponse>('/chat/completions', {
            method: 'POST',
            body: JSON.stringify(request),
        });

        const [choice] = response.choices;
        if (!choice) {
            throw new Error('OpenAI returned no choices for function call');
        }

        const result: FunctionCallResult = { content: choice.message.content ?? '' };

        if (choice.message.function_call) {
            const { name, arguments: rawArgs } = choice.message.function_call;
            let parsedArgs: Record<string, unknown> = {};
            try {
                parsedArgs = rawArgs ? JSON.parse(rawArgs) : {};
            } catch {
                parsedArgs = { raw: rawArgs };
            }
            result.functionCall = { name, arguments: parsedArgs };
        }

        return result;
    }

    async *streamCompletion(
        messages: OpenAIMessage[],
        options: { model?: string; temperature?: number; maxTokens?: number } = {},
    ): AsyncGenerator<string, void, unknown> {
        this.assertEnabled();

        const request: OpenAICompletionRequest = {
            model: options.model ?? this.defaultModel,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1024,
            stream: true,
        };

        const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(request),
        });

        if (!response.ok || !response.body) {
            throw await this.createApiError(response);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ')) continue;
                const payload = trimmed.slice(6);
                if (payload === '[DONE]') {
                    return;
                }
                try {
                    const json = JSON.parse(payload);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (typeof delta === 'string' && delta.length > 0) {
                        yield delta;
                    }
                } catch {
                    // Ignore malformed frames
                }
            }
        }
    }

    private getBaseUrl(): string {
        return this.config.baseUrl?.replace(/\/$/, '') || DEFAULT_BASE_URL;
    }

    private assertEnabled(): void {
        if (!this.isEnabled()) {
            throw new Error('OpenAI service is not configured');
        }
    }

    private getHeaders(): Record<string, string> {
        this.assertEnabled();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
        };
        if (this.config.organization) {
            headers['OpenAI-Organization'] = this.config.organization;
        }
        return headers;
    }

    private async makeRequest<T>(path: string, init?: RequestInit): Promise<T> {
        const response = await fetch(`${this.getBaseUrl()}${path}`, {
            ...init,
            headers: {
                ...this.getHeaders(),
                ...(init?.headers as Record<string, string> | undefined),
            },
        });

        if (!response.ok) {
            throw await this.createApiError(response);
        }

        return (await response.json()) as T;
    }

    private async createApiError(response: Response): Promise<Error> {
        const message = await response.text();
        const error = new Error(`OpenAI API error: ${response.status} ${response.statusText}${message ? ` - ${message}` : ''}`);
        return error;
    }
}

const defaultService = new OpenAIService({
    apiKey: '',
    baseUrl: DEFAULT_BASE_URL,
    enabled: false,
});

export const createOpenAIService = (config: OpenAIConfig) => new OpenAIService(config);
export const openAIService = defaultService;
export default defaultService;
