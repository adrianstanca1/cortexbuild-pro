# Quick Reference: API Keys Configuration

**Quick access guide for configuring SendGrid, Gemini, and Abacus AI API keys**

## 📍 Where to Add API Keys

### Development
```bash
File: nextjs_space/.env
```

### Production
```bash
File: deployment/.env
```

## 🔑 API Keys Summary

### 1️⃣ SendGrid (Email Service)
```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=CortexBuild Pro
```
**Get Key**: https://app.sendgrid.com/settings/api_keys  
**Free Tier**: 100 emails/day  
**Used For**: User invitations, password resets, notifications

### 2️⃣ Abacus AI (Primary AI)
```env
ABACUSAI_API_KEY=your_abacus_api_key
WEB_APP_ID=your_web_app_id  # optional
AI_PROVIDER=abacus  # optional, default
```
**Get Key**: https://abacus.ai/ → Settings → API Keys  
**Used For**: AI assistant, document analysis, email fallback

### 3️⃣ Google Gemini (Alternative AI)
```env
GEMINI_API_KEY=your_gemini_api_key
AI_PROVIDER=gemini  # to use Gemini instead of Abacus
```
**Get Key**: https://makersuite.google.com/app/apikey  
**Free Tier**: 60 req/min, 1,500 req/day  
**Used For**: AI assistant, document analysis, image analysis

## ⚡ Quick Setup Commands

### Step 1: Create .env files
```bash
# Development
cd cortexbuild-pro/nextjs_space
cp .env.example .env

# Production
cd ../deployment
cp .env.example .env
```

### Step 2: Edit .env files
```bash
# Development
nano nextjs_space/.env

# Production
nano deployment/.env
```

### Step 3: Add your API keys
Replace the placeholder values with your actual API keys.

### Step 4: Restart application
```bash
# Development
npm run dev

# Production (Docker)
docker-compose restart
```

## 🎯 AI Provider Selection

### Use Both Providers (Recommended)
```env
# Configure both for automatic fallback
ABACUSAI_API_KEY=your_abacus_key
GEMINI_API_KEY=your_gemini_key
AI_PROVIDER=gemini  # Primary: Gemini, Fallback: Abacus
```

### Use Only Abacus
```env
ABACUSAI_API_KEY=your_abacus_key
AI_PROVIDER=abacus  # or omit this line
```

### Use Only Gemini
```env
GEMINI_API_KEY=your_gemini_key
AI_PROVIDER=gemini
```

## ✅ Configuration Checklist

Essential configuration for CortexBuild Pro:

- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `NEXTAUTH_SECRET` - Auth secret (run: `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` - Your domain or http://localhost:3000
- [ ] `AWS_BUCKET_NAME` - S3 bucket for file storage
- [ ] `AWS_REGION` - S3 region (e.g., us-east-1)
- [ ] `ABACUSAI_API_KEY` - Abacus AI API key
- [ ] `GEMINI_API_KEY` - Google Gemini API key (optional)
- [ ] `SENDGRID_API_KEY` - SendGrid API key (optional)

## 🔒 Security Notes

1. **Never commit .env files to Git** - Already in .gitignore ✅
2. **Use different keys for dev/prod** - Test keys in dev, live keys in prod
3. **Set file permissions**: `chmod 600 .env`
4. **Rotate keys every 90 days**

## 🧪 Testing

### Verify Configuration
```bash
cd nextjs_space
npx tsx scripts/system-diagnostics.ts
```

### Test SendGrid
- Create a user invitation
- Check email delivery

### Test AI (Abacus/Gemini)
- Open AI Assistant in any project
- Ask a question
- Verify response is generated
- Check response header `X-AI-Provider` to see which provider was used

## 📚 Detailed Documentation

- **Complete Setup Guide**: [API_KEYS_SETUP.md](API_KEYS_SETUP.md)
- **API Configuration**: [API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)
- **Environment Setup**: [ENVIRONMENT_SETUP_GUIDE.md](ENVIRONMENT_SETUP_GUIDE.md)

## 🆘 Troubleshooting

### SendGrid not working
- Verify sender email in SendGrid dashboard
- Check API key has "Mail Send" permission
- Look in spam folder

### AI not responding
- Check API key is valid
- Verify `AI_PROVIDER` matches configured service
- Check browser console for errors
- Verify free tier limits not exceeded

### Environment variables not loading
- Restart the server: `npm run dev` or `docker-compose restart`
- Check .env file exists in correct location
- Verify no syntax errors in .env file

## 📞 Support

Need help? Check these resources:
- [README.md](README.md) - Main documentation
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- Open an issue on GitHub
- Contact the development team

---

**Last Updated**: January 2026
