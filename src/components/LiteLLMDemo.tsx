import React, { useState } from 'react';
import { useChatCompletion, useTextToSpeech, useSpeechToText, useModels, useEmbedding, useRerank, useModeration } from '@/hooks/useLiteLLM';
import type { ChatMessage } from '@/services/litellmService';

/**
 * LiteLLM Chat Demo Component
 *
 * Demonstrates the LiteLLM API integration for chat completions,
 * text-to-speech, speech-to-text, and more.
 */
export function LiteLLMChatDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const { content, isStreaming, isLoading, error, sendMessage, reset, abort } = useChatCompletion({
    model: 'gpt-4',
    temperature: 0.7,
    onToolCall: (toolCall) => {
      console.log('Tool call:', toolCall);
    },
    onError: (err) => {
      console.error('Chat error:', err);
    },
  });

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    await sendMessage(newMessages, true);

    setMessages(prev => [
      ...prev,
      { role: 'assistant', content },
    ]);
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-lg max-w-[80%] ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-lg bg-gray-100">
              <span className="animate-pulse">{content}...</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-4 py-2"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
        {isStreaming && (
          <button onClick={abort} className="px-4 py-2 bg-red-500 text-white rounded-lg">
            Stop
          </button>
        )}
        <button onClick={reset} className="px-4 py-2 bg-gray-200 rounded-lg">
          Clear
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border-t">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}

/**
 * LiteLLM Voice Demo Component
 *
 * Demonstrates text-to-speech and speech-to-text capabilities.
 */
export function LiteLLMVoiceDemo() {
  const [text, setText] = useState('');

  const { speak, stop, isLoading: ttsLoading, audioUrl } = useTextToSpeech();
  const { transcript, isRecording, isTranscribing, startRecording, stopRecording } = useSpeechToText();

  const handleSpeak = async () => {
    if (text.trim()) {
      await speak(text);
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to speak..."
          className="w-full border rounded-lg p-4 h-32"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSpeak}
            disabled={ttsLoading || !text.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
          >
            {ttsLoading ? 'Speaking...' : 'Speak'}
          </button>
          {audioUrl && <button onClick={stop} className="px-4 py-2 bg-red-500 text-white rounded-lg">Stop</button>}
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <h3 className="font-medium">Speech to Text</h3>
        <button
          onClick={handleRecord}
          className={`px-4 py-2 rounded-lg text-white ${isRecording ? 'bg-red-500' : 'bg-blue-500'}`}
        >
          {isRecording ? 'Recording... Click to Stop' : 'Start Recording'}
        </button>
        {isTranscribing && <p className="text-gray-500">Transcribing...</p>}
        {transcript && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <strong>Transcript:</strong> {transcript}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * LiteLLM Models Demo Component
 *
 * Lists available models from the LiteLLM gateway.
 */
export function LiteLLMModelsDemo() {
  const { models, isLoading, error, refresh } = useModels();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Available Models</h3>
        <button onClick={refresh} disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">Error: {error.message}</div>}

      <div className="grid gap-2">
        {models.map((model) => (
          <div key={model.id} className="p-4 border rounded-lg">
            <div className="font-medium">{model.id}</div>
            <div className="text-sm text-gray-500">Owned by: {model.owned_by}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * LiteLLM Embedding Demo Component
 *
 * Demonstrates embedding generation and similarity search.
 */
export function LiteLLMEmbeddingDemo() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [similarity, setSimilarity] = useState<number | null>(null);

  const { create, isLoading, error } = useEmbedding();

  const calculateCosineSimilarity = (a: number[], b: number[]): number => {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  const handleCompare = async () => {
    if (!text1.trim() || !text2.trim()) return;

    const embeddings = await create([text1, text2]);
    if (embeddings.length === 2) {
      const sim = calculateCosineSimilarity(embeddings[0], embeddings[1]);
      setSimilarity(sim);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <textarea
          value={text1}
          onChange={(e) => setText1(e.target.value)}
          placeholder="First text..."
          className="border rounded-lg p-4 h-32"
        />
        <textarea
          value={text2}
          onChange={(e) => setText2(e.target.value)}
          placeholder="Second text..."
          className="border rounded-lg p-4 h-32"
        />
      </div>

      <button
        onClick={handleCompare}
        disabled={isLoading || !text1.trim() || !text2.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {isLoading ? 'Computing...' : 'Compare Similarity'}
      </button>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">Error: {error.message}</div>}

      {similarity !== null && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <strong>Similarity Score:</strong> {(similarity * 100).toFixed(2)}%
        </div>
      )}
    </div>
  );
}

/**
 * LiteLLM Rerank Demo Component
 *
 * Demonstrates document reranking for search.
 */
export function LiteLLMRerankDemo() {
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<string[]>(['', '', '']);

  const { rankedResults, isLoading, error, rerank } = useRerank();

  const handleRerank = async () => {
    const validDocs = documents.filter(d => d.trim());
    if (!query.trim() || validDocs.length === 0) return;
    await rerank(query, validDocs);
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search query..."
        className="w-full border rounded-lg p-4"
      />

      <div className="space-y-2">
        <label className="font-medium">Documents to rank:</label>
        {documents.map((doc, i) => (
          <input
            key={i}
            type="text"
            value={doc}
            onChange={(e) => setDocuments(prev => prev.map((d, j) => j === i ? e.target.value : d))}
            placeholder={`Document ${i + 1}...`}
            className="w-full border rounded-lg p-2"
          />
        ))}
      </div>

      <button
        onClick={handleRerank}
        disabled={isLoading || !query.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {isLoading ? 'Reranking...' : 'Rerank'}
      </button>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">Error: {error.message}</div>}

      {rankedResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Ranked Results:</h4>
          {rankedResults.map((result, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">Score: {(result.score * 100).toFixed(2)}%</span>
                <span className="text-gray-500">Original index: {result.index}</span>
              </div>
              <p className="mt-2 text-sm">{result.document}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * LiteLLM Moderation Demo Component
 *
 * Demonstrates content moderation.
 */
export function LiteLLMModerationDemo() {
  const [input, setInput] = useState('');

  const { isFlagged, categories, isLoading, error, moderate } = useModeration();

  const handleModerate = async () => {
    if (!input.trim()) return;
    await moderate(input);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter content to moderate..."
        className="w-full border rounded-lg p-4 h-32"
      />

      <button
        onClick={handleModerate}
        disabled={isLoading || !input.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {isLoading ? 'Checking...' : 'Check Content'}
      </button>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">Error: {error.message}</div>}

      {Object.keys(categories).length > 0 && (
        <div className={`p-4 rounded-lg ${isFlagged ? 'bg-red-50' : 'bg-green-50'}`}>
          <strong className={isFlagged ? 'text-red-600' : 'text-green-600'}>
            {isFlagged ? 'Content flagged!' : 'Content is safe'}
          </strong>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {Object.entries(categories).map(([cat, flagged]) => (
              <div key={cat} className={flagged ? 'text-red-600' : 'text-gray-500'}>
                {cat}: {flagged ? '❌' : '✓'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Full LiteLLM Demo with all features
 */
export function LiteLLMFullDemo() {
  const [activeTab, setActiveTab] = useState<'chat' | 'voice' | 'models' | 'embedding' | 'rerank' | 'moderation'>('chat');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: 'chat', label: 'Chat' },
          { id: 'voice', label: 'Voice' },
          { id: 'models', label: 'Models' },
          { id: 'embedding', label: 'Embeddings' },
          { id: 'rerank', label: 'Rerank' },
          { id: 'moderation', label: 'Moderation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg ${activeTab === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 border rounded-lg">
        {activeTab === 'chat' && <LiteLLMChatDemo />}
        {activeTab === 'voice' && <LiteLLMVoiceDemo />}
        {activeTab === 'models' && <LiteLLMModelsDemo />}
        {activeTab === 'embedding' && <LiteLLMEmbeddingDemo />}
        {activeTab === 'rerank' && <LiteLLMRerankDemo />}
        {activeTab === 'moderation' && <LiteLLMModerationDemo />}
      </div>
    </div>
  );
}

export default LiteLLMFullDemo;