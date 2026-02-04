// =====================================================
// UNIFIED EMAIL SERVICE
// Dynamic email delivery with fallback support
// =====================================================

import { SendGridAdapter } from "./service-adapters";
import { isServiceConfigured } from "./service-registry";

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
  provider: "sendgrid" | "abacus" | "none";
  error?: string;
}

/**
 * Send an email using the best available provider
 * Priority: SendGrid (if configured) > Abacus AI API (fallback)
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // First, try SendGrid if configured
  const sendGridConfigured = await isServiceConfigured("sendgrid");
  
  if (sendGridConfigured) {
    try {
      const sendgrid = new SendGridAdapter();
      const result = await sendgrid.sendEmail({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        from: options.from,
        replyTo: options.replyTo
      });

      if (result.success) {
        return {
          success: true,
          provider: "sendgrid"
        };
      }

      // SendGrid failed, fall through to fallback
    } catch {
      // SendGrid adapter error, fall through to fallback
    }
  }

  // Fallback to Abacus AI email API
  if (process.env.ABACUSAI_API_KEY && process.env.WEB_APP_ID) {
    try {
      const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
      
      // Try the notification email API
      const response = await fetch("https://apps.abacus.ai/api/sendNotificationEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deployment_token: process.env.ABACUSAI_APIKEY,
          app_id: process.env.WEB_APPID,
          subject: options.subject,
          body: options.html,
          is_html: true,
          recipient_email: toAddresses[0], // Primary recipient
          sender_alias: options.from?.name || "CortexBuild Pro"
        })
      });

      if (response.ok) {
        return {
          success: true,
          provider: "abacus"
        };
      }

      // Abacus API failed, fall through to return error
      return {
        success: false,
        provider: "abacus",
        error: `Abacus API error: ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        provider: "abacus",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  // No email provider available
  return {
    success: false,
    provider: "none",
    error: "No email provider configured. Please configure SendGrid in API Management or ensure ABACUSAI_API_KEY is set."
  };
}

// =====================================================
// PRE-BUILT EMAIL TEMPLATES
// Re-export from unified email templates with backward compatibility
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
// Accepts simpler parameters for existing code
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
  // Check if it's the old format (missing new required fields)
  if (!('memberEmail' in params) || !('expiresAt' in params)) {
    // Old format - add default values for new required fields
    return generateTeamInvitationEmailNew({
      memberName: params.memberName,
      memberEmail: 'noreply@example.com', // Placeholder for backward compatibility
      inviterName: params.inviterName,
      organizationName: params.organizationName,
      role: params.role,
      acceptUrl: params.acceptUrl,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    });
  }
  // New format - pass through
  return generateTeamInvitationEmailNew(params as TeamInvitationTemplateParams);
}
