import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import passport from 'passport';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { UserRole } from '../types/rbac.js';
import { authService } from './authService.js';
import jwt from 'jsonwebtoken';

interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string; verified: boolean }>;
  photos?: Array<{ value: string }>;
  provider: string;
  _json: any;
}

interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export class GoogleOAuthService {
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      logger.warn('Google OAuth not configured. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.');
      return;
    }

    this.isConfigured = true;

    // Configure Passport Google Strategy
    passport.use(
      new GoogleStrategy(
        {
          clientID: clientId,
          clientSecret: clientSecret,
          callbackURL: callbackURL,
          scope: ['profile', 'email'],
          passReqToCallback: true,
        },
        async (req: any, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
          try {
            const result = await this.handleGoogleCallback(
              profile as GoogleProfile,
              { accessToken, refreshToken },
              req.query?.state
            );
            done(null, result);
          } catch (error) {
            done(error as Error, undefined);
          }
        }
      )
    );

    // Serialize and deserialize user for session support
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        const db = getDb();
        const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });

    logger.info('Google OAuth Service initialized successfully');
  }

  isEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Handle Google OAuth callback and create/link user account
   */
  private async handleGoogleCallback(
    profile: GoogleProfile,
    tokens: OAuthTokens,
    state?: string
  ): Promise<any> {
    const db = getDb();
    const now = new Date().toISOString();
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new AppError('No email provided by Google', 400);
    }

    // Check if OAuth provider already exists
    const existingOAuth = await db.get(
      'SELECT * FROM oauth_providers WHERE provider = ? AND providerId = ?',
      ['google', profile.id]
    );

    if (existingOAuth) {
      // Update existing OAuth tokens
      await db.run(
        `UPDATE oauth_providers 
         SET accessToken = ?, refreshToken = ?, tokenExpiry = ?, updatedAt = ?
         WHERE id = ?`,
        [
          tokens.accessToken,
          tokens.refreshToken || existingOAuth.refreshToken,
          tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString() : null,
          now,
          existingOAuth.id
        ]
      );

      // Get user
      const user = await db.get('SELECT * FROM users WHERE id = ?', [existingOAuth.userId]);
      
      if (!user) {
        throw new AppError('User not found for existing OAuth provider', 404);
      }

      return this.generateUserSession(user);
    }

    // Check if user with this email already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUser) {
      // Link Google account to existing user
      await this.linkGoogleAccount(existingUser.id, profile, tokens);
      return this.generateUserSession(existingUser);
    }

    // Create new user with Google OAuth
    const userId = uuidv4();
    const oauthId = uuidv4();

    await db.transaction(async (tx) => {
      // Create user (no password required for OAuth users)
      await tx.run(
        `INSERT INTO users (id, email, name, password, role, status, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          email,
          profile.displayName || email.split('@')[0],
          '', // Empty password for OAuth users
          UserRole.OPERATIVE,
          'active',
          true,
          now,
          now
        ]
      );

      // Create OAuth provider record
      await tx.run(
        `INSERT INTO oauth_providers (id, userId, provider, providerId, email, accessToken, refreshToken, tokenExpiry, profile, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          oauthId,
          userId,
          'google',
          profile.id,
          email,
          tokens.accessToken,
          tokens.refreshToken || null,
          tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString() : null,
          JSON.stringify(profile._json),
          now,
          now
        ]
      );
    });

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    logger.info(`New user created via Google OAuth: ${userId} (${email})`);

    return this.generateUserSession(user);
  }

  /**
   * Link Google account to existing user
   */
  async linkGoogleAccount(userId: string, profile: GoogleProfile, tokens: OAuthTokens): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    const oauthId = uuidv4();

    // Check if this Google account is already linked to another user
    const existingLink = await db.get(
      'SELECT * FROM oauth_providers WHERE provider = ? AND providerId = ?',
      ['google', profile.id]
    );

    if (existingLink) {
      if (existingLink.userId !== userId) {
        throw new AppError('This Google account is already linked to another user', 409);
      }
      // Already linked to this user, just update tokens
      await db.run(
        `UPDATE oauth_providers 
         SET accessToken = ?, refreshToken = ?, tokenExpiry = ?, updatedAt = ?
         WHERE id = ?`,
        [
          tokens.accessToken,
          tokens.refreshToken || existingLink.refreshToken,
          tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString() : null,
          now,
          existingLink.id
        ]
      );
      return;
    }

    // Create new OAuth link
    await db.run(
      `INSERT INTO oauth_providers (id, userId, provider, providerId, email, accessToken, refreshToken, tokenExpiry, profile, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        oauthId,
        userId,
        'google',
        profile.id,
        profile.emails?.[0]?.value,
        tokens.accessToken,
        tokens.refreshToken || null,
        tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000).toISOString() : null,
        JSON.stringify(profile._json),
        now,
        now
      ]
    );

    logger.info(`Google account linked to user: ${userId}`);
  }

  /**
   * Unlink Google account from user
   */
  async unlinkGoogleAccount(userId: string): Promise<void> {
    const db = getDb();

    // Check if user has a password set (so they can still login)
    const user = await db.get('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (!user || !user.password || user.password === '') {
      throw new AppError('Cannot unlink Google account - no alternative login method available. Please set a password first.', 400);
    }

    const result = await db.run(
      'DELETE FROM oauth_providers WHERE userId = ? AND provider = ?',
      [userId, 'google']
    );

    if (result.changes === 0) {
      throw new AppError('No Google account linked to this user', 404);
    }

    logger.info(`Google account unlinked from user: ${userId}`);
  }

  /**
   * Get OAuth provider info for a user
   */
  async getUserOAuthProviders(userId: string): Promise<any[]> {
    const db = getDb();
    const providers = await db.all(
      'SELECT id, provider, email, createdAt FROM oauth_providers WHERE userId = ?',
      [userId]
    );
    return providers;
  }

  /**
   * Generate JWT session for user
   */
  private async generateUserSession(user: any): Promise<any> {
    const permissions = await authService['getUserPermissions'](user.id, user.companyId);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      permissions,
      token
    };
  }

  /**
   * Refresh Google OAuth token
   */
  async refreshAccessToken(userId: string): Promise<string | null> {
    const db = getDb();
    
    const oauthProvider = await db.get(
      'SELECT * FROM oauth_providers WHERE userId = ? AND provider = ?',
      [userId, 'google']
    );

    if (!oauthProvider || !oauthProvider.refreshToken) {
      return null;
    }

    try {
      // Use Google APIs to refresh token
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
      );

      oauth2Client.setCredentials({
        refresh_token: oauthProvider.refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        // Update token in database
        await db.run(
          `UPDATE oauth_providers 
           SET accessToken = ?, tokenExpiry = ?, updatedAt = ?
           WHERE id = ?`,
          [
            credentials.access_token,
            credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
            new Date().toISOString(),
            oauthProvider.id
          ]
        );

        return credentials.access_token;
      }

      return null;
    } catch (error) {
      logger.error('Failed to refresh Google OAuth token', error);
      return null;
    }
  }
}

export const googleOAuthService = new GoogleOAuthService();
