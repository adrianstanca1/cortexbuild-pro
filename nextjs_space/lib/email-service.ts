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

      // SendGrid failed, log and fall through to fallback
      console.warn("SendGrid email failed, trying fallback:", result.error);
    } catch (error) {
      console.warn("SendGrid adapter error, trying fallback:", error);
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
          deployment_token: process.env.ABACUSAI_API_KEY,
          app_id: process.env.WEB_APP_ID,
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

      const errorText = await response.text();
      console.error("Abacus email API failed:", errorText);
      
      return {
        success: false,
        provider: "abacus",
        error: `Abacus API error: ${response.status}`
      };
    } catch (error) {
      console.error("Abacus email API error:", error);
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
// =====================================================

export function generateCompanyInvitationEmail(params: {
  ownerName: string;
  companyName: string;
  ownerEmail: string;
  acceptUrl: string;
  expiresAt: Date;
  enabledModules: string[];
  storageGB: number;
  maxUsers: number;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed; margin: 0;">CortexBuild Pro</h1>
        <p style="color: #6b7280; margin: 5px 0;">Construction Management Platform</p>
      </div>
      
      <h2 style="color: #1f2937; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
        Welcome, ${params.ownerName}!
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        You have been invited to join <strong>CortexBuild Pro</strong> as the owner of <strong>${params.companyName}</strong>.
      </p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #374151; margin-top: 0;">Your Company Details</h3>
        <p style="margin: 8px 0;"><strong>Company:</strong> ${params.companyName}</p>
        <p style="margin: 8px 0;"><strong>Your Name:</strong> ${params.ownerName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${params.ownerEmail}</p>
        <p style="margin: 8px 0;"><strong>Storage Limit:</strong> ${params.storageGB} GB</p>
        <p style="margin: 8px 0;"><strong>Max Users:</strong> ${params.maxUsers}</p>
      </div>
      
      <div style="background: #ede9fe; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #5b21b6; margin-top: 0;">Enabled Features</h3>
        <ul style="color: #4b5563; padding-left: 20px;">
          ${params.enabledModules.map(m => `<li style="margin: 5px 0;">${m}</li>`).join('')}
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.acceptUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Accept Invitation & Set Password
        </a>
      </div>
      
      <p style="color: #9ca3af; font-size: 14px; text-align: center;">
        This invitation expires on ${params.expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        If you did not expect this invitation, please ignore this email.
      </p>
    </div>
  `;
}

export function generateTeamInvitationEmail(params: {
  memberName: string;
  inviterName: string;
  organizationName: string;
  role: string;
  acceptUrl: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Team Invitation</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <p style="font-size: 16px;">Hello <strong>${params.memberName}</strong>,</p>
        <p style="font-size: 16px;">
          <strong>${params.inviterName}</strong> has invited you to join 
          <strong>${params.organizationName}</strong> as a <strong>${params.role.replace("_", " ")}</strong>.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.acceptUrl}" 
             style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This invitation will expire in 7 days.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
}

export function generatePasswordResetEmail(params: {
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #7c3aed; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Password Reset</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <p style="font-size: 16px;">Hello <strong>${params.userName}</strong>,</p>
        <p style="font-size: 16px;">
          We received a request to reset your password for your CortexBuild Pro account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.resetUrl}" 
             style="background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in ${params.expiresInMinutes} minutes.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          If you didn't request this password reset, please ignore this email or contact support if you have concerns.
        </p>
      </div>
    </div>
  `;
}

export function generateNotificationEmail(params: {
  recipientName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1f2937; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">CortexBuild Pro</h1>
      </div>
      <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb;">
        <h2 style="color: #1f2937; margin-top: 0;">${params.title}</h2>
        <p style="font-size: 16px;">Hello <strong>${params.recipientName}</strong>,</p>
        <p style="font-size: 16px; color: #4b5563;">
          ${params.message}
        </p>
        ${params.actionUrl && params.actionText ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.actionUrl}" 
               style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              ${params.actionText}
            </a>
          </div>
        ` : ''}
      </div>
      <div style="padding: 20px; background: #f9fafb; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} CortexBuild Pro. All rights reserved.
        </p>
      </div>
    </div>
  `;
}
