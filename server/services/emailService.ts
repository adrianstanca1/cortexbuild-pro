import { logger } from '../utils/logger.js';
import sgMail from '@sendgrid/mail';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
    templateId?: string;
    dynamicTemplateData?: any;
}

class EmailService {
    private isConfigured: boolean = false;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        const apiKey = process.env.SENDGRID_API_KEY;
        const fromEmail = process.env.EMAIL_FROM;

        if (apiKey) {
            sgMail.setApiKey(apiKey);
            this.isConfigured = true;
            logger.info('EmailService: SendGrid API Key configured');
        } else {
            logger.error('EmailService: SENDGRID_API_KEY is missing. Real emails will NOT be sent.');
        }

        if (!fromEmail && this.isConfigured) {
            logger.warn('EmailService: EMAIL_FROM is missing. Emails may fail if using unverified senders.');
        }
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        const { to, subject, text, html, templateId, dynamicTemplateData } = options;

        if (!this.isConfigured) {
            logger.info(`[MOCK EMAIL SERVICE] To: ${to} | Subject: ${subject}`);
            logger.info(`[MOCK EMAIL BODY] ${text}`);
            if (templateId) logger.info(`[MOCK EMAIL TEMPLATE] ID: ${templateId}`);
            return true;
        }

        try {
            const from = process.env.EMAIL_FROM || 'noreply@cortexbuildpro.com';

            const msg: any = {
                to,
                from,
                subject,
            };

            // Use SendGrid Dynamic Template if provided
            if (templateId) {
                msg.templateId = templateId;
                msg.dynamicTemplateData = dynamicTemplateData || {};
            } else {
                msg.text = text;
                msg.html = html || text.replace(/\n/g, '<br/>');
            }

            logger.debug(`Sending email to ${to} from ${from}${templateId ? ` (template: ${templateId})` : ''}...`);
            await sgMail.send(msg);
            logger.info(`Email successfully sent to ${to}`);
            return true;
        } catch (error: any) {
            const details = error.response?.body?.errors || error.message;
            logger.error('EmailService: Failed to send email via SendGrid', {
                to,
                error: details,
                stack: error.stack
            });
            return false;
        }
    }

    async sendInvitation(to: string, role: string, companyName: string, inviteLink: string) {
        const templateId = process.env.SENDGRID_TEMPLATE_INVITATION;

        if (templateId) {
            return this.sendEmail({
                to,
                subject: `You've been invited to join ${companyName}`,
                text: `Accept your invitation: ${inviteLink}`,
                templateId,
                dynamicTemplateData: {
                    role,
                    company_name: companyName,
                    invite_link: inviteLink,
                    subject: `You've been invited to join ${companyName} on CortexBuild Pro`
                }
            });
        }

        // Fallback HTML
        const subject = `You've been invited to join ${companyName} on CortexBuild Pro`;
        const text = `
            Hello,

            You have been invited to join ${companyName} as a ${role}.
            
            Click the link below to accept your invitation:
            ${inviteLink}

            If you did not expect this invitation, please ignore this email.
        `;

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to CortexBuild Pro</h2>
                <p>Hello,</p>
                <p>You have been invited to join <strong>${companyName}</strong> as a <strong>${role}</strong>.</p>
                <br/>
                <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Accept Invitation</a>
                <br/><br/>
                <p>If the button doesn't work, copy and paste this link:</p>
                <p>${inviteLink}</p>
            </div>
        `;

        return this.sendEmail({ to, subject, text, html });
    }

    async sendCompanyOwnerActivation(
        to: string,
        ownerName: string,
        companyName: string,
        companyDetails: {
            plan: string;
            storageQuota: number;
            region: string;
        },
        activationLink: string
    ) {
        const templateId = process.env.SENDGRID_TEMPLATE_ACTIVATION;

        if (templateId) {
            return this.sendEmail({
                to,
                subject: `Activate Your Company: ${companyName}`,
                text: `Welcome ${ownerName}! Activate your company: ${activationLink}`,
                templateId,
                dynamicTemplateData: {
                    owner_name: ownerName,
                    company_name: companyName,
                    plan: companyDetails.plan,
                    storage_quota: companyDetails.storageQuota,
                    region: companyDetails.region,
                    activation_link: activationLink,
                    subject: `Activate Your Company: ${companyName} - CortexBuild Pro`
                }
            });
        }

        const subject = `Activate Your Company: ${companyName} - CortexBuild Pro`;

        // Try to read HTML template file
        const fs = await import('fs/promises');
        const path = await import('path');
        const __dirname = path.dirname(new URL(import.meta.url).pathname);

        let html: string;
        try {
            const templatePath = path.join(__dirname, '../templates/company_activation_email.html');
            html = await fs.readFile(templatePath, 'utf-8');

            html = html
                .replace(/{{ownerName}}/g, ownerName)
                .replace(/{{companyName}}/g, companyName)
                .replace(/{{plan}}/g, companyDetails.plan)
                .replace(/{{storageQuota}}/g, companyDetails.storageQuota.toString())
                .replace(/{{region}}/g, companyDetails.region)
                .replace(/{{activationLink}}/g, activationLink);
        } catch (error) {
            logger.warn('Company activation email template not found, using fallback HTML');
            html = this.getCompanyActivationFallbackHtml(ownerName, companyName, companyDetails, activationLink);
        }

        const text = `
Welcome ${ownerName}! 

Congratulations! A new company has been created for you on CortexBuild Pro. You've been designated as the Company Owner with full administrative control.

Company Details:
- Company Name: ${companyName}
- Plan: ${companyDetails.plan}
- Storage: ${companyDetails.storageQuota} GB
- Region: ${companyDetails.region}

To activate your company and get started, please click the link below to set your password and complete the setup process:

${activationLink}

This activation link will expire in 7 days for security purposes.

Need help? Contact us at support@cortexbuildpro.com

© 2025 CortexBuild Pro. All rights reserved.
        `.trim();

        return this.sendEmail({ to, subject, text, html });
    }

    private getCompanyActivationFallbackHtml(
        ownerName: string,
        companyName: string,
        companyDetails: { plan: string; storageQuota: number; region: string },
        activationLink: string
    ): string {
        return `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0f5c82 0%, #1e88e5 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🏗️ CortexBuild Pro</h1>
                    <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 16px;">Your Company is Ready to Launch</p>
                </div>
                <div style="padding: 40px 30px;">
                    <h2 style="color: #0f5c82; font-size: 24px;">Welcome, ${ownerName}! 👋</h2>
                    <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                        Congratulations! A new company has been created for you on <strong>CortexBuild Pro</strong>. 
                        You've been designated as the <strong>Company Owner</strong> with full administrative control.
                    </p>
                    <div style="margin: 24px 0; background-color: #f4f4f5; border-radius: 8px; border-left: 4px solid #0f5c82; padding: 20px;">
                        <h3 style="margin: 0 0 12px 0; color: #18181b; font-size: 18px;">📋 Company Details</h3>
                        <p style="margin: 6px 0; color: #18181b;"><strong>Company:</strong> ${companyName}</p>
                        <p style="margin: 6px 0; color: #18181b;"><strong>Plan:</strong> ${companyDetails.plan}</p>
                        <p style="margin: 6px 0; color: #18181b;"><strong>Storage:</strong> ${companyDetails.storageQuota} GB</p>
                        <p style="margin: 6px 0; color: #18181b;"><strong>Region:</strong> ${companyDetails.region}</p>
                    </div>
                    <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                        To activate your company and get started, please click the button below to set your password.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${activationLink}" style="display: inline-block; background-color: #0f5c82; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            🚀 Activate Company & Set Password
                        </a>
                    </div>
                    <p style="margin: 24px 0 0 0; color: #71717a; font-size: 13px;">
                        If the button doesn't work, copy and paste this link:<br/>
                        <a href="${activationLink}" style="color: #0f5c82;">${activationLink}</a>
                    </p>
                </div>
            </div>
        `;
    }

    async sendPasswordResetEmail(to: string, name: string, resetToken: string) {
        const templateId = process.env.SENDGRID_TEMPLATE_PASSWORD_RESET;

        if (templateId) {
            const resetLink = `${process.env.APP_URL || 'https://cortexbuildpro.com'}/reset-password?token=${resetToken}`;
            return this.sendEmail({
                to,
                subject: 'Reset your CortexBuild Pro password',
                text: `Reset your password: ${resetLink}`,
                templateId,
                dynamicTemplateData: {
                    name,
                    reset_link: resetLink,
                    subject: 'Reset your CortexBuild Pro password'
                }
            });
        }

        const subject = 'Reset your CortexBuild Pro password';
        const resetLink = `${process.env.APP_URL || 'https://cortexbuildpro.com'}/reset-password?token=${resetToken}`;

        const text = `
            Hello ${name},

            We received a request to reset your password for your CortexBuild Pro account.
            
            Click the link below to reset your password:
            ${resetLink}

            This link will expire in 24 hours.

            If you did not request a password reset, please ignore this email.
        `;

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>Hello ${name},</p>
                <p>We received a request to reset your password for your CortexBuild Pro account.</p>
                <br/>
                <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
                <br/><br/>
                <p>If the button doesn't work, copy and paste this link:</p>
                <p>${resetLink}</p>
                <p>This link will expire in 24 hours.</p>
                <br/>
                <p>If you did not request a password reset, please ignore this email.</p>
            </div>
        `;

        return this.sendEmail({ to, subject, text, html });
    }

    // Trial System Email Methods
    async sendTrialWelcomeEmail(options: { email: string; name: string; companyName: string; trialEndsAt: string }) {
        const { email, name, companyName, trialEndsAt } = options;
        const endDate = new Date(trialEndsAt).toLocaleDateString();
        const subject = `Welcome to CortexBuild - Your 14-Day Trial Starts Now!`;
        const text = `Hi ${name},\n\nWelcome to CortexBuild Pro! Your 14-day free trial has started for ${companyName}.\n\nTrial Details:\n- Duration: 14 days (expires ${endDate})\n- Storage: 5GB\n- Database: 5GB\n- Max Users: 10\n- Features: Full access\n\nGet started now!\n\n- The CortexBuild Team`;
        return this.sendEmail({ to: email, subject, text });
    }

    async sendTrialExpiringEmail(options: { email: string; name: string; companyName: string; daysRemaining: number; expiresAt: string }) {
        const { email, name, companyName, daysRemaining, expiresAt } = options;
        const endDate = new Date(expiresAt).toLocaleDateString();
        const subject = `Your CortexBuild Trial Expires in ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''}`;
        const text = `Hi ${name},\n\nYour trial for ${companyName} expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} on ${endDate}.\n\nUpgrade now to continue without interruption.\n\nContact sales@cortexbuildpro.com\n\n- The CortexBuild Team`;
        return this.sendEmail({ to: email, subject, text });
    }

    async sendTrialExpiredEmail(options: { email: string; name: string; companyName: string }) {
        const { email, name, companyName } = options;
        const subject = `Your CortexBuild Trial Has Expired`;
        const text = `Hi ${name},\n\nYour 14-day trial for ${companyName} has ended.\n\nYour data is safe (retained for 30 days).\n\nUpgrade to restore access:\nEmail: sales@cortexbuildpro.com\n\n- The CortexBuild Team`;
        return this.sendEmail({ to: email, subject, text });
    }

    async sendUpgradeConfirmationEmail(options: { email: string; name: string; companyName: string; plan: string }) {
        const { email, name, companyName, plan } = options;
        const planDetails = plan === 'pro' ? '100GB storage, 50GB database, 100 users' : '1TB storage, 500GB database, unlimited users';
        const subject = `Welcome to CortexBuild ${plan === 'pro' ? 'Pro' : 'Enterprise'}!`;
        const text = `Hi ${name},\n\nCongratulations! ${companyName} has been upgraded to CortexBuild ${plan === 'pro' ? 'Pro' : 'Enterprise'}.\n\nYour new plan includes:\n${planDetails}\n\nEnjoy unlimited access!\n\n- The CortexBuild Team`;
        return this.sendEmail({ to: email, subject, text });
    }

    /**
     * Email Verification Methods
     */
    
    /**
     * Send email verification link
     */
    async sendEmailVerification(userId: string, email: string, name: string): Promise<string> {
        const db = getDb();
        const now = new Date().toISOString();
        const token = crypto.randomBytes(32).toString('hex');
        const verificationId = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        // Store verification token
        await db.run(
            `INSERT INTO email_verifications (id, userId, email, token, verified, expiresAt, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [verificationId, userId, email, token, false, expiresAt, now]
        );

        const verificationLink = `${process.env.APP_URL || 'https://cortexbuildpro.com'}/verify-email?token=${token}`;
        const templateId = process.env.SENDGRID_TEMPLATE_EMAIL_VERIFICATION;

        if (templateId) {
            await this.sendEmail({
                to: email,
                subject: 'Verify your email address',
                text: `Verify your email: ${verificationLink}`,
                templateId,
                dynamicTemplateData: {
                    name,
                    verification_link: verificationLink,
                    subject: 'Verify your email address - CortexBuild Pro'
                }
            });
        } else {
            // Fallback HTML
            const subject = 'Verify your email address - CortexBuild Pro';
            const text = `
                Hello ${name},

                Thank you for signing up with CortexBuild Pro! 
                
                Please verify your email address by clicking the link below:
                ${verificationLink}

                This link will expire in 24 hours.

                If you did not sign up for CortexBuild Pro, please ignore this email.
            `;

            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #0f5c82 0%, #1e88e5 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🏗️ CortexBuild Pro</h1>
                        <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 16px;">Email Verification Required</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="color: #0f5c82; font-size: 24px;">Hello ${name}! 👋</h2>
                        <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                            Thank you for signing up with <strong>CortexBuild Pro</strong>! 
                        </p>
                        <p style="color: #52525b; font-size: 16px; line-height: 1.6;">
                            To complete your registration, please verify your email address by clicking the button below:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationLink}" style="display: inline-block; background-color: #0f5c82; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                ✓ Verify Email Address
                            </a>
                        </div>
                        <p style="margin: 24px 0 0 0; color: #71717a; font-size: 13px;">
                            If the button doesn't work, copy and paste this link:<br/>
                            <a href="${verificationLink}" style="color: #0f5c82;">${verificationLink}</a>
                        </p>
                        <p style="margin: 24px 0 0 0; color: #71717a; font-size: 13px;">
                            This link will expire in 24 hours.
                        </p>
                        <p style="margin: 24px 0 0 0; color: #71717a; font-size: 13px;">
                            If you did not sign up for CortexBuild Pro, please ignore this email.
                        </p>
                    </div>
                </div>
            `;

            await this.sendEmail({ to: email, subject, text, html });
        }

        logger.info(`Email verification sent to: ${email}`);
        return token;
    }

    /**
     * Verify email token
     */
    async verifyEmailToken(token: string): Promise<boolean> {
        const db = getDb();
        const now = new Date().toISOString();

        const verification = await db.get(
            `SELECT * FROM email_verifications 
             WHERE token = ? AND verified = FALSE AND expiresAt > ?`,
            [token, now]
        );

        if (!verification) {
            return false;
        }

        // Mark as verified
        await db.run(
            `UPDATE email_verifications 
             SET verified = TRUE, verifiedAt = ?
             WHERE id = ?`,
            [now, verification.id]
        );

        // Update user status if needed
        await db.run(
            `UPDATE users 
             SET status = 'active', updatedAt = ?
             WHERE id = ? AND status = 'pending'`,
            [now, verification.userId]
        );

        logger.info(`Email verified for user: ${verification.userId}`);
        return true;
    }

    /**
     * Check if user's email is verified
     */
    async isEmailVerified(userId: string): Promise<boolean> {
        const db = getDb();
        
        const verification = await db.get(
            `SELECT * FROM email_verifications 
             WHERE userId = ? AND verified = TRUE
             ORDER BY verifiedAt DESC
             LIMIT 1`,
            [userId]
        );

        return !!verification;
    }

    /**
     * Resend email verification
     */
    async resendEmailVerification(userId: string): Promise<boolean> {
        const db = getDb();
        
        const user = await db.get('SELECT email, name FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return false;
        }

        // Check if already verified
        const isVerified = await this.isEmailVerified(userId);
        if (isVerified) {
            return false; // Already verified
        }

        // Invalidate old tokens
        await db.run(
            `UPDATE email_verifications 
             SET verified = FALSE, expiresAt = ?
             WHERE userId = ? AND verified = FALSE`,
            [new Date().toISOString(), userId]
        );

        // Send new verification email
        await this.sendEmailVerification(userId, user.email, user.name);
        
        return true;
    }
}

export const emailService = new EmailService();
