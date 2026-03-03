import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from './database.js'
import logger from './logger.js'
import crypto from 'crypto'

// JWT configuration
export const JWT_SECRET: Secret = process.env.JWT_SECRET || 'change-this-in-production'
export const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret'
export const JWT_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '15m'
export const JWT_REFRESH_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']) || '7d'

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'

// Initialize Google OAuth2 strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Find or create user
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          })

          if (!user) {
            // Check if user exists with this email
            user = await prisma.user.findUnique({
              where: { email: profile.emails?.[0]?.value || '' },
            })

            if (user) {
              // Link Google account to existing user
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId: profile.id,
                  oauthProvider: 'google',
                  avatar: profile.photos?.[0]?.value,
                },
              })
            } else {
              // Create new user
              user = await prisma.user.create({
                data: {
                  email: profile.emails?.[0]?.value || '',
                  name: profile.displayName || '',
                  googleId: profile.id,
                  oauthProvider: 'google',
                  avatar: profile.photos?.[0]?.value,
                  emailVerified: true, // Google emails are verified
                  role: 'OPERATIVE', // Default role
                },
              })
            }
          } else {
            // Update user info
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                name: profile.displayName || user.name,
                avatar: profile.photos?.[0]?.value || user.avatar,
                lastLoginAt: new Date(),
              },
            })
          }

          return done(null, { ...user, userId: user.id })
        } catch (error) {
          logger.error('Google OAuth error:', error)
          return done(error as Error)
        }
      }
    )
  )
} else {
  logger.warn('Google OAuth2 credentials not configured')
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    done(null, user ? { ...user, userId: user.id } : null)
  } catch (error) {
    logger.error('Deserialize user error:', error)
    done(error as Error)
  }
})

// Generate JWT token
export const generateToken = (userId: string, email: string, role: string): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  }
  return jwt.sign({ userId, email, role }, JWT_SECRET, options)
}

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  }
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, options)
}

// Verify JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET)
}

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, JWT_REFRESH_SECRET)
}

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

export default passport

