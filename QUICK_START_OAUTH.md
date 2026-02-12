# Quick Start: Google OAuth & SendGrid Setup

This guide provides a quick-start for setting up Google OAuth and SendGrid email services.

## Prerequisites

- Node.js 18+ installed
- A Google Cloud account
- A SendGrid account (free tier available)
- Access to your DNS settings (for production email verification)

## Google OAuth Setup (5 minutes)

### 1. Create Google Cloud Project

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "CortexBuild Pro"
3. Enable the Google+ API

### 2. Configure OAuth

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" and fill in:
   - App name: **CortexBuild Pro**
   - User support email: your-email@domain.com
   - Authorized domains: `localhost`, `cortexbuildpro.com`
3. Add scopes: `userinfo.email`, `userinfo.profile`
4. Add test users (in testing mode)

### 3. Create Credentials

1. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
2. Application type: **Web application**
3. Add Authorized redirect URIs:
   ```
   http://localhost:3001/api/auth/google/callback
   https://api.cortexbuildpro.com/api/auth/google/callback
   ```
4. Copy your **Client ID** and **Client Secret**

### 4. Update Environment Variables

Add to your `.env` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:5173
```

## SendGrid Setup (5 minutes)

### 1. Create SendGrid Account

1. Visit [SendGrid](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day)
3. Verify your email address

### 2. Verify Sender Identity

Choose one option:

#### Option A: Single Sender (Quick - for testing)
1. Go to "Settings" → "Sender Authentication"
2. Click "Verify a Single Sender"
3. Fill in sender details and verify your email

#### Option B: Domain Authentication (Recommended - for production)
1. Go to "Settings" → "Sender Authentication"
2. Click "Authenticate Your Domain"
3. Add DNS records provided by SendGrid
4. Verify DNS propagation

### 3. Create API Key

1. Go to "Settings" → "API Keys"
2. Click "Create API Key"
3. Name: "CortexBuild Pro Production"
4. Select "Full Access" or "Mail Send" permission
5. Copy the API key (you won't see it again!)

### 4. Update Environment Variables

Add to your `.env` file:

```bash
# SendGrid
SENDGRID_API_KEY=SG.your-api-key-here
EMAIL_FROM=noreply@yourdomain.com

# Optional: SendGrid Dynamic Templates
SENDGRID_TEMPLATE_EMAIL_VERIFICATION=d-xxxxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxx
SENDGRID_TEMPLATE_INVITATION=d-xxxxx
SENDGRID_TEMPLATE_ACTIVATION=d-xxxxx
```

## Testing Locally

### 1. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ..
npm install
```

### 2. Initialize Database

```bash
cd server
npm start
# Database will auto-initialize with new tables
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd ..
npm run dev
```

### 4. Test Google OAuth

1. Navigate to `http://localhost:5173/login`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. You should be redirected to dashboard

### 5. Test Email Sending

```bash
# Register a new user (triggers welcome email)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User",
    "companyName": "Test Company"
  }'
```

Check your SendGrid dashboard for sent emails.

## Production Deployment

### Update Environment Variables

```bash
# Google OAuth - Production URLs
GOOGLE_CALLBACK_URL=https://api.cortexbuildpro.com/api/auth/google/callback
FRONTEND_URL=https://cortexbuildpro.com
APP_URL=https://cortexbuildpro.com

# SendGrid - Use verified domain
EMAIL_FROM=noreply@yourdomain.com
```

### Google OAuth - Add Production URIs

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add production URIs:
   ```
   https://cortexbuildpro.com
   https://api.cortexbuildpro.com/api/auth/google/callback
   ```

### SendGrid - Domain Authentication

1. Complete domain authentication in SendGrid
2. Update `EMAIL_FROM` to use your verified domain
3. Test email delivery

## Troubleshooting

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Verify callback URL matches exactly in Google Console
- Check for trailing slashes
- Ensure protocol (http/https) matches

**Error: "access_denied"**
- User declined authorization
- Add user to test users list (if in testing mode)

### SendGrid Issues

**Emails not sending**
- Verify API key is correct
- Check sender is verified
- Review SendGrid activity logs

**Emails going to spam**
- Set up domain authentication (SPF, DKIM, DMARC)
- Avoid spam trigger words
- Use a custom sending domain

## API Endpoints Reference

### Google OAuth
- `GET /api/auth/google` - Initiate OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/google/link` - Link account (authenticated)
- `DELETE /api/auth/google/unlink` - Unlink account (authenticated)
- `GET /api/auth/oauth/providers` - List linked providers (authenticated)

### Email Verification
- `GET /api/email/verify/:token` - Verify email
- `POST /api/email/resend-verification` - Resend verification (authenticated)
- `GET /api/email/verification-status` - Check status (authenticated)

## Security Checklist

- [ ] Environment variables are not committed to Git
- [ ] Using HTTPS in production
- [ ] Google OAuth callback URL uses HTTPS
- [ ] SendGrid domain authentication configured
- [ ] API keys are stored securely
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] JWT_SECRET is strong and unique

## Need Help?

- **Full Documentation**: See [OAUTH_SENDGRID_SETUP.md](./OAUTH_SENDGRID_SETUP.md)
- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **SendGrid Docs**: https://docs.sendgrid.com/
- **Support**: support@cortexbuildpro.com

---

**Estimated Setup Time**: 10-15 minutes
**Difficulty Level**: Beginner-Intermediate

For production deployment and advanced configuration, refer to the full documentation.
