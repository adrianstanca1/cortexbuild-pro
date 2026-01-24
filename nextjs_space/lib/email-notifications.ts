// Email notification helper functions for safety checks

interface NotificationResult {
  success: boolean;
  message?: string;
  notification_disabled?: boolean;
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
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: process.env.NOTIF_ID_TOOLBOX_TALK_COMPLETED,
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
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: process.env.NOTIF_ID_MEWP_CHECK_COMPLETED,
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
        deployment_token: process.env.ABACUSAI_API_KEY,
        app_id: process.env.WEB_APP_ID,
        notification_id: process.env.NOTIF_ID_TOOL_CHECK_COMPLETED,
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
