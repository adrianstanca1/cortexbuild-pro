/**
 * LiteLLM Service - Unified LLM Gateway Integration
 *
 * This service provides a unified interface to the LiteLLM API gateway
 * at https://api.cortexbuildpro.com, supporting multiple LLM providers
 * through OpenAI-compatible endpoints.
 *
 * Features:
 * - Chat completions (streaming and non-streaming)
 * - Embeddings generation
 * - Text-to-speech and speech-to-text
 * - Assistants API for agent workflows
 * - Batch operations for async processing
 * - Reranking and moderation
 */

// API Configuration
const LITELLM_BASE_URL = import.meta.env.VITE_LITELLM_URL || 'https://api.cortexbuildpro.com';
const LITELLM_API_KEY = import.meta.env.VITE_LITELLM_API_KEY || import.meta.env.VITE_API_KEY || '';

// Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'developer';
  content: string | ContentPart[];
  name?: string;
}

export interface ContentPart {
  type: 'text' | 'image_url' | 'input_text';
  text?: string;
  image_url?: { url: string };
  input_text?: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | { type: string; function?: { name: string } };
  response_format?: { type: 'text' | 'json_object' };
  user?: string;
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface EmbeddingResponse {
  object: 'list';
  data: Array<{
    object: 'embedding';
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface ModelInfo {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  permission?: Array<{
    id: string;
    object: 'model_permission';
    created: number;
    allow_create_engine: boolean;
    allow_sampling: boolean;
    allow_logprobs: boolean;
    allow_search_indices: boolean;
    allow_view: boolean;
    allow_fine_tuning: boolean;
    organization: string;
    group: string | null;
    is_blocking: boolean;
  }>;
  root?: string;
  parent?: string | null;
}

export interface TTSOptions {
  model?: string;
  input: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
  speed?: number;
}

export interface TranscriptionOptions {
  model?: string;
  file: Blob | File;
  language?: string;
  prompt?: string;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
}

export interface BatchRequest {
  custom_id: string;
  method: 'POST';
  url: string;
  body: Record<string, unknown>;
}

export interface BatchResponse {
  id: string;
  object: 'batch';
  endpoint: string;
  errors?: { object: 'list'; data: Array<{ code: string; message: string }> };
  input_file_id: string;
  completion_window: string;
  status: 'validating' | 'failed' | 'in_progress' | 'finalizing' | 'completed' | 'expired' | 'cancelling';
  output_file_id?: string;
  error_file_id?: string;
  created_at: number;
  in_progress_at?: number;
  expires_at?: number;
  finalized_at?: number;
  completed_at?: number;
  failed_at?: number;
  expired_at?: number;
  cancelling_at?: number;
  cancelled_at?: number;
  request_counts?: {
    total: number;
    completed: number;
    failed: number;
  };
  metadata?: Record<string, unknown>;
}

// Helper to get auth headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get token from localStorage
  const token = localStorage.getItem('token') || LITELLM_API_KEY;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Error handling
class LiteLLMError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'LiteLLMError';
  }
}

const handleResponse = async (response: Response): Promise<unknown> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new LiteLLMError(
      errorData.error?.message || response.statusText,
      response.status,
      errorData.error?.code,
      errorData
    );
  }
  return response.json();
};

// Model Management
export const listModels = async (): Promise<{ object: 'list'; data: ModelInfo[] }> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/v1/models`, { headers });
  return handleResponse(response);
};

export const getModel = async (modelId: string): Promise<ModelInfo> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/v1/models/${modelId}`, { headers });
  return handleResponse(response);
};

export const getModelInfo = async (): Promise<Record<string, unknown>> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/v1/model/info`, { headers });
  return handleResponse(response);
};

// Chat Completions
export const createChatCompletion = async (
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: options.model || 'gpt-4',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens,
      stream: false,
      tools: options.tools,
      tool_choice: options.tool_choice,
      response_format: options.response_format,
      user: options.user,
    }),
  });
  return handleResponse(response);
};

export const streamChatCompletion = async (
  options: ChatCompletionOptions,
  onChunk: (chunk: string) => void,
  onToolCall?: (toolCall: ToolCall) => void
): Promise<ChatCompletionResponse> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: options.model || 'gpt-4',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens,
      stream: true,
      tools: options.tools,
      tool_choice: options.tool_choice,
      response_format: options.response_format,
      user: options.user,
    }),
  });

  if (!response.ok) {
    return handleResponse(response) as Promise<ChatCompletionResponse>;
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';
  let fullResponse: Partial<ChatCompletionResponse> | null = null;
  const toolCalls: Map<string, ToolCall> = new Map();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed: ChatCompletionResponse = JSON.parse(data);

          if (!fullResponse) {
            fullResponse = { ...parsed, choices: [] };
          }

          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) {
            fullContent += delta.content;
            onChunk(delta.content);
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.id) {
                toolCalls.set(tc.id, tc);
              }
            }
          }

          fullResponse.choices = parsed.choices;
          fullResponse.usage = parsed.usage;
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Emit tool calls if any
  if (onToolCall && toolCalls.size > 0) {
    for (const tc of toolCalls.values()) {
      onToolCall(tc);
    }
  }

  return {
    id: fullResponse?.id || '',
    object: 'chat.completion',
    created: fullResponse?.created || Date.now(),
    model: fullResponse?.model || options.model || 'gpt-4',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: fullContent || null,
        tool_calls: toolCalls.size > 0 ? Array.from(toolCalls.values()) : undefined,
      },
      finish_reason: fullResponse?.choices?.[0]?.finish_reason || 'stop',
    }],
    usage: fullResponse?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
};

// Embeddings
export const createEmbedding = async (
  input: string | string[],
  model: string = 'text-embedding-ada-002'
): Promise<EmbeddingResponse> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/v1/embeddings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      input: Array.isArray(input) ? input : [input],
    }),
  });
  return handleResponse(response);
};

// Text-to-Speech
export const createSpeech = async (
  options: TTSOptions
): Promise<ArrayBuffer> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/v1/audio/speech`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: options.model || 'tts-1',
      input: options.input,
      voice: options.voice || 'alloy',
      response_format: options.response_format || 'mp3',
      speed: options.speed,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new LiteLLMError(
      errorData.error?.message || response.statusText,
      response.status,
      errorData.error?.code,
      errorData
    );
  }

  return response.arrayBuffer();
};

// Speech-to-Text
export const createTranscription = async (
  options: TranscriptionOptions
): Promise<{ text: string }> => {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append('file', options.file);
  formData.append('model', options.model || 'whisper-1');
  if (options.language) formData.append('language', options.language);
  if (options.prompt) formData.append('prompt', options.prompt);
  if (options.response_format) formData.append('response_format', options.response_format);
  if (options.temperature) formData.append('temperature', String(options.temperature));

  // Remove Content-Type header for FormData
  const { 'Content-Type': _, ...authHeaders } = headers;

  const response = await fetch(`${LITELLM_BASE_URL}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: authHeaders,
    body: formData,
  });
  return handleResponse(response);
};

// Batch Operations
export const createBatch = async (
  requests: BatchRequest[],
  endpoint: string = '/v1/chat/completions',
  completionWindow: string = '24h'
): Promise<BatchResponse> => {
  const headers = await getAuthHeaders();

  // First, upload the batch file
  const batchContent = requests.map(r => JSON.stringify(r)).join('\n');
  const batchFile = new Blob([batchContent], { type: 'application/jsonl' });

  const formData = new FormData();
  formData.append('file', batchFile, 'batch.jsonl');
  formData.append('purpose', 'batch');

  const uploadResponse = await fetch(`${LITELLM_BASE_URL}/v1/files`, {
    method: 'POST',
    headers: { 'Authorization': headers['Authorization'] || '' },
    body: formData,
  });

  const uploadData = await handleResponse(uploadResponse) as { id: string };

  // Then, create the batch
  const batchResponse = await fetch(`${LITELLM_BASE_URL}/v1/batches`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      input_file_id: uploadData.id,
      endpoint,
      completion_window: completionWindow,
    }),
  });

  return handleResponse(batchResponse);
};

export const getBatch = async (batchId: string): Promise<BatchResponse> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/v1/batches/${batchId}`, { headers });
  return handleResponse(response);
};

export const cancelBatch = async (batchId: string): Promise<BatchResponse> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/v1/batches/${batchId}/cancel`, {
    method: 'POST',
    headers,
  });
  return handleResponse(response);
};

// Reranking
export const rerankDocuments = async (
  query: string,
  documents: string[],
  model: string = 'rerank-1'
): Promise<{
  results: Array<{ index: number; relevance_score: number; document: { text: string } }>;
}> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/rerank`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      query,
      documents,
    }),
  });
  return handleResponse(response);
};

// Moderation
export const moderateContent = async (
  input: string | string[]
): Promise<{
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: Record<string, boolean>;
    category_scores: Record<string, number>;
  }>;
}> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/v1/moderations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ input: Array.isArray(input) ? input : [input] }),
  });
  return handleResponse(response);
};

// Token Counting
export const countTokens = async (
  model: string,
  messages: ChatMessage[]
): Promise<{ total_tokens: number; prompt_tokens: number }> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${LITELLM_BASE_URL}/utils/token_counter`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages }),
  });
  return handleResponse(response);
};

// Public Endpoints
export const getPublicModels = async (): Promise<unknown[]> => {
  const response = await fetch(`${LITELLM_BASE_URL}/public/model_hub`);
  return handleResponse(response);
};

export const getPublicAgents = async (): Promise<unknown[]> => {
  const response = await fetch(`${LITELLM_BASE_URL}/public/agent_hub`);
  return handleResponse(response);
};

export const getPublicMcpServers = async (): Promise<unknown[]> => {
  const response = await fetch(`${LITELLM_BASE_URL}/public/mcp_hub`);
  return handleResponse(response);
};

export const getProviders = async (): Promise<unknown[]> => {
  const response = await fetch(`${LITELLM_BASE_URL}/public/providers`);
  return handleResponse(response);
};

export const getModelPricing = async (): Promise<Record<string, unknown>> => {
  const response = await fetch(`${LITELLM_BASE_URL}/public/litellm_model_cost_map`);
  return handleResponse(response);
};

// Export error class
export { LiteLLMError };