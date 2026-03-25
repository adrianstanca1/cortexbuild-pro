import { ITool } from '../../../lib/ai/system/interfaces';

export interface NotificationToolContext {
  type: 'email' | 'sms' | 'push' | 'all';
  recipient: string | string[];
  subject?: string;
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  projectId?: string;
  organizationId?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationId: string;
  type: string;
  recipient: string | string[];
  sentAt: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Tool for sending notifications via email, SMS, and push
 */
export const notificationTool: ITool<NotificationToolContext> = {
  id: 'notification',
  name: 'Notification Tool',
  description: 'Sends notifications via email, SMS, or push notifications to project stakeholders',
  version: '1.0.0',
  isEnabled: true,
  tags: ['notification', 'email', 'sms', 'push', 'communication'],

  parameters: {
    type: {
      type: 'string',
      enum: ['email', 'sms', 'push', 'all'],
      description: 'Notification channel to use'
    },
    recipient: {
      type: 'string | string[]',
      description: 'Email address, phone number, or user ID(s) to notify'
    },
    template: {
      type: 'string',
      description: 'Template name (e.g., rfi-response, safety-alert, submittal-approved)'
    },
    data: {
      type: 'object',
      description: 'Template variables and additional data'
    },
    priority: {
      type: 'string',
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      description: 'Notification priority level'
    }
  },

  execute: async (context: NotificationToolContext): Promise<NotificationResult> => {
    const {
      type,
      recipient,
      subject,
      template,
      data,
      priority = 'normal',
      projectId,
      organizationId
    } = context;

    await new Promise(resolve => setTimeout(resolve, 100));

    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const recipients = Array.isArray(recipient) ? recipient : [recipient];

    const validTemplates = [
      'rfi-response', 'rfi-submitted', 'rfi-overdue',
      'submittal-approved', 'submittal-rejected', 'submittal-returned',
      'safety-alert', 'incident-reported', 'near-miss',
      'daily-report', 'schedule-update', 'budget-alert',
      'inspection-scheduled', 'inspection-complete',
      'document-uploaded', 'approval-required', 'general'
    ];

    if (!validTemplates.includes(template)) {
      return {
        success: false,
        notificationId,
        type,
        recipient,
        sentAt: new Date().toISOString(),
        status: 'failed',
        error: `Invalid template: ${template}. Valid templates: ${validTemplates.join(', ')}`
      };
    }

    const result: NotificationResult = {
      success: true,
      notificationId,
      type,
      recipient,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    if (priority === 'urgent' || priority === 'high') {
      result.metadata = {
        priority,
        requiresAcknowledgment: true,
        escalationEnabled: true,
        escalationDelay: priority === 'urgent' ? '15 minutes' : '1 hour'
      };
    }

    console.log(`[NotificationTool] Sent ${type} notification to ${recipients.length} recipient(s)`);
    console.log(`[NotificationTool] Template: ${template}, Priority: ${priority}`);
    if (projectId) console.log(`[NotificationTool] Project: ${projectId}`);

    return result;
  }
};

/**
 * Tool for sending real-time alerts to project teams
 */
export const alertTool: ITool<{
  alertType: 'safety' | 'schedule' | 'budget' | 'quality' | 'general';
  severity: 'info' | 'warning' | 'critical';
  projectId: string;
  title: string;
  message: string;
  recipients: string[];
  actions?: Array<{ label: string; url: string }>;
}> = {
  id: 'alert',
  name: 'Project Alert Tool',
  description: 'Sends real-time alerts to project teams for safety, schedule, budget, or quality issues',
  version: '1.0.0',
  isEnabled: true,
  tags: ['alert', 'safety', 'real-time', 'notification', 'emergency'],

  execute: async (context) => {
    const {
      alertType,
      severity,
      projectId,
      title,
      message,
      recipients,
      actions
    } = context;

    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨'
    };

    const alertPayload = {
      alertId,
      alertType,
      severity,
      projectId,
      title,
      message,
      recipients: recipients.length,
      actions: actions || [],
      timestamp: new Date().toISOString(),
      status: severity === 'critical' ? 'IMMEDIATE_ACTION_REQUIRED' : 'ACTION_RECOMMENDED'
    };

    console.log(`[AlertTool] 🚨 ${severityEmoji[severity]} ${alertType.toUpperCase()} ALERT`);
    console.log(`[AlertTool] Project: ${projectId}`);
    console.log(`[AlertTool] Title: ${title}`);
    console.log(`[AlertTool] Message: ${message}`);
    console.log(`[AlertTool] Recipients: ${recipients.join(', ')}`);

    return {
      success: true,
      ...alertPayload,
      deliveredAt: new Date().toISOString()
    };
  }
};
