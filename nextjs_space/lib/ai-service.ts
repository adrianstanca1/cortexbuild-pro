// =====================================================
// UNIFIED AI SERVICE
// Dynamic AI provider with fallback support
// =====================================================

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; [key: string]: any }>;
}

export interface AIOptions {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResult {
  success: boolean;
  provider: "abacus" | "gemini" | "none";
  response?: string;
  stream?: ReadableStream;
  error?: string;
}

/**
 * Unified AI service that supports multiple providers
 * Priority: User selection (AI_PROVIDER) > Abacus AI (if configured) > Gemini (if configured)
 */
export async function generateAIResponse(options: AIOptions): Promise<AIResult> {
  const provider = process.env.AI_PROVIDER || "abacus";
  
  // Try user-selected provider first
  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    const result = await callGeminiAPI(options);
    if (result.success) return result;
    console.warn("Gemini API failed, trying fallback:", result.error);
  } else if (provider === "abacus" && process.env.ABACUSAI_API_KEY) {
    const result = await callAbacusAPI(options);
    if (result.success) return result;
    console.warn("Abacus API failed, trying fallback:", result.error);
  }

  // Fallback to the other provider
  if (provider === "gemini" && process.env.ABACUSAI_API_KEY) {
    const result = await callAbacusAPI(options);
    if (result.success) return result;
  } else if (provider === "abacus" && process.env.GEMINI_API_KEY) {
    const result = await callGeminiAPI(options);
    if (result.success) return result;
  }

  // No provider available
  return {
    success: false,
    provider: "none",
    error: "No AI provider configured. Please configure Abacus AI or Google Gemini API."
  };
}

/**
 * Call Abacus AI API
 */
async function callAbacusAPI(options: AIOptions): Promise<AIResult> {
  try {
    const response = await fetch("https://apps.abacus.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || "gpt-4.1-mini",
        messages: options.messages,
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        stream: options.stream || false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: "abacus",
        error: `Abacus API error: ${response.status} - ${errorText}`
      };
    }

    if (options.stream) {
      return {
        success: true,
        provider: "abacus",
        stream: response.body || undefined
      };
    }

    const data = await response.json();
    return {
      success: true,
      provider: "abacus",
      response: data.choices?.[0]?.message?.content || ""
    };
  } catch {
    return {
      success: false,
      provider: "abacus",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Call Google Gemini API
 */
async function callGeminiAPI(options: AIOptions): Promise<AIResult> {
  try {
    const model = options.model || "gemini-1.5-flash";
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Convert messages to Gemini format
    const contents = convertMessagesToGeminiFormat(options.messages);
    
    const endpoint = options.stream 
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`
      : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 2000
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        provider: "gemini",
        error: `Gemini API error: ${response.status} - ${errorText}`
      };
    }

    if (options.stream) {
      // For streaming, we need to transform Gemini's response format
      const transformedStream = transformGeminiStream(response.body!);
      return {
        success: true,
        provider: "gemini",
        stream: transformedStream
      };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    return {
      success: true,
      provider: "gemini",
      response: text
    };
  } catch {
    return {
      success: false,
      provider: "gemini",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Convert OpenAI-style messages to Gemini format
 */
function convertMessagesToGeminiFormat(messages: AIMessage[]): any[] {
  const contents: any[] = [];
  let systemInstruction = "";

  for (const message of messages) {
    if (message.role === "system") {
      // Gemini doesn't have system messages, prepend to first user message
      systemInstruction += (typeof message.content === "string" ? message.content : "") + "\n\n";
    } else {
      const role = message.role === "assistant" ? "model" : "user";
      
      if (typeof message.content === "string") {
        contents.push({
          role,
          parts: [{ text: message.content }]
        });
      } else {
        // Handle complex content (images, files, etc.)
        const parts = message.content.map(item => {
          if (item.type === "text") {
            return { text: item.text };
          } else if (item.type === "image_url") {
            // Extract base64 from data URL
            const base64Match = item.image_url.url.match(/base64,(.+)/);
            if (base64Match) {
              return {
                inline_data: {
                  mime_type: item.image_url.url.split(";")[0].split(":")[1],
                  data: base64Match[1]
                }
              };
            }
          }
          return { text: "[Unsupported content type]" };
        });
        
        contents.push({ role, parts });
      }
    }
  }

  // Prepend system instruction to first user message
  if (systemInstruction && contents.length > 0 && contents[0].role === "user") {
    contents[0].parts.unshift({ text: systemInstruction });
  }

  return contents;
}

/**
 * Transform Gemini's streaming response to match expected format
 */
function transformGeminiStream(sourceStream: ReadableStream): ReadableStream {
  const reader = sourceStream.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          
          // Parse Gemini's streaming format and convert to simple text chunks
          try {
            const lines = chunk.split("\n").filter(line => line.trim());
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6);
                if (jsonStr === "[DONE]") continue;
                
                const data = JSON.parse(jsonStr);
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (text) {
                  // Format as SSE to match Abacus format
                  const sseChunk = `data: ${JSON.stringify({
                    choices: [{
                      delta: { content: text }
                    }]
                  })}\n\n`;
                  controller.enqueue(encoder.encode(sseChunk));
                }
              }
            }
          } catch (parseError) {
            console.error("Error parsing Gemini stream chunk:", parseError);
          }
        }
      } catch {
        console.error("Stream error:", error);
        controller.error(error);
      } finally {
        controller.close();
      }
    }
  });
}

/**
 * Check if AI service is configured
 */
export function isAIConfigured(): boolean {
  return !!(process.env.ABACUSAI_API_KEY || process.env.GEMINI_API_KEY);
}

/**
 * Get the active AI provider
 */
export function getActiveAIProvider(): "abacus" | "gemini" | "none" {
  const provider = process.env.AI_PROVIDER || "abacus";
  
  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    return "gemini";
  }
  if (provider === "abacus" && process.env.ABACUSAI_API_KEY) {
    return "abacus";
  }
  
  // Fallback check
  if (process.env.ABACUSAI_API_KEY) return "abacus";
  if (process.env.GEMINI_API_KEY) return "gemini";
  
  return "none";
}
