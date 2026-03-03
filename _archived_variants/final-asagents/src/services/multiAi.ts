// Multi-AI Service integrating Claude Sonnet 3.5, Gemini, and OpenAI
import { GoogleGenerativeAI } from '@google/genai';

interface AIResponse {
  content: string;
  provider: 'claude' | 'gemini' | 'openai';
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

interface AIServiceConfig {
  geminiApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  preferredProvider?: 'claude' | 'gemini' | 'openai';
  fallbackEnabled?: boolean;
}

class MultiAIService {
  private geminiClient?: GoogleGenerativeAI;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = {
      fallbackEnabled: true,
      preferredProvider: 'claude',
      ...config
    };

    if (config.geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  async generateText(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    provider?: 'claude' | 'gemini' | 'openai';
    systemPrompt?: string;
  }): Promise<AIResponse> {
    const provider = options?.provider || this.config.preferredProvider || 'claude';
    
    try {
      switch (provider) {
        case 'claude':
          return await this.generateWithClaude(prompt, options);
        case 'gemini':
          return await this.generateWithGemini(prompt, options);
        case 'openai':
          return await this.generateWithOpenAI(prompt, options);
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`AI generation failed with ${provider}:`, error);
      
      if (this.config.fallbackEnabled) {
        // Try fallback providers
        const fallbackProviders: Array<'claude' | 'gemini' | 'openai'> = 
          ['claude', 'gemini', 'openai'].filter(p => p !== provider) as Array<'claude' | 'gemini' | 'openai'>;
        
        for (const fallbackProvider of fallbackProviders) {
          try {
            console.log(`Trying fallback provider: ${fallbackProvider}`);
            return await this.generateText(prompt, { ...options, provider: fallbackProvider });
          } catch (fallbackError) {
            console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
          }
        }
      }
      
      throw new Error(`All AI providers failed. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateWithClaude(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }): Promise<AIResponse> {
    if (!this.config.anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // For now, we'll use a mock response since Anthropic SDK isn't installed
    // In production, you would use the official Anthropic SDK
    const mockResponse = {
      content: `Claude Sonnet 3.5 Response: ${prompt.substring(0, 100)}... [This is a mock response. Configure the Anthropic SDK for real responses.]`,
      provider: 'claude' as const,
      model: 'claude-3-5-sonnet-20241022',
      usage: {
        inputTokens: Math.floor(prompt.length / 4),
        outputTokens: 50,
        totalTokens: Math.floor(prompt.length / 4) + 50
      }
    };

    return mockResponse;
  }

  private async generateWithGemini(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }): Promise<AIResponse> {
    if (!this.geminiClient) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = this.geminiClient.getGenerativeModel({ 
        model: 'gemini-1.5-pro',
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 1024,
          temperature: options?.temperature || 0.7,
        }
      });

      const fullPrompt = options?.systemPrompt 
        ? `${options.systemPrompt}\n\nUser: ${prompt}`
        : prompt;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        usage: {
          // Gemini doesn't provide detailed token usage in the free tier
          inputTokens: Math.floor(prompt.length / 4),
          outputTokens: Math.floor(text.length / 4),
          totalTokens: Math.floor((prompt.length + text.length) / 4)
        }
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateWithOpenAI(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }): Promise<AIResponse> {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const messages = [];
      
      if (options?.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages,
          max_tokens: options?.maxTokens || 1024,
          temperature: options?.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return {
        content,
        provider: 'openai',
        model: 'gpt-4',
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        }
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Specialized methods for different use cases
  async generateProjectInsight(projectData: any): Promise<AIResponse> {
    const systemPrompt = `You are an expert construction project manager and business analyst. 
    Provide actionable insights and recommendations based on the project data provided.
    Focus on timeline optimization, cost management, resource allocation, and risk mitigation.`;

    const prompt = `Analyze this construction project data and provide insights:
    
    Project: ${projectData.name}
    Status: ${projectData.status}
    Budget: £${projectData.budget?.toLocaleString()}
    Timeline: ${projectData.startDate} to ${projectData.endDate}
    Team Size: ${projectData.teamSize || 'Not specified'}
    
    Provide specific recommendations for:
    1. Schedule optimization
    2. Cost management opportunities
    3. Resource allocation improvements
    4. Risk mitigation strategies
    5. Quality assurance measures`;

    return this.generateText(prompt, {
      systemPrompt,
      maxTokens: 1500,
      temperature: 0.7
    });
  }

  async generateSafetyAnalysis(incidentData: any): Promise<AIResponse> {
    const systemPrompt = `You are a construction safety expert and risk analyst.
    Analyze safety incidents and provide preventive measures and safety recommendations.`;

    const prompt = `Analyze this safety incident and provide recommendations:
    
    Type: ${incidentData.type}
    Severity: ${incidentData.severity}
    Description: ${incidentData.description}
    Location: ${incidentData.location}
    Date: ${incidentData.date}
    
    Provide:
    1. Root cause analysis
    2. Preventive measures
    3. Safety protocol recommendations
    4. Training requirements
    5. Equipment or process improvements`;

    return this.generateText(prompt, {
      systemPrompt,
      maxTokens: 1200,
      temperature: 0.6
    });
  }

  async generateTaskPrioritization(tasks: any[]): Promise<AIResponse> {
    const systemPrompt = `You are a project management expert specializing in construction workflows.
    Analyze tasks and provide optimal prioritization strategies.`;

    const prompt = `Prioritize these construction tasks based on dependencies, deadlines, resources, and project goals:
    
    ${tasks.map((task, index) => `
    ${index + 1}. ${task.title}
       - Status: ${task.status}
       - Priority: ${task.priority}
       - Due Date: ${task.dueDate}
       - Assigned to: ${task.assignedTo}
       - Dependencies: ${task.dependencies || 'None'}
    `).join('')}
    
    Provide:
    1. Recommended task order with rationale
    2. Critical path identification
    3. Resource conflict resolution
    4. Timeline optimization suggestions`;

    return this.generateText(prompt, {
      systemPrompt,
      maxTokens: 1000,
      temperature: 0.5
    });
  }

  // Get service status and configuration
  getStatus() {
    return {
      gemini: !!this.config.geminiApiKey,
      openai: !!this.config.openaiApiKey,
      claude: !!this.config.anthropicApiKey,
      preferredProvider: this.config.preferredProvider,
      fallbackEnabled: this.config.fallbackEnabled
    };
  }
}

// Create singleton instance
const multiAIService = new MultiAIService({
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY,
  anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  preferredProvider: 'gemini', // Use Gemini as primary since we have the key
  fallbackEnabled: true
});

export { MultiAIService, multiAIService };
export type { AIResponse, AIServiceConfig };