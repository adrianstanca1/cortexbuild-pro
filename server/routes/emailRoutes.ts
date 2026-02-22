import { Router, Request, Response, NextFunction } from 'express';
import { emailService } from '../services/emailService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Verify email with token
 * GET /api/email/verify/:token
 */
router.get('/verify/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new AppError('Verification token is required', 400);
    }

    const isVerified = await emailService.verifyEmailToken(token);

    if (!isVerified) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Resend email verification
 * POST /api/email/resend-verification
 */
router.post('/resend-verification', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const sent = await emailService.resendEmailVerification(userId);

    if (!sent) {
      throw new AppError('Email already verified or user not found', 400);
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Check email verification status
 * GET /api/email/verification-status
 */
router.get('/verification-status', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const isVerified = await emailService.isEmailVerified(userId);

    res.json({
      verified: isVerified
    });
  } catch (error) {
    next(error);
  }
});

export default router;
