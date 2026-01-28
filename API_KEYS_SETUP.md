# API Keys Setup Guide - CortexBuild Pro

This guide provides step-by-step instructions for obtaining and configuring all API keys required for CortexBuild Pro.

## Overview

CortexBuild Pro supports three main API integrations:

1. **SendGrid API** - Email notifications and transactional emails
2. **Abacus AI API** - AI-powered features and document analysis
3. **Google Gemini API** - Alternative AI provider for document analysis

## Where to Add Your API Keys

### Development Environment

Add your API keys to: `nextjs_space/.env`

```bash
cd cortexbuild-pro/nextjs_space
cp .env.example .env
nano .env
```

### Production/Deployment Environment

Add your API keys to: `deployment/.env`

```bash
cd cortexbuild-pro/deployment
cp .env.example .env
nano .env
```

---

## 1. SendGrid API (Email Service)

### Purpose
Send transactional emails including:
- User invitations
- Password reset emails
- Project notifications
- Alert notifications

### How to Get Your API Key

1. **Create a SendGrid Account**
   - Go to [https://sendgrid.com/](https://sendgrid.com/)
   - Click "Start for Free"
   - Complete the signup process
   - Free tier includes: 100 emails/day forever

2. **Verify Your Sender Identity**
   - Navigate to: Settings → Sender Authentication
   - Choose "Single Sender Verification" for testing
   - Or "Domain Authentication" for production
   - Complete the verification process

3. **Create an API Key**
   - Navigate to: Settings → API Keys
   - Click "Create API Key"
   - Name: `CortexBuild Production`
   - Permission Level: Select "Restricted Access"
   - Enable: "Mail Send" permission
   - Click "Create & View"
   - **IMPORTANT**: Copy the API key immediately (shown only once!)

4. **Add to Your .env File**
   ```env
   SENDGRID_API_KEY=SG.your_actual_api_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=CortexBuild Pro
   ```

### Testing
- Log into your application
- Create a user invitation
- Check your email inbox
- Verify the email was delivered

---

## 2. Abacus AI API (Primary AI Provider)

### Purpose
Powers AI features including:
- AI Assistant chatbot
- Document analysis and extraction
- Intelligent suggestions
- Project risk analysis
- Email fallback (if SendGrid not configured)

### How to Get Your API Key

1. **Create an Abacus AI Account**
   - Go to [https://abacus.ai/](https://abacus.ai/)
   - Click "Sign Up"
   - Complete the registration process
   - Verify your email

2. **Get Your API Key**
   - Log in to your Abacus AI dashboard
   - Navigate to: Settings → API Keys
   - Click "Create API Key"
   - Name: `CortexBuild`
   - Click "Create"
   - Copy the API key

3. **Optional: Create a Web App**
   - Navigate to: Applications
   - Click "Create Application"
   - Note the Web App ID (optional feature)

4. **Add to Your .env File**
   ```env
   ABACUSAI_API_KEY=your_actual_abacus_api_key
   WEB_APP_ID=your_web_app_id (optional)
   ```

### Testing
- Log into your application
- Navigate to any project
- Click on "AI Assistant" 
- Ask a question about your project
- Verify you receive an AI response

---

## 3. Google Gemini API (Alternative AI Provider)

### Purpose
Alternative AI provider for:
- AI Assistant chatbot
- Document analysis
- Intelligent suggestions
- Image analysis

**Note**: Gemini supports vision capabilities (analyzing images and PDFs) out of the box.

### How to Get Your API Key

1. **Create/Sign in to Google Account**
   - You need a Google account to use Gemini API

2. **Get Your API Key**
   - Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Or visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Click "Create API Key"
   - Select an existing Google Cloud project or create a new one
   - Click "Create API Key in existing project" or "Create API Key in new project"
   - Copy the API key

3. **Free Tier Limits**
   - 60 requests per minute
   - 1,500 requests per day (gemini-1.5-flash)
   - 50 requests per day (gemini-1.5-pro)

4. **Add to Your .env File**
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   AI_PROVIDER=gemini
   ```

### Choosing Between Abacus AI and Gemini

You can configure **both** providers and switch between them:

```env
# Configure both
ABACUSAI_API_KEY=your_abacus_key
GEMINI_API_KEY=your_gemini_key

# Choose which one to use (default: abacus)
AI_PROVIDER=gemini  # or AI_PROVIDER=abacus
```

**When to use Gemini:**
- You want better vision capabilities (image/PDF analysis)
- You prefer Google's ecosystem
- You want to use the free tier
- You need fast responses (gemini-1.5-flash)

**When to use Abacus AI:**
- You need more requests per day
- You're already using Abacus for other features
- You need email fallback functionality

### Testing Gemini Integration
1. Set `AI_PROVIDER=gemini` in your .env
2. Restart your application
3. Navigate to AI Assistant
4. Ask a question
5. Check the response header `X-AI-Provider` should be "gemini"

---

## Configuration Checklist

Use this checklist to ensure all API keys are properly configured:

### Development (.env)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Generated with `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - Set to `http://localhost:3000`
- [ ] `AWS_BUCKET_NAME` - Your S3 bucket name
- [ ] `AWS_REGION` - Your S3 region
- [ ] `ABACUSAI_API_KEY` - Your Abacus AI API key
- [ ] `GEMINI_API_KEY` - Your Google Gemini API key (optional)
- [ ] `AI_PROVIDER` - Set to `abacus` or `gemini` (optional)
- [ ] `SENDGRID_API_KEY` - Your SendGrid API key (optional)
- [ ] `SENDGRID_FROM_EMAIL` - Your verified sender email (optional)

### Production (deployment/.env)
- [ ] All of the above
- [ ] `NEXTAUTH_URL` - Set to your production domain
- [ ] `NEXT_PUBLIC_WEBSOCKET_URL` - Set to your production domain
- [ ] `DOMAIN` - Your production domain
- [ ] `SSL_EMAIL` - Email for SSL certificate notifications

---

## Security Best Practices

### Protect Your API Keys

1. **Never commit .env files to Git**
   ```bash
   # Already in .gitignore, but verify:
   cat .gitignore | grep .env
   ```

2. **Use different keys for development and production**
   - Development: Use test/sandbox API keys
   - Production: Use live API keys with IP restrictions

3. **Rotate keys regularly**
   - Change API keys every 90 days
   - Use restricted access keys when possible
   - Monitor API usage for anomalies

4. **Set proper file permissions**
   ```bash
   chmod 600 .env
   chmod 600 deployment/.env
   ```

### GitHub Secrets (for CI/CD)

If using GitHub Actions, also add secrets to your repository:

1. Go to: Repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `SENDGRID_API_KEY`
   - `ABACUSAI_API_KEY`
   - `GEMINI_API_KEY`
   - Other environment variables

---

## Troubleshooting

### SendGrid Issues

**Problem**: Emails not being delivered

**Solutions**:
1. Verify your sender email in SendGrid dashboard
2. Check spam folder
3. Verify API key has "Mail Send" permission
4. Check SendGrid dashboard for delivery logs
5. Ensure `SENDGRID_FROM_EMAIL` matches verified sender

### Abacus AI Issues

**Problem**: AI features not working

**Solutions**:
1. Verify API key is correct
2. Check you have API credits available
3. Review Abacus AI dashboard for usage limits
4. Check console for error messages
5. Verify `ABACUSAI_API_KEY` is set correctly

### Gemini API Issues

**Problem**: Gemini responses not working

**Solutions**:
1. Verify API key is correct (starts with "AIza")
2. Check you haven't exceeded free tier limits
3. Ensure `AI_PROVIDER=gemini` is set
4. Verify the API is enabled in Google Cloud Console
5. Check browser console for error messages

### General Issues

**Problem**: Environment variables not loading

**Solutions**:
1. Restart the development server
2. Verify .env file exists in correct location
3. Check for syntax errors in .env file
4. For Docker: `docker-compose down && docker-compose up -d`
5. No quotes needed for most values (exception: values with spaces)

---

## Verification

### Test All APIs

Run the system diagnostics to verify all APIs are configured:

```bash
cd nextjs_space
npx tsx scripts/system-diagnostics.ts
```

This will check:
- ✅ Database connection
- ✅ AWS S3 access
- ✅ Abacus AI API status
- ✅ Gemini API status
- ✅ SendGrid configuration

### Manual Testing

1. **SendGrid Email**
   - Create a test user invitation
   - Verify email delivery

2. **AI Features**
   - Open AI Assistant
   - Ask a test question
   - Verify response is generated

3. **Document Analysis**
   - Upload a PDF to any project
   - Click "Analyze with AI"
   - Verify analysis is generated

---

## Cost Considerations

### Free Tier Limits

- **SendGrid**: 100 emails/day forever
- **Abacus AI**: Varies by account type (check dashboard)
- **Gemini**: 60 requests/minute, 1,500/day (flash model)

### Paid Plans

If you need more capacity:

- **SendGrid**: Starting at $19.95/month (40,000 emails)
- **Abacus AI**: Custom pricing based on usage
- **Gemini**: Pay-as-you-go after free tier

---

## Additional Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Abacus AI Documentation](https://abacus.ai/docs/)
- [Google Gemini Documentation](https://ai.google.dev/docs)
- [Environment Setup Guide](ENVIRONMENT_SETUP_GUIDE.md)
- [API Setup Guide](API_SETUP_GUIDE.md)

---

## Support

For additional help:
- Check the main [README.md](README.md)
- Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Open an issue on GitHub
- Contact the development team

---

**Last Updated**: January 2026
