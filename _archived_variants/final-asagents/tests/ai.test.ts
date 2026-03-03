import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from '../services/ai/providers';
import { AILanguageProcessor, BasicLanguageDetector } from '../services/ai/language';
import { ConversationManager } from '../services/ai/conversation';
import { MultimodalHandler } from '../services/ai/multimodal';
import { DevelopmentToolsIntegration } from '../services/ai/development';
import { UnifiedAISystem } from '../services/ai/index';

// Mock the Gemini API
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn().mockReturnValue('Mock AI response')
        }
      }),
      generateContentStream: vi.fn().mockResolvedValue({
        stream: {
          async* [Symbol.asyncIterator]() {
            yield { text: () => 'Mock ' };
            yield { text: () => 'streaming ' };
            yield { text: () => 'response' };
          }
        }
      })
    })
  }))
}));

describe('AI Providers', () => {
  describe('GeminiProvider', () => {
    let provider: GeminiProvider;

    beforeEach(() => {
      provider = new GeminiProvider();
    });

    it('should create provider with correct configuration', () => {
      expect(provider.getName()).toBe('gemini');
      expect(provider.supportsMediaType('text')).toBe(true);
      expect(provider.supportsMediaType('image')).toBe(true);
      expect(provider.supportsMediaType('video')).toBe(true);
      expect(provider.supportsMediaType('audio')).toBe(false);
    });

    it('should send text message successfully', async () => {
      const messages = [{
        id: '1',
        role: 'user' as const,
        content: 'Hello, AI!',
        timestamp: new Date()
      }];

      const response = await provider.sendMessage(messages);
      
      expect(response).toEqual({
        content: 'Mock AI response',
        provider: 'gemini',
        usage: {
          promptTokens: expect.any(Number),
          completionTokens: expect.any(Number),
          totalTokens: expect.any(Number)
        }
      });
    });

    it('should handle streaming responses', async () => {
      const messages = [{
        id: '1',
        role: 'user' as const,
        content: 'Stream this response',
        timestamp: new Date()
      }];

      const chunks: string[] = [];
      const onChunk = (chunk: string) => chunks.push(chunk);

      const response = await provider.streamMessage(messages, undefined, onChunk);
      
      expect(chunks).toEqual(['Mock ', 'streaming ', 'response']);
      expect(response.content).toBe('Mock streaming response');
    });
  });
});

describe('Language Processing', () => {
  describe('BasicLanguageDetector', () => {
    let detector: BasicLanguageDetector;

    beforeEach(() => {
      detector = new BasicLanguageDetector();
    });

    it('should detect English text', () => {
      const result = detector.detectLanguage('Hello, how are you today?');
      expect(result.code).toBe('en');
      expect(result.name).toBe('English');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect Spanish text', () => {
      const result = detector.detectLanguage('Hola, ¿cómo estás hoy?');
      expect(result.code).toBe('es');
      expect(result.name).toBe('Spanish');
    });

    it('should detect French text', () => {
      const result = detector.detectLanguage('Bonjour, comment allez-vous aujourd\'hui?');
      expect(result.code).toBe('fr');
      expect(result.name).toBe('French');
    });

    it('should handle mixed language content', () => {
      const result = detector.detectLanguage('Hello monde, how êtes-vous today?');
      expect(['en', 'fr']).toContain(result.code);
    });

    it('should fallback to English for unknown text', () => {
      const result = detector.detectLanguage('xyz123!@#');
      expect(result.code).toBe('en');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('AILanguageProcessor', () => {
    let processor: AILanguageProcessor;
    let detector: BasicLanguageDetector;

    beforeEach(() => {
      detector = new BasicLanguageDetector();
      processor = new AILanguageProcessor(detector);
    });

    it('should enhance language detection with AI', async () => {
      const result = await processor.enhancedLanguageDetection('Hello, world!');
      expect(result.code).toBe('en');
      expect(result.name).toBe('English');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should provide smart translation', async () => {
      const result = await processor.smartTranslation(
        'Hello, world!',
        'es',
        'Greeting translation'
      );
      
      expect(result).toEqual({
        translatedText: expect.any(String),
        confidence: expect.any(Number),
        detectedSourceLanguage: 'en'
      });
      expect(result.translatedText.length).toBeGreaterThan(0);
    });

    it('should handle translation errors gracefully', async () => {
      // Mock a translation failure
      const mockProvider = {
        sendMessage: vi.fn().mockRejectedValue(new Error('Translation API error'))
      };
      
      await expect(
        processor.smartTranslation('test', 'invalidlang', 'test')
      ).rejects.toThrow('Translation failed');
    });
  });
});

describe('Conversation Management', () => {
  describe('ConversationManager', () => {
    let manager: ConversationManager;
    let languageProcessor: AILanguageProcessor;

    beforeEach(() => {
      const detector = new BasicLanguageDetector();
      languageProcessor = new AILanguageProcessor(detector);
      manager = new ConversationManager(languageProcessor);
    });

    it('should create new conversation', () => {
      const conversationId = manager.createConversation('Test Chat', 'general', 'en');
      
      expect(conversationId).toBeTruthy();
      expect(typeof conversationId).toBe('string');
      
      const context = manager.getContext(conversationId);
      expect(context).toMatchObject({
        title: 'Test Chat',
        domain: 'general',
        language: 'en'
      });
    });

    it('should manage conversation messages', () => {
      const conversationId = manager.createConversation('Test', 'general', 'en');
      
      manager.addMessage(conversationId, {
        role: 'user',
        content: 'Hello!'
      });

      const messages = manager.getMessages(conversationId);
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        role: 'user',
        content: 'Hello!'
      });
    });

    it('should export conversation in different formats', () => {
      const conversationId = manager.createConversation('Test', 'general', 'en');
      
      manager.addMessage(conversationId, {
        role: 'user',
        content: 'Hello!'
      });
      
      manager.addMessage(conversationId, {
        role: 'assistant',
        content: 'Hi there!'
      });

      // Test JSON export
      const jsonExport = manager.exportConversation(conversationId, 'json');
      expect(() => JSON.parse(jsonExport)).not.toThrow();

      // Test Markdown export
      const markdownExport = manager.exportConversation(conversationId, 'markdown');
      expect(markdownExport).toContain('# Test');
      expect(markdownExport).toContain('## User');
      expect(markdownExport).toContain('## Assistant');

      // Test text export
      const textExport = manager.exportConversation(conversationId, 'txt');
      expect(textExport).toContain('USER: Hello!');
      expect(textExport).toContain('ASSISTANT: Hi there!');
    });

    it('should list and delete conversations', () => {
      const id1 = manager.createConversation('Chat 1', 'general', 'en');
      const id2 = manager.createConversation('Chat 2', 'technical', 'es');

      let conversations = manager.listConversations();
      expect(conversations).toHaveLength(2);

      const deleted = manager.deleteConversation(id1);
      expect(deleted).toBe(true);

      conversations = manager.listConversations();
      expect(conversations).toHaveLength(1);
      expect(conversations[0].id).toBe(id2);
    });
  });
});

describe('Multimodal Processing', () => {
  describe('MultimodalHandler', () => {
    let handler: MultimodalHandler;
    let conversationManager: ConversationManager;

    beforeEach(() => {
      const detector = new BasicLanguageDetector();
      const languageProcessor = new AILanguageProcessor(detector);
      conversationManager = new ConversationManager(languageProcessor);
      handler = new MultimodalHandler(conversationManager);
    });

    it('should determine media types correctly', async () => {
      // Mock file objects
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const audioFile = new File([''], 'test.mp3', { type: 'audio/mpeg' });
      const codeFile = new File([''], 'test.js', { type: 'text/javascript' });
      const docFile = new File([''], 'test.pdf', { type: 'application/pdf' });

      const files = [imageFile, audioFile, codeFile, docFile];
      
      // Process files (mocking the actual file reading)
      const processedFiles = await handler.processFiles(files);
      
      expect(processedFiles).toHaveLength(4);
      expect(processedFiles.map(f => f.mediaType)).toEqual([
        'image', 'audio', 'code', 'document'
      ]);
    });

    it('should create multimodal input correctly', async () => {
      const mockFiles = [
        {
          name: 'image.jpg',
          type: 'image/jpeg',
          size: 1024,
          content: 'base64imagedata',
          mediaType: 'image' as const
        },
        {
          name: 'audio.mp3',
          type: 'audio/mpeg',
          size: 2048,
          content: 'base64audiodata',
          mediaType: 'audio' as const
        }
      ];

      const input = handler.createMultimodalInput(mockFiles);
      
      expect(input.images).toHaveLength(1);
      expect(input.images?.[0]).toEqual({
        data: 'base64imagedata',
        type: 'image/jpeg'
      });
      
      expect(input.audio).toEqual({
        data: 'base64audiodata',
        type: 'audio/mpeg'
      });
    });
  });
});

describe('Development Tools Integration', () => {
  describe('DevelopmentToolsIntegration', () => {
    let integration: DevelopmentToolsIntegration;

    beforeEach(() => {
      const detector = new BasicLanguageDetector();
      const languageProcessor = new AILanguageProcessor(detector);
      const conversationManager = new ConversationManager(languageProcessor);
      const multimodalHandler = new MultimodalHandler(conversationManager);
      
      integration = new DevelopmentToolsIntegration(
        conversationManager,
        multimodalHandler,
        languageProcessor
      );
    });

    it('should list development environments', () => {
      const environments = integration.listEnvironments();
      
      expect(environments.length).toBeGreaterThan(0);
      expect(environments.some(env => env.id === 'vscode')).toBe(true);
      expect(environments.some(env => env.id === 'react')).toBe(true);
      expect(environments.some(env => env.id === 'node')).toBe(true);
    });

    it('should get environment capabilities', () => {
      const vscodeCapabilities = integration.getEnvironmentCapabilities('vscode');
      expect(vscodeCapabilities).toContain('completion');
      expect(vscodeCapabilities).toContain('refactoring');
      expect(vscodeCapabilities).toContain('debugging');

      const reactCapabilities = integration.getEnvironmentCapabilities('react');
      expect(reactCapabilities).toContain('jsx');
      expect(reactCapabilities).toContain('hooks');
    });

    it('should execute JavaScript code safely', async () => {
      const result = await integration.executeCode(
        'console.log("Hello, World!"); return 42;',
        'javascript'
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Hello, World!');
      expect(result.output).toContain('42');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle code execution errors', async () => {
      const result = await integration.executeCode(
        'throw new Error("Test error");',
        'javascript'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Test error');
    });

    it('should handle unsupported languages', async () => {
      const result = await integration.executeCode(
        'print("Hello")',
        'unsupported'
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('not supported');
    });
  });
});

describe('Unified AI System', () => {
  describe('UnifiedAISystem', () => {
    let aiSystem: UnifiedAISystem;

    beforeEach(() => {
      aiSystem = new UnifiedAISystem();
    });

    it('should initialize all components', () => {
      expect(aiSystem.conversationManager).toBeDefined();
      expect(aiSystem.multimodalHandler).toBeDefined();
      expect(aiSystem.developmentTools).toBeDefined();
    });

    it('should provide system status', () => {
      const status = aiSystem.getSystemStatus();
      
      expect(status).toMatchObject({
        providersRegistered: expect.any(Number),
        conversationsActive: expect.any(Number),
        languageSupport: true,
        multimodalSupport: true,
        developmentToolsReady: true
      });
    });

    it('should support quick chat functionality', async () => {
      const result = await aiSystem.chat('Hello, AI!');
      
      expect(result.response).toBeTruthy();
      expect(result.conversationId).toBeTruthy();
      expect(typeof result.response).toBe('string');
    });

    it('should detect language', async () => {
      const result = await aiSystem.detectLanguage('Hello, world!');
      
      expect(result.code).toBe('en');
      expect(result.name).toBe('English');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should analyze code', async () => {
      const analysis = await aiSystem.analyzeCode(
        'function hello() { console.log("Hello"); }',
        'javascript',
        'test.js'
      );
      
      expect(analysis).toBeTruthy();
      expect(typeof analysis).toBe('string');
      expect(analysis.length).toBeGreaterThan(0);
    });
  });
});