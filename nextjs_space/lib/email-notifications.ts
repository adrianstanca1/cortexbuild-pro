// Email notification helper functions for safety checks

interface NotificationResult {
  success: boolean;
  message?: string;
  notification_disabled?: boolean;
}

interface SafetyCheckNotificationConfig {
  icon: string;
  title: string;
  headerGradient: string;
  borderColor: string;
  buttonColor: string;
  notificationIdEnv: string;
}

interface SafetyCheckData {
  name: string;
  projectName: string;
  date: Date;
  status?: string;
  statusColor?: string;
  statusBg?: string;
  fields: Array<{
    label: string;
    value: string | number;
    highlight?: boolean;
    color?: string;
  }>;
  alertSection?: {
    title: string;
    content: string;
  };
}

/**
 * Generic function to send safety check completion notifications
 * Consolidates previously duplicated notification functions
 */
async function sendSafetyCheckNotification(
  config: SafetyCheckNotificationConfig,
  data: SafetyCheckData,
  recipientEmail: string
): Promise<NotificationResult> {
  try {
    const appUrl = process.env.NEXTAUTH_URL || '';
    const appName = appUrl ? new URL(appUrl).hostname.split('.')[0] : 'CortexBuild';

    // Build fields table
    const fieldsHtml = data.fields.map(field => `
      <tr>
        <td style="padding: 8px 0; color: #6b7280; width: 140px;">${field.label}:</td>
        <td style="padding: 8px 0; ${field.highlight ? 'font-weight: 600;' : ''} ${field.color ? `color: ${field.color};` : ''}">${field.value}</td>
      </tr>
    `).join('');

    // Build status badge if provided
    const statusBadge = data.status ? `
      <span style="background: ${data.statusBg}; color: ${data.statusColor}; padding: 8px 16px; border-radius: 20px; font-weight: 700;">
        ${data.status}
      </span>
    ` : '';

    // Build alert section if provided
    const alertHtml = data.alertSection ? `
      <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
        <strong style="color: #dc2626;">${data.alertSection.title}</strong>
        <p style="margin: 10px 0 0 0; color: #7f1d1d;">${data.alertSection.content}</p>
      </div>
    ` : '';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${config.headerGradient}; padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${config.icon} ${config.title}</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin: 0;">${data.name}</h2>
            ${statusBadge}
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${config.borderColor};">
            <table style="width: 100%; border-collapse: collapse;">
              ${fieldsHtml}
            </table>
          </div>

          ${alertHtml}

          <div style="text-align: center; margin-top: 25px;">
            <a href="${appUrl}/projects" style="display: inline-block; background: ${config.buttonColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View in Dashboard</a>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
            This is an automated notification from CortexBuild Pro
          </p>
        </div>
      </div>
    `;

    const notificationId = process.env[config.notificationIdEnv];
    if (!notificationId) {
      console.warn(`Notification ID not configured: ${config.notificationIdEnv}`);
      return { success: false, message: 'Notification not configured', notification_disabled: true };
    }

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: notificationId,
        subject: `${config.icon} ${config.title}: ${data.name}`,
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
    console.error('Error sending safety check notification:', error);
    return { success: false, message: 'Failed to send notification' };
  }
}

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
  return sendSafetyCheckNotification(
    {
      icon: '✅',
      title: 'Toolbox Talk Completed',
      headerGradient: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
      borderColor: '#4F46E5',
      buttonColor: '#4F46E5',
      notificationIdEnv: 'NOTIF_ID_TOOLBOX_TALK_COMPLETED',
    },
    {
      name: talk.title,
      projectName: talk.projectName,
      date: talk.completedAt,
      fields: [
        { label: 'Project', value: talk.projectName, highlight: true },
        { label: 'Topic', value: talk.topic || 'General Safety' },
        { label: 'Location', value: talk.location || 'On-site' },
        { label: 'Presenter', value: talk.presenterName || 'Not specified' },
        { label: 'Attendees', value: `${talk.attendeeCount} signed`, highlight: true, color: '#4F46E5' },
        { label: 'Completed', value: talk.completedAt.toLocaleString() },
      ],
    },
    recipientEmail
  );
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
  const statusColor = check.overallStatus === 'PASS' ? '#22c55e' : check.overallStatus === 'FAIL' ? '#ef4444' : '#f59e0b';
  const statusBg = check.overallStatus === 'PASS' ? '#dcfce7' : check.overallStatus === 'FAIL' ? '#fef2f2' : '#fef3c7';

  return sendSafetyCheckNotification(
    {
      icon: '🚧',
      title: 'MEWP Inspection Completed',
      headerGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      borderColor: '#f97316',
      buttonColor: '#f97316',
      notificationIdEnv: 'NOTIF_ID_MEWP_CHECK_COMPLETED',
    },
    {
      name: check.equipmentName,
      projectName: check.projectName,
      date: check.checkDate,
      status: check.overallStatus,
      statusColor,
      statusBg,
      fields: [
        { label: 'Project', value: check.projectName, highlight: true },
        { label: 'Serial Number', value: check.serialNumber || 'N/A' },
        { label: 'Operator', value: check.operatorName || 'Not specified' },
        { label: 'Check Date', value: check.checkDate.toLocaleString() },
        { 
          label: 'Safe to Use', 
          value: check.safeToUse ? '✓ YES' : '✗ NO', 
          highlight: true, 
          color: check.safeToUse ? '#22c55e' : '#ef4444' 
        },
      ],
      alertSection: check.defectsFound ? {
        title: '⚠️ Defects Found:',
        content: check.defectsFound,
      } : undefined,
    },
    recipientEmail
  );
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
  const statusColor = check.overallStatus === 'PASS' ? '#22c55e' : check.overallStatus === 'FAIL' ? '#ef4444' : '#f59e0b';
  const statusBg = check.overallStatus === 'PASS' ? '#dcfce7' : check.overallStatus === 'FAIL' ? '#fef2f2' : '#fef3c7';

  const toolTypeLabels: Record<string, string> = {
    POWER_TOOL: 'Power Tool',
    HAND_TOOL: 'Hand Tool',
    LADDER: 'Ladder',
    SCAFFOLD: 'Scaffold',
    OTHER: 'Other'
  };

  return sendSafetyCheckNotification(
    {
      icon: '🛠️',
      title: 'Tool Inspection Completed',
      headerGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      borderColor: '#8b5cf6',
      buttonColor: '#8b5cf6',
      notificationIdEnv: 'NOTIF_ID_TOOL_CHECK_COMPLETED',
    },
    {
      name: `${check.toolName} (${toolTypeLabels[check.toolType] || check.toolType})`,
      projectName: check.projectName,
      date: check.checkDate,
      status: check.overallStatus,
      statusColor,
      statusBg,
      fields: [
        { label: 'Project', value: check.projectName, highlight: true },
        { label: 'Serial Number', value: check.serialNumber || 'N/A' },
        { label: 'Inspector', value: check.inspectorName || 'Not specified' },
        { label: 'Check Date', value: check.checkDate.toLocaleString() },
        { 
          label: 'Safe to Use', 
          value: check.safeToUse ? '✓ YES' : '✗ NO', 
          highlight: true, 
          color: check.safeToUse ? '#22c55e' : '#ef4444' 
        },
      ],
      alertSection: check.defectsFound ? {
        title: '⚠️ Defects Found:',
        content: check.defectsFound,
      } : undefined,
    },
    recipientEmail
  );
}
