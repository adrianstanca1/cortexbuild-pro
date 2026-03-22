import { geminiProvider } from '../lib/ai';

export interface GenConfig {
  model?: string;
  temperature?: number;
  thinkingConfig?: { thinkingBudget: number };
  responseMimeType?: string;
  systemInstruction?: string;
}

export async function runRawPrompt(
  prompt: string,
  config?: GenConfig,
  imageBase64?: string
): Promise<string> {
  const model = config?.model || 'gemini-2.0-flash';
  const response = await geminiProvider.generate(prompt, {
    model,
    temperature: config?.temperature,
    systemInstruction: config?.systemInstruction,
    thinkingBudget: config?.thinkingConfig?.thinkingBudget,
    responseMimeType: config?.responseMimeType,
    imageBase64,
  });
  return response.text;
}

export function parseAIJSON(response: string): any {
  try {
    const cleaned = response.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return null;
  }
}

export async function generateImage(
  prompt: string,
  aspectRatio: string = '16:9'
): Promise<{ url: string; base64?: string }> {
  const response = await geminiProvider.generate(prompt, {
    model: 'imagen-3',
    aspectRatio,
  });
  return { url: response.text, base64: response.text };
}

export async function analyzeDrawing(
  imageBase64: string,
  prompt: string = 'Analyze this construction drawing and identify key elements, potential issues, and safety concerns.'
): Promise<string> {
  return runRawPrompt(prompt, { responseMimeType: 'application/json' }, imageBase64);
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string = 'audio/webm'
): Promise<string> {
  const response = await geminiProvider.generate('Transcribe this audio:', {
    audioBase64,
    mimeType,
    model: 'gemini-2.0-flash',
  });
  return response.text;
}
