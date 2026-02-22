// =====================================================
// UNIFIED EMAIL TEMPLATES
// Reusable HTML email templates for CortexBuild Pro
// =====================================================

export interface CompanyInvitationTemplateParams {
  ownerName: string;
  companyName: string;
  ownerEmail: string;
  acceptUrl: string;
  expiresAt: Date;
  enabledModules: string[];
  storageGB: number;
  maxUsers: number;
}

export interface TeamInvitationTemplateParams {
  memberName: string;
  memberEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
  jobTitle?: string;
  department?: string;
  acceptUrl: string;
  expiresAt: Date;
}

export interface PasswordResetTemplateParams {
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

// Base email wrapper with consistent branding
function emailWrapper(content: string, headerColor: string = '#7c3aed', headerTitle: string = 'CortexBuild Pro'): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: ${headerColor}; padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏗️ ${headerTitle}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Construction Management Platform</p>
        </div>
      </div>
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        ${content}
      </div>
    </div>
  `;
}

// Company Invitation Email Template
export function generateCompanyInvitationEmail(params: CompanyInvitationTemplateParams): string {
  const content = `
    <h2 style="color: #1f2937; margin-top: 0;">
      Welcome, ${params.ownerName}! 🎉
    </h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      You have been invited to join <strong>CortexBuild Pro</strong> as the owner of <strong>${params.companyName}</strong>.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #7c3aed;">
      <h3 style="color: #374151; margin-top: 0;">📋 Your Company Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 120px;">Company:</td>
          <td style="padding: 8px 0; font-weight: 600;">${params.companyName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Your Name:</td>
          <td style="padding: 8px 0; font-weight: 600;">${params.ownerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Email:</td>
          <td style="padding: 8px 0;">${params.ownerEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Storage Limit:</td>
          <td style="padding: 8px 0;">${params.storageGB} GB</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Max Users:</td>
          <td style="padding: 8px 0;">${params.maxUsers}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #ede9fe; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #5b21b6; margin-top: 0;">✨ Enabled Features</h3>
      <ul style="color: #4b5563; padding-left: 20px; margin: 0;">
        ${params.enabledModules.map(m => `<li style="margin: 5px 0;">${m}</li>`).join('')}
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.acceptUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
        Accept Invitation & Set Password
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; text-align: center;">
      ⏰ This invitation expires on ${params.expiresAt.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      If you did not expect this invitation, please ignore this email.
    </p>
  `;
  
  return emailWrapper(content, '#7c3aed', 'CortexBuild Pro');
}

// Team Member Invitation Email Template
export function generateTeamInvitationEmail(params: TeamInvitationTemplateParams): string {
  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrator',
    PROJECT_MANAGER: 'Project Manager',
    FIELD_WORKER: 'Field Worker',
  };

  const content = `
    <p style="font-size: 18px; color: #1f2937;">Hello <strong>${params.memberName}</strong>,</p>
    <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
      <strong>${params.inviterName}</strong> has invited you to join 
      <strong>${params.organizationName}</strong> on CortexBuild Pro.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
      <h3 style="color: #374151; margin-top: 0;">📋 Your Role Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 120px;">Organization:</td>
          <td style="padding: 8px 0; font-weight: 600;">${params.organizationName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Role:</td>
          <td style="padding: 8px 0;">
            <span style="background: #dcfce7; color: #059669; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 14px;">
              ${roleLabels[params.role] || params.role.replace('_', ' ')}
            </span>
          </td>
        </tr>
        ${params.jobTitle ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Job Title:</td>
          <td style="padding: 8px 0;">${params.jobTitle}</td>
        </tr>
        ` : ''}
        ${params.department ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Department:</td>
          <td style="padding: 8px 0;">${params.department}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.acceptUrl}" 
         style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
        Accept Invitation & Join Team
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; text-align: center;">
      ⏰ This invitation will expire on ${params.expiresAt.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  `;
  
  return emailWrapper(content, '#059669', '👋 Team Invitation');
}

// Password Reset Email Template
export function generatePasswordResetEmail(params: PasswordResetTemplateParams): string {
  const content = `
    <p style="font-size: 18px; color: #1f2937;">Hello <strong>${params.userName}</strong>,</p>
    <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
      We received a request to reset your password for your CortexBuild Pro account.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
      <p style="color: #991b1b; margin: 0;">
        <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, 
        please ignore this email or contact support if you have concerns.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.resetUrl}" 
         style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
        Reset Password
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; text-align: center;">
      ⏰ This link will expire in ${params.expiresInMinutes} minutes.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      This email was sent because a password reset was requested for this account.
    </p>
  `;
  
  return emailWrapper(content, '#7c3aed', '🔐 Password Reset');
}

// Generic Notification Email Template
export function generateNotificationEmail(params: {
  recipientName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}): string {
  const content = `
    <h2 style="color: #1f2937; margin-top: 0;">${params.title}</h2>
    <p style="font-size: 16px; color: #1f2937;">Hello <strong>${params.recipientName}</strong>,</p>
    <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
      ${params.message}
    </p>
    ${params.actionUrl && params.actionText ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.actionUrl}" 
           style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
          ${params.actionText}
        </a>
      </div>
    ` : ''}
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      &copy; ${new Date().getFullYear()} CortexBuild Pro. All rights reserved.
    </p>
  `;
  
  return emailWrapper(content, '#1f2937', 'CortexBuild Pro');
}
