// Email notification helper functions for CortexBuild Pro

interface NotificationResult {
  success: boolean;
  message?: string;
  notification_disabled?: boolean;
}

// =====================================================
// COMPANY INVITATION NOTIFICATION
// =====================================================

export async function sendCompanyInvitationNotification(
  invitation: {
    ownerName: string;
    companyName: string;
    ownerEmail: string;
    acceptUrl: string;
    expiresAt: Date;
    enabledModules: string[];
    storageGB: number;
    maxUsers: number;
  }
): Promise<NotificationResult> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = 'CortexBuild Pro';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏗️ CortexBuild Pro</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Construction Management Platform</p>
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">
            Welcome, ${invitation.ownerName}! 🎉
          </h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            You have been invited to join <strong>CortexBuild Pro</strong> as the owner of <strong>${invitation.companyName}</strong>.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #7c3aed;">
            <h3 style="color: #374151; margin-top: 0;">📋 Your Company Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;">Company:</td>
                <td style="padding: 8px 0; font-weight: 600;">${invitation.companyName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Your Name:</td>
                <td style="padding: 8px 0; font-weight: 600;">${invitation.ownerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0;">${invitation.ownerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Storage Limit:</td>
                <td style="padding: 8px 0;">${invitation.storageGB} GB</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Max Users:</td>
                <td style="padding: 8px 0;">${invitation.maxUsers}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #ede9fe; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #5b21b6; margin-top: 0;">✨ Enabled Features</h3>
            <ul style="color: #4b5563; padding-left: 20px; margin: 0;">
              ${invitation.enabledModules.map(m => `<li style="margin: 5px 0;">${m}</li>`).join('')}
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitation.acceptUrl}" style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
              Accept Invitation & Set Password
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center;">
            ⏰ This invitation expires on ${invitation.expiresAt.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            If you did not expect this invitation, please ignore this email.
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        app_id: process.env.WEB_APPID,
        notification_id: process.env.NOTIF_ID_COMPANYINVITATION,
        subject: `🏗️ You're invited to join ${invitation.companyName} on CortexBuild Pro`,
        body: htmlBody,
        is_html: true,
        recipient_email: invitation.ownerEmail,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending company invitation notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}

// =====================================================
// TEAM MEMBER INVITATION NOTIFICATION
// =====================================================

export async function sendTeamMemberInvitationNotification(
  invitation: {
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
): Promise<NotificationResult> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = 'CortexBuild Pro';

    const roleLabels: Record<string, string> = {
      ADMIN: 'Administrator',
      PROJECT_MANAGER: 'Project Manager',
      FIELD_WORKER: 'Field Worker',
    };

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">👋 Team Invitation</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">You've been invited to join a team</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 18px; color: #1f2937;">Hello <strong>${invitation.memberName}</strong>,</p>
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
            <strong>${invitation.inviterName}</strong> has invited you to join 
            <strong>${invitation.organizationName}</strong> on CortexBuild Pro.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #059669;">
            <h3 style="color: #374151; margin-top: 0;">📋 Your Role Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;">Organization:</td>
                <td style="padding: 8px 0; font-weight: 600;">${invitation.organizationName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Role:</td>
                <td style="padding: 8px 0;">
                  <span style="background: #dcfce7; color: #059669; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 14px;">
                    ${roleLabels[invitation.role] || invitation.role.replace('_', ' ')}
                  </span>
                </td>
              </tr>
              ${invitation.jobTitle ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Job Title:</td>
                <td style="padding: 8px 0;">${invitation.jobTitle}</td>
              </tr>
              ` : ''}
              ${invitation.department ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Department:</td>
                <td style="padding: 8px 0;">${invitation.department}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitation.acceptUrl}" 
               style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
              Accept Invitation & Join Team
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 14px; text-align: center;">
            ⏰ This invitation will expire on ${invitation.expiresAt.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        app_id: process.env.WEB_APPID,
        notification_id: process.env.NOTIF_ID_TEAM_MEMBERINVITATION,
        subject: `👋 You're invited to join ${invitation.organizationName} on CortexBuild Pro`,
        body: htmlBody,
        is_html: true,
        recipient_email: invitation.memberEmail,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending team member invitation notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}

// =====================================================
// TASK ASSIGNMENT NOTIFICATION
// =====================================================

export async function sendTaskAssignmentNotification(
  task: {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    dueDate?: Date | null;
    projectName: string;
    assignerName: string;
  },
  recipientEmail: string,
  recipientName: string
): Promise<NotificationResult> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = appUrl ? new URL(appUrl).hostname.split('.')[0] : 'CortexBuild';

    const priorityColors: Record<string, { bg: string; text: string }> = {
      HIGH: { bg: '#fef2f2', text: '#dc2626' },
      MEDIUM: { bg: '#fef3c7', text: '#d97706' },
      LOW: { bg: '#dcfce7', text: '#22c55e' },
      URGENT: { bg: '#fef2f2', text: '#dc2626' }
    };
    const colors = priorityColors[task.priority] || priorityColors.MEDIUM;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📋 New Task Assigned</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #4b5563;">Hello <strong>${recipientName}</strong>,</p>
          <p style="font-size: 16px; color: #4b5563;">
            <strong>${task.assignerName}</strong> has assigned you a new task:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0;">${task.title}</h2>
            <span style="background: ${colors.bg}; color: ${colors.text}; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 12px;">
              ${task.priority} PRIORITY
            </span>
            ${task.description ? `<p style="color: #6b7280; margin-top: 15px;">${task.description}</p>` : ''}
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 100px;">Project:</td>
                <td style="padding: 8px 0; font-weight: 600;">${task.projectName}</td>
              </tr>
              ${task.dueDate ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #dc2626;">
                  ${new Date(task.dueDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${appUrl}/tasks" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Task</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        app_id: process.env.WEB_APPID,
        notification_id: process.env.NOTIF_ID_TASKASSIGNMENT,
        subject: `📋 New Task Assigned: ${task.title}`,
        body: htmlBody,
        is_html: true,
        recipient_email: recipientEmail,
        sender_email: `noreply@${appUrl ? new URL(appUrl).hostname : 'cortexbuild.app'}`,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending task assignment notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}

// =====================================================
// SAFETY ALERT NOTIFICATION (CRITICAL)
// =====================================================

export async function sendSafetyAlertNotification(
  alert: {
    type: 'INCIDENT' | 'HAZARD' | 'NEAR_MISS' | 'HIGH_RISK';
    title: string;
    description: string;
    severity: string;
    location?: string;
    projectName: string;
    reportedBy: string;
    reportedAt: Date;
  },
  recipientEmail: string
): Promise<NotificationResult> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = appUrl ? new URL(appUrl).hostname.split('.')[0] : 'CortexBuild';

    const typeLabels: Record<string, { emoji: string; label: string; color: string }> = {
      INCIDENT: { emoji: '🚨', label: 'Safety Incident', color: '#dc2626' },
      HAZARD: { emoji: '⚠️', label: 'Hazard Identified', color: '#f59e0b' },
      NEAR_MISS: { emoji: '🔔', label: 'Near Miss', color: '#f97316' },
      HIGH_RISK: { emoji: '🛑', label: 'High Risk Alert', color: '#dc2626' }
    };
    const typeInfo = typeLabels[alert.type] || typeLabels.HAZARD;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${typeInfo.color}; padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${typeInfo.emoji} ${typeInfo.label}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Immediate attention required</p>
        </div>
        <div style="background: #fef2f2; padding: 30px; border: 2px solid ${typeInfo.color}; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">${alert.title}</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${typeInfo.color};">
            <p style="color: #4b5563; margin: 0 0 15px 0;">${alert.description}</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;">Project:</td>
                <td style="padding: 8px 0; font-weight: 600;">${alert.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Severity:</td>
                <td style="padding: 8px 0; font-weight: 700; color: ${typeInfo.color};">${alert.severity}</td>
              </tr>
              ${alert.location ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Location:</td>
                <td style="padding: 8px 0;">${alert.location}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Reported By:</td>
                <td style="padding: 8px 0;">${alert.reportedBy}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Time:</td>
                <td style="padding: 8px 0;">${alert.reportedAt.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #92400e;">⚡ Action Required:</strong>
            <p style="margin: 10px 0 0 0; color: #78350f;">Please review this alert and take appropriate action immediately.</p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${appUrl}/safety" style="display: inline-block; background: ${typeInfo.color}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Safety Dashboard</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is a critical automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        app_id: process.env.WEB_APPID,
        notification_id: process.env.NOTIF_ID_SAFETYALERT,
        subject: `${typeInfo.emoji} URGENT: ${typeInfo.label} - ${alert.title}`,
        body: htmlBody,
        is_html: true,
        recipient_email: recipientEmail,
        sender_email: `safety@${appUrl ? new URL(appUrl).hostname : 'cortexbuild.app'}`,
        sender_alias: `${appName} Safety`,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending safety alert notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}

// =====================================================
// PROJECT STATUS UPDATE NOTIFICATION
// =====================================================

export async function sendProjectStatusUpdateNotification(
  update: {
    projectName: string;
    projectId: string;
    previousStatus?: string;
    newStatus: string;
    milestone?: string;
    updatedBy: string;
    notes?: string;
  },
  recipientEmail: string,
  recipientName: string
): Promise<NotificationResult> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = appUrl ? new URL(appUrl).hostname.split('.')[0] : 'CortexBuild';

    const statusColors: Record<string, { bg: string; text: string }> = {
      COMPLETED: { bg: '#dcfce7', text: '#22c55e' },
      IN_PROGRESS: { bg: '#dbeafe', text: '#3b82f6' },
      ON_HOLD: { bg: '#fef3c7', text: '#d97706' },
      PLANNING: { bg: '#f3e8ff', text: '#7c3aed' },
      CANCELLED: { bg: '#fef2f2', text: '#dc2626' }
    };
    const colors = statusColors[update.newStatus] || statusColors.IN_PROGRESS;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Project Update</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #4b5563;">Hello <strong>${recipientName}</strong>,</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0;">${update.projectName}</h2>
            
            <div style="display: flex; align-items: center; gap: 10px; margin: 15px 0;">
              ${update.previousStatus ? `
              <span style="background: #f3f4f6; color: #6b7280; padding: 6px 12px; border-radius: 8px; font-size: 14px;">
                ${update.previousStatus}
              </span>
              <span style="color: #6b7280;">→</span>
              ` : ''}
              <span style="background: ${colors.bg}; color: ${colors.text}; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                ${update.newStatus}
              </span>
            </div>

            ${update.milestone ? `
            <div style="background: #f3e8ff; padding: 12px; border-radius: 8px; margin-top: 15px;">
              <strong style="color: #7c3aed;">🎯 Milestone:</strong> ${update.milestone}
            </div>
            ` : ''}

            ${update.notes ? `
            <p style="color: #6b7280; margin-top: 15px; font-style: italic;">"${update.notes}"</p>
            ` : ''}

            <p style="color: #9ca3af; font-size: 14px; margin-top: 15px;">
              Updated by <strong>${update.updatedBy}</strong> on ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${appUrl}/projects/${update.projectId}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Project</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        app_id: process.env.WEB_APPID,
        notification_id: process.env.NOTIF_ID_PROJECT_STATUSUPDATE,
        subject: `📊 Project Update: ${update.projectName} - ${update.newStatus}`,
        body: htmlBody,
        is_html: true,
        recipient_email: recipientEmail,
        sender_email: `noreply@${appUrl ? new URL(appUrl).hostname : 'cortexbuild.app'}`,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending project status update notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}

// =====================================================
// DAILY REPORT SUBMITTED NOTIFICATION
// =====================================================

export async function sendDailyReportSubmittedNotification(
  report: {
    id: string;
    projectName: string;
    date: Date;
    submittedBy: string;
    weather?: string;
    workersOnSite?: number;
    workPerformed?: string;
    safetyIncidents: number;
  },
  recipientEmail: string
): Promise<NotificationResult> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = appUrl ? new URL(appUrl).hostname.split('.')[0] : 'CortexBuild';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📝 Daily Site Report Submitted</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
            ${new Date(report.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0;">${report.projectName}</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #6b7280; width: 140px;">Submitted By:</td>
                <td style="padding: 10px 0; font-weight: 600;">${report.submittedBy}</td>
              </tr>
              ${report.weather ? `
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">Weather:</td>
                <td style="padding: 10px 0;">${report.weather}</td>
              </tr>
              ` : ''}
              ${report.workersOnSite !== undefined ? `
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">Workers On Site:</td>
                <td style="padding: 10px 0; font-weight: 600; color: #059669;">${report.workersOnSite}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 0; color: #6b7280;">Safety Incidents:</td>
                <td style="padding: 10px 0; font-weight: 700; color: ${report.safetyIncidents > 0 ? '#dc2626' : '#22c55e'};">
                  ${report.safetyIncidents > 0 ? `⚠️ ${report.safetyIncidents}` : '✓ None'}
                </td>
              </tr>
            </table>

            ${report.workPerformed ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <strong style="color: #374151;">Work Performed:</strong>
              <p style="color: #4b5563; margin: 10px 0 0 0;">${report.workPerformed.substring(0, 200)}${report.workPerformed.length > 200 ? '...' : ''}</p>
            </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${appUrl}/daily-reports" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Full Report</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        app_id: process.env.WEB_APPID,
        notification_id: process.env.NOTIF_ID_DAILY_REPORTSUBMITTED,
        subject: `📝 Daily Report: ${report.projectName} - ${new Date(report.date).toLocaleDateString('en-GB')}`,
        body: htmlBody,
        is_html: true,
        recipient_email: recipientEmail,
        sender_email: `reports@${appUrl ? new URL(appUrl).hostname : 'cortexbuild.app'}`,
        sender_alias: `${appName} Reports`,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending daily report notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}

// =====================================================
// SAFETY CHECK NOTIFICATIONS (EXISTING)
// =====================================================

export async function sendToolboxTalkCompletedNotification(
  talk: {
    id: string;
    title: string;
    topic?: string | null;
    location?: string | null;
    attendeeCount: number;
    presenterName?: string;
    projectName: string;
    completedAt: Date;
  },
  recipientEmail: string
): Promise<NotificationResult> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = appUrl ? new URL(appUrl).hostname.split('.')[0] : 'CortexBuild';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">✅ Toolbox Talk Completed</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1f2937; margin-top: 0;">${talk.title}</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Project:</td>
                <td style="padding: 8px 0; font-weight: 600;">${talk.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Topic:</td>
                <td style="padding: 8px 0;">${talk.topic || 'General Safety'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Location:</td>
                <td style="padding: 8px 0;">${talk.location || 'On-site'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Presenter:</td>
                <td style="padding: 8px 0;">${talk.presenterName || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Attendees:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #4F46E5;">${talk.attendeeCount} signed</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Completed:</td>
                <td style="padding: 8px 0;">${talk.completedAt.toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${appUrl}/projects" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View in Dashboard</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        app_id: process.env.WEB_APPID,
        notification_id: process.env.NOTIF_ID_TOOLBOX_TALKCOMPLETED,
        subject: `✅ Toolbox Talk Completed: ${talk.title}`,
        body: htmlBody,
        is_html: true,
        recipient_email: recipientEmail,
        sender_email: `noreply@${appUrl ? new URL(appUrl).hostname : 'cortexbuild.app'}`,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending toolbox talk notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}

export async function sendMEWPCheckCompletedNotification(
  check: {
    id: string;
    equipmentName: string;
    serialNumber?: string | null;
    overallStatus: string;
    safeToUse: boolean;
    operatorName?: string;
    projectName: string;
    checkDate: Date;
    defectsFound?: string | null;
  },
  recipientEmail: string
): Promise<NotificationResult> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = appUrl ? new URL(appUrl).hostname.split('.')[0] : 'CortexBuild';

    const statusColor = check.overallStatus === 'PASS' ? '#22c55e' : check.overallStatus === 'FAIL' ? '#ef4444' : '#f59e0b';
    const statusBg = check.overallStatus === 'PASS' ? '#dcfce7' : check.overallStatus === 'FAIL' ? '#fef2f2' : '#fef3c7';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🚧 MEWP Inspection Completed</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin: 0;">${check.equipmentName}</h2>
            <span style="background: ${statusBg}; color: ${statusColor}; padding: 8px 16px; border-radius: 20px; font-weight: 700;">
              ${check.overallStatus}
            </span>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Project:</td>
                <td style="padding: 8px 0; font-weight: 600;">${check.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Serial Number:</td>
                <td style="padding: 8px 0;">${check.serialNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Operator:</td>
                <td style="padding: 8px 0;">${check.operatorName || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Check Date:</td>
                <td style="padding: 8px 0;">${check.checkDate.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Safe to Use:</td>
                <td style="padding: 8px 0; font-weight: 700; color: ${check.safeToUse ? '#22c55e' : '#ef4444'};">
                  ${check.safeToUse ? '✓ YES' : '✗ NO'}
                </td>
              </tr>
            </table>
          </div>

          ${check.defectsFound ? `
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <strong style="color: #dc2626;">⚠️ Defects Found:</strong>
            <p style="margin: 10px 0 0 0; color: #7f1d1d;">${check.defectsFound}</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 25px;">
            <a href="${appUrl}/projects" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Report</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        app_id: process.env.WEB_APPID,
        notification_id: process.env.NOTIF_ID_MEWP_CHECKCOMPLETED,
        subject: `🚧 MEWP Check ${check.overallStatus}: ${check.equipmentName}`,
        body: htmlBody,
        is_html: true,
        recipient_email: recipientEmail,
        sender_email: `noreply@${appUrl ? new URL(appUrl).hostname : 'cortexbuild.app'}`,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending MEWP check notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}

export async function sendToolCheckCompletedNotification(
  check: {
    id: string;
    toolName: string;
    toolType: string;
    serialNumber?: string | null;
    overallStatus: string;
    safeToUse: boolean;
    inspectorName?: string;
    projectName: string;
    checkDate: Date;
    defectsFound?: string | null;
  },
  recipientEmail: string
): Promise<NotificationResult> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = appUrl ? new URL(appUrl).hostname.split('.')[0] : 'CortexBuild';

    const statusColor = check.overallStatus === 'PASS' ? '#22c55e' : check.overallStatus === 'FAIL' ? '#ef4444' : '#f59e0b';
    const statusBg = check.overallStatus === 'PASS' ? '#dcfce7' : check.overallStatus === 'FAIL' ? '#fef2f2' : '#fef3c7';

    const toolTypeLabels: Record<string, string> = {
      POWER_TOOL: 'Power Tool',
      HAND_TOOL: 'Hand Tool',
      LADDER: 'Ladder',
      SCAFFOLD: 'Scaffold',
      OTHER: 'Other'
    };

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🛠️ Tool Inspection Completed</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h2 style="color: #1f2937; margin: 0;">${check.toolName}</h2>
              <span style="background: #f3e8ff; color: #7c3aed; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                ${toolTypeLabels[check.toolType] || check.toolType}
              </span>
            </div>
            <span style="background: ${statusBg}; color: ${statusColor}; padding: 8px 16px; border-radius: 20px; font-weight: 700;">
              ${check.overallStatus}
            </span>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">Project:</td>
                <td style="padding: 8px 0; font-weight: 600;">${check.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Serial Number:</td>
                <td style="padding: 8px 0;">${check.serialNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Inspector:</td>
                <td style="padding: 8px 0;">${check.inspectorName || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Check Date:</td>
                <td style="padding: 8px 0;">${check.checkDate.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Safe to Use:</td>
                <td style="padding: 8px 0; font-weight: 700; color: ${check.safeToUse ? '#22c55e' : '#ef4444'};">
                  ${check.safeToUse ? '✓ YES' : '✗ NO'}
                </td>
              </tr>
            </table>
          </div>

          ${check.defectsFound ? `
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <strong style="color: #dc2626;">⚠️ Defects Found:</strong>
            <p style="margin: 10px 0 0 0; color: #7f1d1d;">${check.defectsFound}</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 25px;">
            <a href="${appUrl}/projects" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Report</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `;

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_APIKEY,
        app_id: process.env.WEB_APPID,
        notification_id: process.env.NOTIF_ID_TOOL_CHECKCOMPLETED,
        subject: `🛠️ Tool Check ${check.overallStatus}: ${check.toolName}`,
        body: htmlBody,
        is_html: true,
        recipient_email: recipientEmail,
        sender_email: `noreply@${appUrl ? new URL(appUrl).hostname : 'cortexbuild.app'}`,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending tool check notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}
