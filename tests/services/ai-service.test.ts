import { generateAIResponse, getActiveAIProvider } from '../../nextjs_space/lib/ai-service';

describe('nextjs_space/lib/ai-service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('falls back to Gemini when AI_PROVIDER is invalid but Gemini key exists', async () => {
    process.env.AI_PROVIDER = 'invalid-provider';
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    delete process.env.ABACUSAI_API_KEY;

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }]
      })
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await generateAIResponse({
      messages: [{ role: 'user', content: 'hello' }]
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('gemini');
    expect(result.response).toBe('Gemini response');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain(':generateContent?key=gemini-test-key');
  });

  it('sends Gemini systemInstruction when system messages are provided', async () => {
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'gemini-test-key';

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'ok' }] } }]
      })
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await generateAIResponse({
      messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Write summary' }
      ]
    });

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.systemInstruction).toEqual({
      parts: [{ text: 'You are helpful' }]
    });
    expect(requestBody.contents[0]).toEqual({
      role: 'user',
      parts: [{ text: 'Write summary' }]
    });
  });

  it('reports gemini as active provider when abacus key is missing', () => {
    process.env.AI_PROVIDER = 'invalid';
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    delete process.env.ABACUSAI_API_KEY;

    expect(getActiveAIProvider()).toBe('gemini');
  });
});
