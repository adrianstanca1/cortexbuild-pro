import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { googleOAuthService } from '../services/googleOAuthService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Initiate Google OAuth flow
 * GET /api/auth/google
 */
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  if (!googleOAuthService.isEnabled()) {
    return res.status(503).json({
      error: 'Google OAuth is not configured on this server'
    });
  }

  // Optional: pass state parameter for linking accounts
  const state = req.query.link_account === 'true' ? 'link' : undefined;
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state,
    session: false
  })(req, res, next);
});

/**
 * Google OAuth callback
 * GET /api/auth/google/callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: '/login?error=oauth_failed' 
  }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      if (!user || !user.token) {
        throw new AppError('Authentication failed', 401);
      }

      // Redirect to frontend with token
      const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${redirectUrl}/auth/callback?token=${user.token}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId
      }))}`);
    } catch (error) {
      logger.error('OAuth callback error:', error);
      const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${redirectUrl}/login?error=oauth_callback_failed`);
    }
  }
);

/**
 * Link Google account to existing user (requires authentication)
 * POST /api/auth/google/link
 */
router.post('/google/link', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    // Return URL to initiate OAuth flow with link flag
    const authUrl = `${req.protocol}://${req.get('host')}/api/auth/google?link_account=true`;
    
    res.json({
      message: 'Navigate to the provided URL to link your Google account',
      authUrl
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Unlink Google account from user
 * DELETE /api/auth/google/unlink
 */
router.delete('/google/unlink', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    await googleOAuthService.unlinkGoogleAccount(userId);
    
    res.json({
      message: 'Google account unlinked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get OAuth providers linked to user
 * GET /api/auth/oauth/providers
 */
router.get('/oauth/providers', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const providers = await googleOAuthService.getUserOAuthProviders(userId);
    
    res.json({
      providers
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Refresh OAuth access token
 * POST /api/auth/oauth/refresh
 */
router.post('/oauth/refresh', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const accessToken = await googleOAuthService.refreshAccessToken(userId);
    
    if (!accessToken) {
      throw new AppError('Failed to refresh access token', 400);
    }

    res.json({
      message: 'Access token refreshed successfully',
      accessToken
    });
  } catch (error) {
    next(error);
  }
});

export default router;
