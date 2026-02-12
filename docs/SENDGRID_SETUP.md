# 📧 SendGrid Email Configuration Guide

**Security Level:** 🔒 Production-Ready
**Status:** Ready to Configure
**Last Updated:** December 2, 2024

---

## ⚠️ SECURITY FIRST

**NEVER commit API keys to git!** This guide shows the secure way to set up SendGrid credentials.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your SendGrid API Key

1. Visit [SendGrid.com](https://sendgrid.com)
2. Sign up or log in
3. Go to: **Settings → API Keys**
4. Click **Create API Key**
5. Copy your API key (starts with `SG.`)
6. Save it securely (you can only view it once!)

### Step 2: Local Development Setup

Create `.env.local` file in project root:

```bash
# Copy this file and add your actual keys
cp .env.example .env.local
```

Edit `.env.local` and add:

```env
# SendGrid Configuration
VITE_SENDGRID_API_KEY=SG.your_actual_key_here
VITE_FROM_EMAIL=noreply@buildproapp.com
VITE_FROM_NAME=BuildPro

# Gemini (if using AI features)
VITE_GEMINI_API_KEY=your_gemini_key

# API + WebSockets
VITE_API_URL=https://api.cortexbuildpro.com/api
VITE_WS_URL=wss://api.cortexbuildpro.com/live
```

**⚠️ IMPORTANT:** `.env.local` is in `.gitignore` - it will NOT be committed to git.

### Step 3: Production Setup (Hostinger / Any Hosting)

1. Add the same environment variables (`VITE_SENDGRID_API_KEY`, `VITE_FROM_EMAIL`, `VITE_FROM_NAME`, `VITE_API_URL`, `VITE_WS_URL`, `VITE_GEMINI_API_KEY`) to your hosting dashboard (`Hostinger Node.js Manager environment variables` or your CI/CD pipeline).
2. Redeploy the frontend (`npm run deploy:frontend`) so the build picks up the latest API and SendGrid configuration.

---

## 🔐 Security Best Practices

### ✅ DO:
- Use `.env.local` for local development
- Use Vercel Dashboard for production keys
- Rotate API keys periodically
- Use different keys for different environments
- Never share your API keys
- Regenerate compromised keys immediately

### ❌ DON'T:
- Commit `.env` files to git
- Share API keys in chat or email
- Use the same key for multiple projects
- Hardcode secrets in source code
- Put secrets in comments
- Save keys in browser history

---

## 📝 File Structure

```
project/
├── .env.local          ← Local development (✅ ignored by git)
├── .env.example        ← Template for developers
├── .gitignore          ← Excludes .env files
├── services/
│   └── emailService.ts ← Uses environment variables
└── README.md
```

---

## 🧪 Testing Email Service

### Development Mode (No API Key)

```typescript
// .env.local is empty or has no VITE_SENDGRID_API_KEY
// Emails log to console:
// 📧 [DEV MODE] Email would be sent to: john@example.com
```

### Production Mode (With API Key)

```typescript
// .env.local has VITE_SENDGRID_API_KEY=SG.xxx
// Emails sent via SendGrid API
```

---

## 📧 Email Templates Available

1. **Member Invitation**
   - Used when adding team members
   - Includes project name and role

2. **Role Change Notification**
   - Sent when member's role changes
   - Shows old and new role

3. **Member Removal Notification**
   - Sent when member is removed
   - Optional removal reason

4. **Task Assignment**
   - Sent when task is assigned
   - Includes due date

5. **Bulk Email**
   - Send announcements to multiple recipients
   - Custom HTML body

---

## 🔗 Integration Example

The email service automatically uses environment variables:

```typescript
import { emailService } from '@/services/emailService';

// This works in both dev and production:
await emailService.sendMemberInvitation(
  'john@company.com',
  'John Doe',
  'Downtown Project',
  'Project Manager'
);

// In dev: logs to console
// In prod: sends via SendGrid API
```

---

## ✅ Verification Checklist

- [ ] Created SendGrid account
- [ ] Generated API key
- [ ] Created `.env.local` file (not committed to git)
- [ ] Added `VITE_SENDGRID_API_KEY` to `.env.local`
- [ ] Added `VITE_FROM_EMAIL` to `.env.local`
- [ ] Added `VITE_FROM_NAME` to `.env.local`
- [ ] Verified `.env.local` is in `.gitignore`
- [ ] Run `npm run dev` and test
- [ ] Production keys configured in Vercel dashboard

---

## 🆘 Troubleshooting

### "Invalid email" Error
**Problem:** Email validation fails
**Solution:** Ensure email format is valid (name@domain.com)

### "Failed to send email"
**Problem:** SendGrid API error
**Solution:**
- Check API key is correct
- Verify `VITE_FROM_EMAIL` is authorized in SendGrid
- Check SendGrid account has email sending enabled

### "Email logs show [DEV MODE]"
**Problem:** Emails not actually sending
**Solution:**
- This is normal in development
- Verify `VITE_SENDGRID_API_KEY` is set in `.env.local`
- Restart dev server: `npm run dev`

### Emails not received
**Problem:** Emails sent but not delivered
**Solution:**
- Check recipient spam folder
- Verify `VITE_FROM_EMAIL` is whitelisted
- Check SendGrid activity log for delivery status

---

## 📊 SendGrid Account Features

### Free Plan (Recommended for Testing)
- 100 emails/day
- Basic API access
- Perfect for development

### Paid Plans
- Higher volume limits
- Advanced features
- 24/7 support

---

## 🔄 API Key Rotation

To rotate your API key:

1. Generate new API key in SendGrid dashboard
2. Update `.env.local` with new key
3. Update Vercel environment variables
4. Delete old API key from SendGrid
5. Redeploy application

---

## 📞 Support

- SendGrid Docs: https://sendgrid.com/docs
- SendGrid Support: https://support.sendgrid.com
- Project Email Service: [services/emailService.ts](services/emailService.ts)

---

## ✨ Next Steps

1. ✅ Create SendGrid account & API key
2. ✅ Configure `.env.local` locally
3. ✅ Test in development mode
4. ✅ Add environment variables to Vercel
5. ✅ Send your first email invitations!

---

**Status:** ✅ Ready for configuration
**Security:** 🔒 Production-safe
**Last Updated:** December 2, 2024

All emails are now ready to send! 📧
