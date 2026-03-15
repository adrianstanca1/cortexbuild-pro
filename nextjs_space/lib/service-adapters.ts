// =====================================================
// SERVICE ADAPTERS - PLUG-AND-PLAY API INTEGRATIONS
// =====================================================

import {
  getServiceCredentials,
  logServiceUsage,
  ServiceEnvironment,
} from "./service-registry";

// Generic API response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  responseTime?: number;
}

// =====================================================
// SENDGRID ADAPTER
// =====================================================

export interface SendGridEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  from?: { email?: string; name?: string };
  replyTo?: { email: string; name?: string };
  attachments?: Array<{
    content: string; // base64 encoded
    filename: string;
    type: string;
    disposition?: "attachment" | "inline";
  }>;
}

export class SendGridAdapter {
  private environment: ServiceEnvironment;

  constructor(environment: ServiceEnvironment = "PRODUCTION") {
    this.environment = environment;
  }

  async sendEmail(options: SendGridEmailOptions): Promise<ApiResponse> {
    const startTime = Date.now();
    const credentials = await getServiceCredentials(
      "sendgrid",
      this.environment,
    );

    if (!credentials) {
      return {
        success: false,
        error:
          "SendGrid is not configured. Please configure it in the API Management dashboard.",
      };
    }

    const { apiKey, fromEmail, fromName } = credentials.credentials;

    try {
      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];

      const payload: any = {
        personalizations: [
          {
            to: toAddresses.map((email) => ({ email })),
          },
        ],
        from: {
          email: options.from?.email || fromEmail || "noreply@cortexbuild.com",
          name: options.from?.name || fromName || "CortexBuild Pro",
        },
        subject: options.subject,
      };

      if (options.templateId) {
        payload.template_id = options.templateId;
        if (options.dynamicTemplateData) {
          payload.personalizations[0].dynamic_template_data =
            options.dynamicTemplateData;
        }
      } else {
        payload.content = [];
        if (options.text) {
          payload.content.push({ type: "text/plain", value: options.text });
        }
        if (options.html) {
          payload.content.push({ type: "text/html", value: options.html });
        }
      }

      if (options.replyTo) {
        payload.reply_to = options.replyTo;
      }

      if (options.attachments) {
        payload.attachments = options.attachments;
      }

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseTime = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 300;

      // Log the API usage
      await logServiceUsage(
        credentials.connectionId,
        "send_email",
        { to: toAddresses, subject: options.subject },
        success,
        responseTime,
        success ? undefined : `HTTP ${response.status}`,
      );

      if (!success) {
        const errorBody = await response.text();
        return {
          success: false,
          error: `SendGrid API error: ${response.status} - ${errorBody}`,
          statusCode: response.status,
          responseTime,
        };
      }

      return {
        success: true,
        statusCode: response.status,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (credentials.connectionId) {
        await logServiceUsage(
          credentials.connectionId,
          "send_email",
          { to: options.to, subject: options.subject },
          false,
          responseTime,
          errorMessage,
        );
      }

      return {
        success: false,
        error: errorMessage,
        responseTime,
      };
    }
  }

  async testConnection(): Promise<ApiResponse> {
    const startTime = Date.now();
    const credentials = await getServiceCredentials(
      "sendgrid",
      this.environment,
    );

    if (!credentials) {
      return {
        success: false,
        error: "SendGrid is not configured",
      };
    }

    try {
      // Test by fetching sender identities
      const response = await fetch(
        "https://api.sendgrid.com/v3/verified_senders",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${credentials.credentials.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const responseTime = Date.now() - startTime;
      const success = response.status === 200;

      return {
        success,
        statusCode: response.status,
        responseTime,
        error: success ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
        responseTime: Date.now() - startTime,
      };
    }
  }
}

// =====================================================
// OPENAI / AI ADAPTER
// =====================================================

export interface AICompletionOptions {
  prompt?: string;
  messages?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AIAdapter {
  private environment: ServiceEnvironment;

  constructor(environment: ServiceEnvironment = "PRODUCTION") {
    this.environment = environment;
  }

  async complete(options: AICompletionOptions): Promise<ApiResponse<string>> {
    const startTime = Date.now();
    const credentials = await getServiceCredentials("openai", this.environment);

    if (!credentials) {
      return {
        success: false,
        error:
          "AI service is not configured. Please configure it in the API Management dashboard.",
      };
    }

    const {
      apiKey,
      model: defaultModel,
      organizationId,
    } = credentials.credentials;

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };

      if (organizationId) {
        headers["OpenAI-Organization"] = organizationId;
      }

      const messages = options.messages || [
        { role: "user" as const, content: options.prompt || "" },
      ];

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: options.model || defaultModel || "gpt-4",
            messages,
            max_tokens: options.maxTokens || 2048,
            temperature: options.temperature ?? 0.7,
          }),
        },
      );

      const responseTime = Date.now() - startTime;
      const success = response.status === 200;

      if (!success) {
        const errorBody = await response.text();
        await logServiceUsage(
          credentials.connectionId,
          "completion",
          { model: options.model || defaultModel },
          false,
          responseTime,
          `HTTP ${response.status}`,
        );
        return {
          success: false,
          error: errorBody,
          statusCode: response.status,
          responseTime,
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      await logServiceUsage(
        credentials.connectionId,
        "completion",
        {
          model: options.model || defaultModel,
          tokens: data.usage?.total_tokens,
        },
        true,
        responseTime,
      );

      return {
        success: true,
        data: content,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime,
      };
    }
  }

  async testConnection(): Promise<ApiResponse> {
    const startTime = Date.now();
    const credentials = await getServiceCredentials("openai", this.environment);

    if (!credentials) {
      return {
        success: false,
        error: "AI service is not configured",
      };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${credentials.credentials.apiKey}`,
        },
      });

      return {
        success: response.status === 200,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
        responseTime: Date.now() - startTime,
      };
    }
  }
}

// =====================================================
// TWILIO ADAPTER (SMS)
// =====================================================

export interface TwilioSmsOptions {
  to: string;
  body: string;
  from?: string;
}

export class TwilioAdapter {
  private environment: ServiceEnvironment;

  constructor(environment: ServiceEnvironment = "PRODUCTION") {
    this.environment = environment;
  }

  async sendSms(options: TwilioSmsOptions): Promise<ApiResponse> {
    const startTime = Date.now();
    const credentials = await getServiceCredentials("twilio", this.environment);

    if (!credentials) {
      return {
        success: false,
        error:
          "Twilio is not configured. Please configure it in the API Management dashboard.",
      };
    }

    const { accountSid, authToken, phoneNumber } = credentials.credentials;

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: options.to,
            From: options.from || phoneNumber || "",
            Body: options.body,
          }),
        },
      );

      const responseTime = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 300;

      await logServiceUsage(
        credentials.connectionId,
        "send_sms",
        { to: options.to },
        success,
        responseTime,
        success ? undefined : `HTTP ${response.status}`,
      );

      return {
        success,
        statusCode: response.status,
        responseTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - startTime,
      };
    }
  }

  async testConnection(): Promise<ApiResponse> {
    const startTime = Date.now();
    const credentials = await getServiceCredentials("twilio", this.environment);

    if (!credentials) {
      return {
        success: false,
        error: "Twilio is not configured",
      };
    }

    const { accountSid, authToken } = credentials.credentials;

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          },
        },
      );

      return {
        success: response.status === 200,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
        responseTime: Date.now() - startTime,
      };
    }
  }
}

// =====================================================
// STRIPE ADAPTER
// =====================================================

export class StripeAdapter {
  private environment: ServiceEnvironment;

  constructor(environment: ServiceEnvironment = "PRODUCTION") {
    this.environment = environment;
  }

  async testConnection(): Promise<ApiResponse> {
    const startTime = Date.now();
    const credentials = await getServiceCredentials("stripe", this.environment);

    if (!credentials) {
      return {
        success: false,
        error: "Stripe is not configured",
      };
    }

    try {
      const response = await fetch("https://api.stripe.com/v1/balance", {
        headers: {
          Authorization: `Bearer ${credentials.credentials.secretKey}`,
        },
      });

      return {
        success: response.status === 200,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
        responseTime: Date.now() - startTime,
      };
    }
  }
}

// =====================================================
// GENERIC API ADAPTER
// Factory for creating dynamic adapters
// =====================================================

export interface GenericApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  authType?: "bearer" | "basic" | "api-key" | "custom";
  authHeader?: string;
}

export class GenericApiAdapter {
  private serviceId: string;
  private environment: ServiceEnvironment;

  constructor(
    serviceId: string,
    environment: ServiceEnvironment = "PRODUCTION",
  ) {
    this.serviceId = serviceId;
    this.environment = environment;
  }

  async request(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    body?: any,
    additionalHeaders?: Record<string, string>,
  ): Promise<ApiResponse> {
    const startTime = Date.now();
    const credentials = await getServiceCredentials(
      this.serviceId,
      this.environment,
    );

    if (!credentials) {
      return {
        success: false,
        error: `Service '${this.serviceId}' is not configured`,
      };
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...additionalHeaders,
      };

      // Add authentication based on available credentials
      if (credentials.credentials.apiKey) {
        headers["Authorization"] = `Bearer ${credentials.credentials.apiKey}`;
      } else if (credentials.credentials.secretKey) {
        headers["Authorization"] =
          `Bearer ${credentials.credentials.secretKey}`;
      }

      const url = credentials.baseUrl
        ? `${credentials.baseUrl}${endpoint}`
        : endpoint;

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseTime = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 300;

      let data;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      await logServiceUsage(
        credentials.connectionId,
        `${method} ${endpoint}`,
        { statusCode: response.status },
        success,
        responseTime,
        success ? undefined : `HTTP ${response.status}`,
      );

      return {
        success,
        data,
        statusCode: response.status,
        responseTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - startTime,
      };
    }
  }

  async testConnection(): Promise<ApiResponse> {
    const credentials = await getServiceCredentials(
      this.serviceId,
      this.environment,
    );
    if (!credentials) {
      return { success: false, error: "Not configured" };
    }
    // Try a simple GET to the base URL
    return this.request("/", "GET");
  }
}

// =====================================================
// ADAPTER FACTORY
// =====================================================

export function createServiceAdapter(
  serviceId: string,
  environment: ServiceEnvironment = "PRODUCTION",
) {
  switch (serviceId.toLowerCase()) {
    case "sendgrid":
      return new SendGridAdapter(environment);
    case "openai":
      return new AIAdapter(environment);
    case "twilio":
      return new TwilioAdapter(environment);
    case "stripe":
      return new StripeAdapter(environment);
    default:
      return new GenericApiAdapter(serviceId, environment);
  }
}
