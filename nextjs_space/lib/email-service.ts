// =====================================================
// UNIFIED EMAIL SERVICE
// Dynamic email delivery with fallback support
// =====================================================

import { SendGridAdapter } from "./service-adapters";
import { isServiceConfigured } from "./service-registry";
import { sendNotificationEmail } from "./email-notifications";

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
  provider: "sendgrid" | "nodemailer" | "none";
  error?: string;
}

/**
 * Send an email using the best available provider
 * Priority: SendGrid (if configured) > Nodemailer (local SMTP)
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

  // Fallback to local SMTP via Nodemailer
  try {
    const toAddresses = Array.isArray(options.to) ? options.to : [options.to];
    const result = await sendNotificationEmail({
      recipientEmail: toAddresses[0],
      subject: options.subject,
      htmlBody: options.html,
      senderAlias: options.from?.name || "CortexBuild Pro",
      senderEmail: options.from?.email || "noreply@cortexbuild.app"
    });

    if (result.success) {
      return {
        success: true,
        provider: "nodemailer"
      };
    }

    return {
      success: false,
      provider: "nodemailer",
      error: result.message
    };
  } catch (error) {
    return {
      success: false,
      provider: "nodemailer",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }

  // No email provider available
  return {
    success: false,
    provider: "none",
    error: "No email provider configured. Please configure SendGrid in API Management or ensure SMTP environment variables are set."
  };
}

// =====================================================
// PRE-BUILT EMAIL TEMPLATES
// Export from unified email templates
// =====================================================

export {
  generateCompanyInvitationEmail,
  generateTeamInvitationEmail,
  type CompanyInvitationTemplateParams,
  type TeamInvitationTemplateParams,
} from './email-templates';
