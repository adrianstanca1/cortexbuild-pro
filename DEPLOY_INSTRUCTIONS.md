# 🚀 Quick Deploy to VPS

**Status:** ✅ READY TO DEPLOY  
**All Changes:** ✅ COMMITTED AND PUSHED

---

## One-Command VPS Deployment

SSH into your VPS and run:

\`\`\`bash
ssh root@72.62.132.43
# Password: Cumparavinde1@

# Then execute:
curl -fsSL https://raw.githubusercontent.com/adrianstanca1/cortexbuild-pro/copilot/merge-and-commit-recent-changes/deployment/deploy-from-github.sh | bash
\`\`\`

**Time:** 5-10 minutes  
**Result:** Application deployed (configure SSL before first use)

---

## ⚠️ IMPORTANT: SSL/HTTPS Setup Required

**BEFORE creating any accounts or logging in**, you MUST configure SSL/HTTPS to protect credentials and session data.

### Set Up SSL First (Required for Production)

1. Point your domain A record to: **72.62.132.43**
2. Wait for DNS propagation (15 minutes to 24 hours)
3. Run SSL setup:

\`\`\`bash
ssh root@72.62.132.43
cd /var/www/cortexbuild-pro/deployment
./setup-ssl.sh yourdomain.com admin@yourdomain.com

# Update environment for HTTPS
nano .env
# Change:
# NEXTAUTH_URL=https://yourdomain.com
# NEXT_PUBLIC_WEBSOCKET_URL=https://yourdomain.com

# Restart services
docker-compose restart
\`\`\`

4. **Now access via HTTPS:** https://yourdomain.com

---

## After SSL Configuration

1. **Access:** https://yourdomain.com (HTTPS required for production)
2. **Sign Up:** Create your admin account
3. **Save Credentials:** \`cat /var/www/cortexbuild-pro/DEPLOYMENT_CREDENTIALS.txt\`
4. **Delete Credentials File:** \`rm /var/www/cortexbuild-pro/DEPLOYMENT_CREDENTIALS.txt\`

### Testing Only (Not for Production)

If testing locally without a domain, you can temporarily access http://72.62.132.43:3000, but **DO NOT use this for production or with real credentials**. HTTP exposes all data to network attackers.

---

## Management Commands

\`\`\`bash
cd /var/www/cortexbuild-pro/deployment

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Status
docker-compose ps
\`\`\`

---

## Documentation

- **BUILD_COMPLETION_SUMMARY.md** - What was accomplished
- **DEPLOYMENT_FINAL.md** - Comprehensive deployment guide
- **START_HERE.md** - Quick start guide
- **BUILD_STATUS.md** - Build information
- **README.md** - Full documentation

---

**Ready to Deploy!** 🎉
