import { getDb, IDatabase } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError.js';
import { emailService } from './emailService.js';
import { taskService } from './taskService.js';
import { logger } from '../utils/logger.js';
import { broadcastToCompany, broadcastToSuperAdmins } from '../socket.js';
import { auditService } from './auditService.js';
import * as fs from 'fs';
import * as path from 'path';
import { BackupService } from './backupService.js';


export interface Automation {
    id: string;
    companyId: string;
    name: string;
    triggerType: string;
    actionType: string;
    configuration: string; // JSON
    enabled: boolean;
}

export class WorkflowService {
    /**
     * Trigger an automation flow
     */
    static async trigger(companyId: string, triggerType: string, context: any, tenantDb?: IDatabase) {
        const db = tenantDb || getDb();
        const automations = await db.all(
            'SELECT * FROM automations WHERE companyId = ? AND triggerType = ? AND enabled = 1',
            [companyId, triggerType]
        );

        logger.info(`[Workflow] Triggered ${triggerType} for company ${companyId}. Found ${automations.length} automations.`);

        for (const automation of automations) {
            try {
                await this.executeAction(automation, context, db);
            } catch (error) {
                logger.error(`[Workflow] Failed to execute action for automation ${automation.id}:`, error);
            }
        }
    }

    /**
     * Manual execution of an automation
     */
    static async executeManual(companyId: string, id: string, userId: string) {
        const db = getDb();
        const automation = await db.get('SELECT * FROM automations WHERE id = ? AND companyId = ?', [id, companyId]);
        if (!automation) throw new AppError('Automation not found', 404);

        const context = {
            manual: true,
            triggeredBy: userId,
            timestamp: new Date().toISOString()
        };

        await this.executeAction(automation, context, db);
        return { success: true, executed: true };
    }

    /**
     * Execute specific action
     */
    private static async executeAction(automation: any, context: any, dbInstance?: IDatabase) {
        const config = JSON.parse(automation.configuration || '{}');
        const db = dbInstance || getDb();

        switch (automation.type || automation.actionType) {
            case 'cleanup_audit_logs': {
                const days = config.daysToKeep || 90;
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                await auditService.deleteOldLogs(db, cutoff.toISOString());
                logger.info(`[Workflow] Action Executed: Cleanup Audit Logs older than ${days} days`);
                break;
            }

            case 'cleanup_old_projects': {
                const days = config.daysToArchive || 180;
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                await db.run(
                    "UPDATE projects SET status = 'Archived', updatedAt = ? WHERE updatedAt < ? AND status != 'Archived' AND companyId = ?",
                    [new Date().toISOString(), cutoff.toISOString(), automation.companyId]
                );
                logger.info(`[Workflow] Action Executed: Archived projects older than ${days} days`);
                break;
            }

            case 'inactive_user_purge': {
                const days = config.daysInactive || 365;
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                // Soft delete inactive users
                await db.run(
                    "UPDATE users SET status = 'suspended', isActive = 0, updatedAt = ? WHERE updatedAt < ? AND status = 'active' AND companyId = ?",
                    [new Date().toISOString(), cutoff.toISOString(), automation.companyId]
                );
                logger.info(`[Workflow] Action Executed: Suspended users inactive for ${days} days`);
                break;
            }

            case 'database_backup': {
                try {
                    const backup = await BackupService.createBackup();
                    logger.info(`[Workflow] Backup created: ${backup.path}`);
                } catch (error) {
                    logger.error(`[Workflow] Backup failed:`, error);
                }
                break;
            }

            case 'send_notification': {
                // Fetch all users in the company to send notification to
                const users = await db.all('SELECT id FROM users WHERE companyId = ?', [automation.companyId]);

                for (const user of users) {
                    const notificationId = uuidv4();
                    const notification = {
                        id: notificationId,
                        userId: user.id,
                        title: config.title || `Automation: ${automation.name}`,
                        message: config.message || `Triggered by ${automation.triggerType}`,
                        type: config.type || 'info',
                        isRead: 0,
                        createdAt: new Date().toISOString(),
                        companyId: automation.companyId
                    };

                    await db.run(
                        'INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt, companyId) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
                        [notification.id, notification.userId, notification.title, notification.message, notification.type, notification.createdAt, notification.companyId]
                    );

                    // Broadcast Notification to specific user
                    broadcastToCompany(automation.companyId, {
                        type: 'notification',
                        userId: user.id,
                        data: notification
                    });
                }
                logger.info(`[Workflow] Action Executed: Notifications sent to ${users.length} users for ${automation.id}`);
                break;
            }

            case 'update_task_priority':
                if (context.taskId && config.priority) {
                    await db.run(
                        'UPDATE tasks SET priority = ?, updatedAt = ? WHERE id = ? AND companyId = ?',
                        [config.priority, new Date().toISOString(), context.taskId, automation.companyId]
                    );

                    // Broadcast Task Update
                    const updatedTask = await taskService.getTask(db, 'SYSTEM', automation.companyId, context.taskId);
                    broadcastToCompany(automation.companyId, {
                        type: 'entity_update',
                        entityType: 'tasks',
                        id: context.taskId,
                        data: updatedTask,
                        changes: { priority: config.priority }
                    });

                    logger.info(`[Workflow] Action Executed: Task ${context.taskId} priority updated to ${config.priority}`);
                }
                break;

            case 'send_email': {
                if (config.to && config.subject) {
                    await emailService.sendEmail({
                        to: config.to,
                        subject: config.subject,
                        text: config.message || `Automation Triggered: ${automation.name}`,
                        html: config.html
                    });
                    logger.info(`[Workflow] Action Executed: Email sent for ${automation.id}`);
                }
                break;
            }

            case 'create_task': {
                const projectId = context.projectId || context.project?.id;
                if (config.title && projectId) {
                    const newTask = await taskService.createTask(db, 'SYSTEM', automation.companyId, {
                        projectId: projectId,
                        title: config.title,
                        description: config.description || `Automated task from ${automation.name}`,
                        status: config.status || 'Todo',
                        priority: config.priority || 'Medium',
                        dueDate: config.dueDate || new Date(Date.now() + 86400000 * 3).toISOString() // Default 3 days
                    });

                    // Broadcast Task Creation
                    broadcastToCompany(automation.companyId, {
                        type: 'entity_create',
                        entityType: 'tasks',
                        data: newTask,
                        timestamp: new Date().toISOString()
                    });

                    logger.info(`[Workflow] Action Executed: Task created for ${automation.id}`);
                }
                break;
            }

            case 'webhook': {
                if (config.url) {
                    try {
                        const payload = {
                            automationId: automation.id,
                            trigger: automation.triggerType,
                            timestamp: new Date().toISOString(),
                            data: context
                        };

                        // Use dynamic import for fetch if needed, or global fetch in Node 18+
                        const response = await fetch(config.url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        logger.info(`[Workflow] Webhook sent to ${config.url}. Status: ${response.status}`);
                    } catch (error) {
                        logger.error(`[Workflow] Webhook failed for ${automation.id}:`, error);
                    }
                }
                break;
            }

            case 'notify_channel': {
                // Determine channel ID based on config (e.g., '#general' or dynamic)
                // For now, we simulate channel notification by broadcasting a 'channel_message' event
                const channelName = config.channel || 'general';
                const message = config.message || `Automation Alert: ${automation.name}`;

                broadcastToCompany(automation.companyId, {
                    type: 'channel_message',
                    channel: channelName,
                    message: message,
                    context: context,
                    timestamp: new Date().toISOString()
                });

                logger.info(`[Workflow] Action Executed: Notified channel ${channelName} for ${automation.id}`);
                break;
            }

            default:
                logger.warn(`[Workflow] Unknown action type: ${automation.actionType}`);
        }

        // Broadcast Automation Execution Event (for UI "last run" updates)
        const eventData = {
            type: 'automation_executed',
            automationId: automation.id,
            companyId: automation.companyId,
            timestamp: new Date().toISOString()
        };

        broadcastToCompany(automation.companyId, eventData);
        broadcastToSuperAdmins(eventData);
    }

    /**
     * CRUD: Get all automations for a tenant
     */
    static async getAutomations(companyId: string) {
        const db = getDb();
        return await db.all('SELECT * FROM automations WHERE companyId = ?', [companyId]);
    }

    /**
     * CRUD: Create automation
     */
    static async createAutomation(companyId: string, data: any) {
        const db = getDb();
        const id = uuidv4();
        const now = new Date().toISOString();

        // Map legacy/UI type to actionType/triggerType
        const triggerType = data.triggerType || (data.schedule ? 'SCHEDULE' : 'MANUAL');
        const actionType = data.actionType || data.type;

        await db.run(
            'INSERT INTO automations (id, companyId, name, triggerType, actionType, configuration, enabled, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                id,
                companyId,
                data.name,
                triggerType,
                actionType,
                JSON.stringify(data.configuration || data.config || {}),
                data.enabled ?? 1,
                now,
                now
            ]
        );

        return { id, ...data, triggerType, actionType };
    }

    /**
     * CRUD: Update automation
     */
    static async updateAutomation(companyId: string, id: string, data: any) {
        const db = getDb();
        const existing = await db.get('SELECT id FROM automations WHERE id = ? AND companyId = ?', [id, companyId]);
        if (!existing) throw new AppError('Automation not found', 404);

        const updates: string[] = [];
        const params: any[] = [];

        if (data.name) { updates.push('name = ?'); params.push(data.name); }
        if (data.triggerType) { updates.push('triggerType = ?'); params.push(data.triggerType); }
        if (data.actionType) { updates.push('actionType = ?'); params.push(data.actionType); }
        if (data.configuration || data.config) { updates.push('configuration = ?'); params.push(JSON.stringify(data.configuration || data.config)); }
        if (data.enabled !== undefined) { updates.push('enabled = ?'); params.push(data.enabled ? 1 : 0); }

        updates.push('updatedAt = ?');
        params.push(new Date().toISOString());

        params.push(id);
        params.push(companyId);

        await db.run(
            `UPDATE automations SET ${updates.join(', ')} WHERE id = ? AND companyId = ?`,
            params
        );

        return { id, success: true };
    }

    /**
     * CRUD: Delete automation
     */
    static async deleteAutomation(companyId: string, id: string) {
        const db = getDb();
        await db.run('DELETE FROM automations WHERE id = ? AND companyId = ?', [id, companyId]);
        return { success: true };
    }
}
