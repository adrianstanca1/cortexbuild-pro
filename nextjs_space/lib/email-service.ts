// =====================================================
// UNIFIED EMAIL SERVICE
// SendGrid email delivery for CortexBuild Pro
// =====================================================

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: { email?: string; name?: string };
  replyTo?: { email: string; name?: string };
}

export interface EmailResult {
  success: boolean;
  provider: "sendgrid" | "console" | "none";
  error?: string;
  messageId?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@cortexbuildpro.com";
  const fromName = process.env.SENDGRID_FROM_NAME || "CortexBuild Pro";

  // If no SendGrid API key, log to console in development
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log("📧 [DEV] Email would be sent:", {
        to: options.to,
        subject: options.subject,
        from: `${fromName} <${fromEmail}>`
      });
      return { success: true, provider: "console" };
    }
    return { 
      success: false, 
      provider: "none",
      error: "SendGrid API key not configured" 
    };
  }

  try {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    
    const payload: Record<string, unknown> = {
      personalizations: [{
        to: toAddresses.map(email => ({ email }))
      }],
      from: {
        email: options.from?.email || fromEmail,
        name: options.from?.name || fromName
      },
      subject: options.subject,
      content: [
        ...(options.text ? [{ type: "text/plain", value: options.text }] : []),
        { type: "text/html", value: options.html }
      ]
    };

    if (options.replyTo) {
      payload.reply_to = options.replyTo;
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.status >= 200 && response.status < 300) {
      const messageId = response.headers.get("X-Message-Id") || undefined;
      return {
        success: true,
        provider: "sendgrid",
        messageId
      };
    }

    const errorBody = await response.text();
    return {
      success: false,
      provider: "sendgrid",
      error: `SendGrid error: ${response.status} - ${errorBody}`
    };
  } catch (error) {
    return {
      success: false,
      provider: "sendgrid",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// =====================================================
// PRE-BUILT EMAIL TEMPLATES
// =====================================================

export {
  generateCompanyInvitationEmail,
  generatePasswordResetEmail,
  generateNotificationEmail,
  type CompanyInvitationTemplateParams,
  type TeamInvitationTemplateParams,
  type PasswordResetTemplateParams,
} from './email-templates';

// Backward compatible wrapper for generateTeamInvitationEmail
import { 
  generateTeamInvitationEmail as generateTeamInvitationEmailNew,
  type TeamInvitationTemplateParams 
} from './email-templates';

export function generateTeamInvitationEmail(
  params: TeamInvitationTemplateParams | {
    memberName: string;
    inviterName: string;
    organizationName: string;
    role: string;
    acceptUrl: string;
  }
): string {
  // Check if it's the old format
  if (!('memberEmail' in params) || !('expiresAt' in params)) {
    return generateTeamInvitationEmailNew({
      memberName: params.memberName,
      memberEmail: 'noreply@example.com',
      inviterName: params.inviterName,
      organizationName: params.organizationName,
      role: params.role,
      acceptUrl: params.acceptUrl,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }
  return generateTeamInvitationEmailNew(params as TeamInvitationTemplateParams);
}
