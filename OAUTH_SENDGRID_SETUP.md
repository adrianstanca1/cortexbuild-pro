# Google OAuth & SendGrid Integration Guide

This document provides comprehensive instructions for setting up and using Google OAuth authentication and SendGrid email services in the CortexBuild Pro application.

## Table of Contents
1. [Google OAuth Setup](#google-oauth-setup)
2. [SendGrid Email Setup](#sendgrid-email-setup)
3. [Environment Configuration](#environment-configuration)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration](#frontend-integration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Google OAuth Setup

### Prerequisites
- A Google Cloud Platform account
- Access to Google Cloud Console

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name your project (e.g., "CortexBuild Pro")
4. Click "Create"

### Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (or "Internal" for Google Workspace)
3. Fill in the required information:
   - **App name**: CortexBuild Pro
   - **User support email**: Your support email
   - **App logo**: Upload your logo (optional)
   - **Authorized domains**: Add your domain (e.g., cortexbuildpro.com)
   - **Developer contact information**: Your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users (if in testing mode)
6. Save and continue

### Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: CortexBuild Pro Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (development)
     - `https://cortexbuildpro.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3001/api/auth/google/callback` (development)
     - `https://api.cortexbuildpro.com/api/auth/google/callback` (production)
5. Click "Create"
6. Copy your **Client ID** and **Client Secret**

---

## SendGrid Email Setup

### Prerequisites
- A SendGrid account (free tier available)

### Step 1: Create a SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Verify Sender Identity

1. Go to "Settings" → "Sender Authentication"
2. Choose one of:
   - **Single Sender Verification** (quick, for testing)
   - **Domain Authentication** (recommended for production)

#### Single Sender Verification:
1. Click "Verify a Single Sender"
2. Fill in your details:
   - From Name: CortexBuild Pro
   - From Email: noreply@yourdomain.com
   - Reply To: support@yourdomain.com
3. Verify the email you receive

#### Domain Authentication (Production):
1. Click "Authenticate Your Domain"
2. Select your DNS host
3. Follow instructions to add DNS records
4. Verify DNS records

### Step 3: Create API Key

1. Go to "Settings" → "API Keys"
2. Click "Create API Key"
3. Name it (e.g., "CortexBuild Pro Production")
4. Choose "Full Access" or "Restricted Access"
   - For restricted, enable: Mail Send
5. Copy the API key (you won't see it again!)

### Step 4: Create Email Templates (Optional)

SendGrid Dynamic Templates allow you to create beautiful, reusable email templates.

1. Go to "Email API" → "Dynamic Templates"
2. Click "Create a Dynamic Template"
3. Create templates for:
   - **Email Verification**: User email verification
   - **Password Reset**: Password reset emails
   - **Invitation**: User invitation to company
   - **Company Activation**: New company activation

#### Template Variables:
Each template can use these dynamic variables:

**Email Verification Template:**
```handlebars
{{name}} - User's name
{{verification_link}} - Verification URL
{{subject}} - Email subject
```

**Password Reset Template:**
```handlebars
{{name}} - User's name
{{reset_link}} - Password reset URL
{{subject}} - Email subject
```

**Invitation Template:**
```handlebars
{{role}} - User's role
{{company_name}} - Company name
{{invite_link}} - Invitation URL
{{subject}} - Email subject
```

**Company Activation Template:**
```handlebars
{{owner_name}} - Owner's name
{{company_name}} - Company name
{{plan}} - Subscription plan
{{storage_quota}} - Storage quota
{{region}} - Server region
{{activation_link}} - Activation URL
{{subject}} - Email subject
```

---

## Environment Configuration

Add these variables to your `.env` file:

### Required Variables

```bash
# JWT Configuration
JWT_SECRET=your-strong-jwt-secret-here
JWT_EXPIRES_IN=24h

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Application URLs
APP_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### Optional Variables (SendGrid Templates)

```bash
# SendGrid Dynamic Templates
SENDGRID_TEMPLATE_EMAIL_VERIFICATION=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_INVITATION=d-xxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_ACTIVATION=d-xxxxxxxxxxxxxxxxxxxxx
```

### Production Configuration

```bash
# Google OAuth
GOOGLE_CALLBACK_URL=https://api.cortexbuildpro.com/api/auth/google/callback

# Application URLs
APP_URL=https://cortexbuildpro.com
FRONTEND_URL=https://cortexbuildpro.com
```

---

## API Endpoints

### Google OAuth Endpoints

#### 1. Initiate OAuth Flow
```
GET /api/auth/google
```
Redirects user to Google's OAuth consent screen.

**Query Parameters:**
- `link_account` (optional): Set to "true" to link account to existing user

**Response:** Redirects to Google OAuth

---

#### 2. OAuth Callback
```
GET /api/auth/google/callback
```
Handles Google OAuth callback after user authorization.

**Response:** Redirects to frontend with token
```
https://yourapp.com/auth/callback?token={jwt}&user={userInfo}
```

---

#### 3. Link Google Account
```
POST /api/auth/google/link
Authorization: Bearer {token}
```
Initiates linking a Google account to the authenticated user.

**Response:**
```json
{
  "message": "Navigate to the provided URL to link your Google account",
  "authUrl": "https://api.cortexbuildpro.com/api/auth/google?link_account=true"
}
```

---

#### 4. Unlink Google Account
```
DELETE /api/auth/google/unlink
Authorization: Bearer {token}
```
Removes Google account linkage from user. Requires password to be set.

**Response:**
```json
{
  "message": "Google account unlinked successfully"
}
```

---

#### 5. Get OAuth Providers
```
GET /api/auth/oauth/providers
Authorization: Bearer {token}
```
Returns list of OAuth providers linked to the user.

**Response:**
```json
{
  "providers": [
    {
      "id": "uuid",
      "provider": "google",
      "email": "user@gmail.com",
      "createdAt": "2025-01-25T00:00:00.000Z"
    }
  ]
}
```

---

#### 6. Refresh OAuth Token
```
POST /api/auth/oauth/refresh
Authorization: Bearer {token}
```
Refreshes the Google OAuth access token.

**Response:**
```json
{
  "message": "Access token refreshed successfully",
  "accessToken": "ya29.xxxxx"
}
```

---

### Email Verification Endpoints

#### 1. Verify Email
```
GET /api/email/verify/:token
```
Verifies user's email address using the token sent via email.

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

#### 2. Resend Verification Email
```
POST /api/email/resend-verification
Authorization: Bearer {token}
```
Resends email verification to the authenticated user.

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

---

#### 3. Check Verification Status
```
GET /api/email/verification-status
Authorization: Bearer {token}
```
Checks if the user's email is verified.

**Response:**
```json
{
  "verified": true
}
```

---

## Frontend Integration

### React Component Example

```tsx
import React from 'react';

const GoogleLoginButton: React.FC = () => {
  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <button 
      onClick={handleGoogleLogin}
      className="btn-google-login"
    >
      <img src="/google-icon.svg" alt="Google" />
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton;
```

### OAuth Callback Handler

```tsx
// src/views/AuthCallback.tsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Parse and save user info
      const user = JSON.parse(decodeURIComponent(userStr));
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      // Handle error
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate]);

  return <div>Completing sign in...</div>;
};

export default AuthCallback;
```

### Email Verification Component

```tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    axios.get(`${import.meta.env.VITE_API_URL}/email/verify/${token}`)
      .then(response => {
        setStatus('success');
        setMessage(response.data.message);
      })
      .catch(error => {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed');
      });
  }, [searchParams]);

  return (
    <div className="verify-email-container">
      {status === 'loading' && <p>Verifying your email...</p>}
      {status === 'success' && <p className="success">{message}</p>}
      {status === 'error' && <p className="error">{message}</p>}
    </div>
  );
};

export default VerifyEmail;
```

---

## Testing

### Test Google OAuth Locally

1. Start your backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start your frontend:
   ```bash
   npm run dev
   ```

3. Navigate to: `http://localhost:5173/login`

4. Click "Sign in with Google"

5. Complete the OAuth flow

### Test Email Sending

1. Create a test user:
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!@#",
       "name": "Test User",
       "companyName": "Test Company"
     }'
   ```

2. Check your SendGrid activity to verify email was sent

3. Test email verification:
   ```bash
   curl -X POST http://localhost:3001/api/email/resend-verification \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

---

## Troubleshooting

### Google OAuth Issues

#### "redirect_uri_mismatch" Error
- Verify your redirect URI in Google Cloud Console matches exactly
- Include both `http://localhost:3001/api/auth/google/callback` (development) and production URL
- Check for trailing slashes

#### "access_denied" Error
- User declined authorization
- Check OAuth consent screen configuration
- Ensure app is not in restricted mode if user is not a test user

#### "invalid_client" Error
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure credentials are for a Web Application, not other types

### SendGrid Issues

#### Emails Not Sending
1. Check SendGrid API key is correct
2. Verify sender identity (email or domain) is authenticated
3. Check SendGrid activity logs for errors
4. Ensure `EMAIL_FROM` matches your verified sender

#### "403 Forbidden" Error
- Your API key doesn't have Mail Send permission
- Sender email is not verified

#### Emails Going to Spam
- Set up domain authentication (SPF, DKIM, DMARC)
- Use a custom sending domain
- Avoid spam trigger words
- Implement proper unsubscribe links

### Database Issues

#### OAuth table not found
```bash
# Re-initialize database
npm run init-db
```

#### Token verification fails
- Check token expiry (24 hours by default)
- Verify JWT_SECRET is consistent
- Check database connection

---

## Security Best Practices

1. **Never commit secrets**: Keep `.env` files out of version control
2. **Use HTTPS in production**: Always use secure URLs for callbacks
3. **Implement rate limiting**: Protect OAuth endpoints from abuse
4. **Validate tokens**: Always verify JWT tokens on protected routes
5. **Use environment-specific credentials**: Separate dev/staging/production credentials
6. **Rotate API keys regularly**: Change SendGrid and OAuth credentials periodically
7. **Monitor suspicious activity**: Use SendGrid activity logs and audit logs
8. **Implement CSRF protection**: Use state parameter in OAuth flow
9. **Set up email authentication**: Configure SPF, DKIM, and DMARC records
10. **Limit OAuth scopes**: Only request necessary permissions

---

## Support

For issues or questions:
- Check the [API Documentation](./API_DOCUMENTATION.md)
- Review [SendGrid Documentation](https://docs.sendgrid.com/)
- Review [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- Contact: support@cortexbuildpro.com

---

## License

Copyright © 2025 CortexBuild Pro. All rights reserved.
