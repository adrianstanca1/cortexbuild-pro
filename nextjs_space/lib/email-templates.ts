// Email templates for CortexBuild Pro notifications

export interface CompanyInvitationTemplateParams {
  companyName: string;
  ownerEmail: string;
  ownerName?: string;
  inviteUrl?: string;
  acceptUrl?: string;
  expiresAt?: Date;
  enabledModules?: string[];
  storageGB?: number;
  maxUsers?: number;
}

export interface TeamInvitationTemplateParams {
  organizationName: string;
  memberEmail: string;
  memberName?: string;
  inviterName?: string;
  role?: string;
  jobTitle?: string;
  department?: string;
  teamName?: string;
  inviteUrl?: string;
  acceptUrl?: string;
  expiresAt?: Date;
}

/**
 * Generate company invitation email HTML
 */
export function generateCompanyInvitationEmail(
  params: CompanyInvitationTemplateParams,
): string {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = params.inviteUrl || `${appUrl}/join`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏗️ Welcome to CortexBuild Pro</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">You're invited to join ${params.companyName}</h2>

        <p style="font-size: 16px; color: #4b5563;">
          You have been invited to set up your company on <strong>CortexBuild Pro</strong>, the construction management platform.
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="color: #6b7280; margin: 0;">
            <strong>Company:</strong> ${params.companyName}<br/>
            <strong>Email:</strong> ${params.ownerEmail}
          </p>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${inviteUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Accept Invitation</a>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
          This invitation will expire in 7 days.
        </p>
      </div>
    </div>
  `;
}

/**
 * Generate team invitation email HTML
 */
export function generateTeamInvitationEmail(
  params: TeamInvitationTemplateParams,
): string {
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = params.inviteUrl || `${appUrl}/join`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">👋 Team Invitation</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Join ${params.organizationName}</h2>

        <p style="font-size: 16px; color: #4b5563;">
          You have been invited to join the team at <strong>${params.organizationName}</strong> on CortexBuild Pro.
        </p>

        ${
          params.teamName
            ? `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
          <p style="color: #6b7280; margin: 0;">
            <strong>Team:</strong> ${params.teamName}<br/>
            <strong>Organization:</strong> ${params.organizationName}
          </p>
        </div>
        `
            : ""
        }

        <div style="text-align: center; margin-top: 25px;">
          <a href="${inviteUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Accept Invitation</a>
        </div>

        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
          This invitation will expire in 7 days.
        </p>
      </div>
    </div>
  `;
}
