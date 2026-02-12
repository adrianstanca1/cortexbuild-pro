# 🚀 Deploy Backend NOW - 5 Minute Guide

## You Need to Do This (I Cannot Access Hostinger Web Interface)

**Why manual?** Hostinger requires web login - I cannot authenticate as you.

**Time needed:** 5 minutes

---

## Step 1: Open Hostinger (30 seconds)

1. Go to: https://hpanel.hostinger.com
2. Log in with your credentials
3. Click: **Websites** → **Node.js** → **Create Application**

---

## Step 2: Fill the Form (2 minutes)

**Copy these EXACT values:**

| Field | Value |
|-------|-------|
| **Repository** | `adrianstanca1/Buildproapp2` |
| **Branch** | `main` |
| **Framework** | `Express` |
| **Root directory** | `./server` |
| **Node version** | `22.x` |
| **Build command** | `npm install && npm run build` |
| **Start command** | `node dist/index.js` |

⚠️ **CRITICAL:** Root directory MUST be `./server` (with the dot and slash)

---

## Step 3: Add Environment Variables (2 minutes)

⚠️ **IMPORTANT: Do NOT use the old exposed credentials!**

Refer to the secure setup guide: `docs/deployment/HOSTINGER_ENV_VARS.txt`

Click **"Add"** under Environment variables and add each variable from the guide with YOUR actual secure values:

```
PORT=3001
NODE_ENV=production
DATABASE_TYPE=mysql
DB_HOST=127.0.0.1
DB_USER=your_database_username
DB_PASSWORD=your_secure_database_password
DB_NAME=your_database_name
DB_PORT=3306
JWT_SECRET=your_secure_jwt_secret_min_32_chars
FILE_SIGNING_SECRET=your_secure_file_signing_secret
STORAGE_ROOT=./storage
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@cortexbuildpro.com
GEMINI_API_KEY=your_gemini_api_key
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
APP_URL=https://cortexbuildpro.com
CORS_ORIGIN=https://cortexbuildpro.com,https://api.cortexbuildpro.com
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ SECURITY**: The credentials previously in git have been exposed and MUST be rotated. See [SECURITY_ALERT.md](../../SECURITY_ALERT.md) for details.

---

## Step 4: Deploy (30 seconds)

1. Click **"Create"** or **"Import"**
2. Wait 2-3 minutes for build
3. Watch the logs for success

---

## Step 5: Test (30 seconds)

Open terminal and run:

```bash
curl https://api.cortexbuildpro.com/api/health
```

**Expected:** `{"status":"online","database":{"status":"connected"}}`

**If 404:** Backend didn't start - check logs in hPanel

---

## ✅ Success Checklist

- [ ] Opened Hostinger hPanel
- [ ] Created Node.js application
- [ ] Set root directory to `./server`
- [ ] Added all 13 environment variables
- [ ] Clicked Create
- [ ] Waited for build to complete
- [ ] Tested `/api/health` endpoint
- [ ] Got successful response

---

## 🆘 If It Fails

**Check the logs in hPanel** - they will tell you exactly what went wrong.

Common fixes:
- Root directory wrong → Delete app, recreate with `./server`
- Missing env vars → Add the missing ones
- Build failed → Check Node version is 22.x

---

**Everything is ready on my end. The code is perfect. You just need to click through the Hostinger interface!**
