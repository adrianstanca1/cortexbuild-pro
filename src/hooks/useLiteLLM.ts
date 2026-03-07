import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createChatCompletion,
  streamChatCompletion,
  createEmbedding,
  createSpeech,
  createTranscription,
  listModels,
  getModel,
  countTokens,
  rerankDocuments,
  moderateContent,
  createBatch,
  getBatch,
  cancelBatch,
  type ChatMessage,
  type ChatCompletionOptions,
  type ChatCompletionResponse,
  type EmbeddingResponse,
  type ModelInfo,
  type TTSOptions,
  type TranscriptionOptions,
  type BatchResponse,
  type ToolCall,
  LiteLLMError,
} from '@/services/litellmService';

// ===== useChatCompletion Hook =====
export interface UseChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: ChatCompletionOptions['tools'];
  onToolCall?: (toolCall: ToolCall) => void;
  onError?: (error: Error) => void;
}

export interface UseChatCompletionReturn {
  response: ChatCompletionResponse | null;
  content: string;
  isStreaming: boolean;
  isLoading: boolean;
  error: LiteLLMError | null;
  sendMessage: (messages: ChatMessage[], stream?: boolean) => Promise<void>;
  reset: () => void;
  abort: () => void;
}

export function useChatCompletion(options: UseChatCompletionOptions = {}): UseChatCompletionReturn {
  const [response, setResponse] = useState<ChatCompletionResponse | null>(null);
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LiteLLMError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (messages: ChatMessage[], stream: boolean = true) => {
    setError(null);
    setIsLoading(true);
    setContent('');
    setResponse(null);

    if (stream) {
      setIsStreaming(true);
      abortControllerRef.current = new AbortController();
    }

    try {
      const chatOptions: ChatCompletionOptions = {
        model: options.model || 'gpt-4',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
        tools: options.tools,
      };

      if (stream) {
        const result = await streamChatCompletion(
          chatOptions,
          (chunk) => {
            setContent(prev => prev + chunk);
          },
          options.onToolCall
        );
        setResponse(result);
      } else {
        const result = await createChatCompletion(chatOptions);
        setResponse(result);
        setContent(result.choices[0]?.message.content || '');
      }
    } catch (err) {
      const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
      setError(liteLLMError);
      options.onError?.(liteLLMError);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setResponse(null);
    setContent('');
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    response,
    content,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    reset,
    abort,
  };
}

// ===== useEmbedding Hook =====
export interface UseEmbeddingReturn {
  embedding: number[] | null;
  isLoading: boolean;
  error: LiteLLMError | null;
  create: (input: string | string[], model?: string) => Promise<number[][]>;
}

export function useEmbedding(): UseEmbeddingReturn {
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LiteLLMError | null>(null);

  const create = useCallback(async (input: string | string[], model?: string): Promise<number[][]> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createEmbedding(input, model);
      const embeddings = result.data.map(d => d.embedding);
      setEmbedding(embeddings[0]);
      return embeddings;
    } catch (err) {
      const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
      setError(liteLLMError);
      throw liteLLMError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { embedding, isLoading, error, create };
}

// ===== useTextToSpeech Hook =====
export interface UseTextToSpeechReturn {
  audioUrl: string | null;
  isLoading: boolean;
  error: LiteLLMError | null;
  speak: (text: string, voice?: TTSOptions['voice']) => Promise<void>;
  stop: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LiteLLMError | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, voice: TTSOptions['voice'] = 'alloy') => {
    setIsLoading(true);
    setError(null);
    try {
      const audioBuffer = await createSpeech({ input: text, voice });
      const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Auto-play
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(url);
      await audioRef.current.play();
    } catch (err) {
      const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
      setError(liteLLMError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { audioUrl, isLoading, error, speak, stop };
}

// ===== useSpeechToText Hook =====
export interface UseSpeechToTextReturn {
  transcript: string;
  isRecording: boolean;
  isTranscribing: boolean;
  error: LiteLLMError | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
}

export function useSpeechToText(): UseSpeechToTextReturn {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<LiteLLMError | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscript('');
      setError(null);
    } catch (err) {
      setError(new LiteLLMError('Failed to start recording', 500));
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        try {
          const result = await createTranscription({ file: audioBlob });
          setTranscript(result.text);
        } catch (err) {
          const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
          setError(liteLLMError);
        } finally {
          setIsTranscribing(false);
          resolve();
        }
      };

      mediaRecorderRef.current!.stop();
      mediaRecorderRef.current!.stream.getTracks().forEach(track => track.stop());
    });
  }, []);

  return {
    transcript,
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
  };
}

// ===== useModels Hook =====
export interface UseModelsReturn {
  models: ModelInfo[];
  isLoading: boolean;
  error: LiteLLMError | null;
  refresh: () => Promise<void>;
}

export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LiteLLMError | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listModels();
      setModels(result.data);
    } catch (err) {
      const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
      setError(liteLLMError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { models, isLoading, error, refresh };
}

// ===== useBatch Hook =====
export interface UseBatchReturn {
  batch: BatchResponse | null;
  isLoading: boolean;
  error: LiteLLMError | null;
  create: (requests: BatchRequest[], endpoint?: string) => Promise<BatchResponse>;
  getStatus: (batchId: string) => Promise<BatchResponse>;
  cancel: (batchId: string) => Promise<BatchResponse>;
}

interface BatchRequest {
  custom_id: string;
  method: 'POST';
  url: string;
  body: Record<string, unknown>;
}

export function useBatch(): UseBatchReturn {
  const [batch, setBatch] = useState<BatchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LiteLLMError | null>(null);

  const create = useCallback(async (requests: BatchRequest[], endpoint?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createBatch(requests, endpoint);
      setBatch(result);
      return result;
    } catch (err) {
      const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
      setError(liteLLMError);
      throw liteLLMError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStatus = useCallback(async (batchId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getBatch(batchId);
      setBatch(result);
      return result;
    } catch (err) {
      const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
      setError(liteLLMError);
      throw liteLLMError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancel = useCallback(async (batchId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await cancelBatch(batchId);
      setBatch(result);
      return result;
    } catch (err) {
      const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
      setError(liteLLMError);
      throw liteLLMError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { batch, isLoading, error, create, getStatus, cancel };
}

// ===== useRerank Hook =====
export interface UseRerankReturn {
  rankedResults: Array<{ index: number; score: number; document: string }>;
  isLoading: boolean;
  error: LiteLLMError | null;
  rerank: (query: string, documents: string[]) => Promise<void>;
}

export function useRerank(): UseRerankReturn {
  const [rankedResults, setRankedResults] = useState<Array<{ index: number; score: number; document: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LiteLLMError | null>(null);

  const rerank = useCallback(async (query: string, documents: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await rerankDocuments(query, documents);
      setRankedResults(result.results.map(r => ({
        index: r.index,
        score: r.relevance_score,
        document: r.document.text,
      })));
    } catch (err) {
      const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
      setError(liteLLMError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { rankedResults, isLoading, error, rerank };
}

// ===== useModeration Hook =====
export interface UseModerationReturn {
  isFlagged: boolean;
  categories: Record<string, boolean>;
  isLoading: boolean;
  error: LiteLLMError | null;
  moderate: (input: string | string[]) => Promise<boolean>;
}

export function useModeration(): UseModerationReturn {
  const [isFlagged, setIsFlagged] = useState(false);
  const [categories, setCategories] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LiteLLMError | null>(null);

  const moderate = useCallback(async (input: string | string[]): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await moderateContent(input);
      const flagged = result.results.some(r => r.flagged);
      setIsFlagged(flagged);

      const allCategories: Record<string, boolean> = {};
      for (const r of result.results) {
        Object.assign(allCategories, r.categories);
      }
      setCategories(allCategories);

      return flagged;
    } catch (err) {
      const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
      setError(liteLLMError);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isFlagged, categories, isLoading, error, moderate };
}

// ===== useTokenCount Hook =====
export interface UseTokenCountReturn {
  tokenCount: { total_tokens: number; prompt_tokens: number } | null;
  isLoading: boolean;
  error: LiteLLMError | null;
  count: (model: string, messages: ChatMessage[]) => Promise<void>;
}

export function useTokenCount(): UseTokenCountReturn {
  const [tokenCount, setTokenCount] = useState<{ total_tokens: number; prompt_tokens: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LiteLLMError | null>(null);

  const count = useCallback(async (model: string, messages: ChatMessage[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await countTokens(model, messages);
      setTokenCount(result);
    } catch (err) {
      const liteLLMError = err instanceof LiteLLMError ? err : new LiteLLMError(String(err), 500);
      setError(liteLLMError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { tokenCount, isLoading, error, count };
}