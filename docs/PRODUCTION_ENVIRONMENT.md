# 🚀 **CORTEXBUILD PRO - PRODUCTION ENVIRONMENT CONFIGURATION**

This document outlines all required environment variables for production deployment on Hostinger.

---

## 📋 **Required Environment Variables**

### **Core Application Variables**

```bash
# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters

# File Signing for Uploads
FILE_SIGNING_SECRET=your_file_signing_secret_key_here_minimum_32_characters

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here

# AI Service (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here

# File Storage Root
STORAGE_ROOT=/path/to/uploads
```

### **Database Configuration**

```bash
# Database Type (mysql for production)
DATABASE_TYPE=mysql

# MySQL Database Connection (Hostinger)
DB_HOST=127.0.0.1
DB_USER=u875310796_admin
DB_PASSWORD=your_mysql_password
DB_NAME=u875310796_cortexbuildpro

# Optional: External Database URL (if not using individual DB vars)
# DATABASE_URL=mysql://u875310796_admin:password@127.0.0.1:3306/u875310796_cortexbuildpro
```

### **Application Configuration**

```bash
# Application Environment
NODE_ENV=production

# Server Configuration
PORT=3001

# API Configuration
API_URL=https://cortexbuildpro.com/api
WS_URL=wss://cortexbuildpro.com

# Frontend Build Configuration
VITE_API_URL=https://cortexbuildpro.com/api
VITE_WS_URL=wss://cortexbuildpro.com
```

---

## 🔧 **Hostinger Specific Configuration**

### **SFTP Deployment Variables**

```bash
# Hostinger SFTP Configuration
SFTP_HOST=194.11.154.108
SFTP_USER=u875310796
SFTP_PASSWORD=your_hostinger_sftp_password

# Optional: Custom upload path
SFTP_PATH=/htdocs
```

### **SSL/TLS Configuration**

```bash
# SSL Configuration (auto-configured by Hostinger)
SSL_CERT_PATH=/path/to/certificate.pem
SSL_KEY_PATH=/path/to/private.key
```

---

## 📊 **Optional Performance & Monitoring Variables**

```bash
# Redis Configuration (for session storage & caching)
REDIS_URL=redis://username:password@redis-server:6379
REDIS_HOST=redis-server
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Database Connection Pooling
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=30000

# Application Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# Rate Limiting
RATE_LIMIT_WINDOW_MS=90000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🌐 **External Service Configuration**

### **Google Gemini AI**

```bash
# Gemini API Configuration
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2048
GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com

# AI Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_AI_CHAT=true
ENABLE_AI_ANALYSIS=true
ENABLE_LIVE_AI=true
```

### **SendGrid Email Service**

```bash
# Email Configuration
SENDGRID_FROM_EMAIL=noreply@cortexbuildpro.com
SENDGRID_FROM_NAME=CortexBuild Pro
SENDGRID_REPLY_TO=support@cortexbuildpro.com

# Email Templates
EMAIL_TEMPLATES_ENABLED=true
EMAIL_WELCOME_ENABLED=true
EMAIL_PASSWORD_RESET_ENABLED=true
EMAIL_INVITATION_ENABLED=true
```

---

## 📈 **Security Configuration**

```bash
# Security Headers
ENABLE_CSP=true
ENABLE_HSTS=true
ENABLE_RATE_LIMITING=true

# Session Security
SESSION_TIMEOUT_MS=86400000
SESSION_IP_LOCK=true
SESSION_SECURE_COOKIES=true

# API Security
API_KEY_ROTATION_ENABLED=true
ENABLE_API_VERSIONING=true
ENABLE_REQUEST_LOGGING=true
```

---

## 🔍 **Development vs Production Variables**

### **Development Environment (.env.local)**

```bash
# Development overrides
NODE_ENV=development
ENABLE_DEMO_AUTH=false
DEBUG_MODE=true
LOG_LEVEL=debug
```

### **Production Environment (.env)**

```bash
# Production settings
NODE_ENV=production
DEBUG_MODE=false
LOG_LEVEL=info
ENABLE_DEMO_AUTH=false
```

---

## 🚀 **Deployment Checklist**

Before deploying to production, ensure:

### **✅ Security Checklist**

- [ ] JWT_SECRET is at least 32 characters long
- [ ] FILE_SIGNING_SECRET is at least 32 characters long
- [ ] All API keys are valid and active
- [ ] HTTPS is properly configured
- [ ] Security headers are enabled
- [ ] Rate limiting is configured

### **✅ Database Checklist**

- [ ] Database connection details are correct
- [ ] Database user has required privileges
- [ ] Connection pooling is configured
- [ ] SSL is enabled for database connections

### **✅ Application Checklist**

- [ ] All required environment variables are set
- [ ] Frontend API URLs match backend URLs
- [ ] File upload paths are writable
- [ ] Email service configuration is tested

### **✅ External Services Checklist**

- [ ] Gemini API key is valid and has quota
- [ ] SendGrid API key is valid and verified
- [ ] Webhook URLs are accessible from external services

---

## 🔧 **Setup Instructions**

### **1. Environment File Creation**

Create your production environment file:

```bash
# On Hostinger server
cd /home/u875310796
nano .env

# Or create locally and upload
cp .env.example .env.production
```

### **2. Variable Population**

Add all required variables from the sections above:

```bash
# Example for Hostinger
export NODE_ENV="production"
export JWT_SECRET="your_generated_jwt_secret_here"
export DATABASE_TYPE="mysql"
export DB_HOST="127.0.0.1"
export DB_USER="u875310796_admin"
export DB_PASSWORD="your_secure_password"
export DB_NAME="u875310796_cortexbuildpro"
export GEMINI_API_KEY="your_gemini_api_key"
export SENDGRID_API_KEY="SG.your_sendgrid_key"
export STORAGE_ROOT="/home/u875310796/uploads"
```

### **3. Validation**

Test your configuration:

```bash
# Test database connection
mysql -h 127.0.0.1 -u u875310796_admin -p

# Test environment variables
env | grep -E "(JWT_SECRET|GEMINI_API_KEY|SENDGRID_API_KEY)"

# Test API endpoints
curl -I https://cortexbuildpro.com/api/health
```

---

## 📞 **Troubleshooting**

### **Common Issues**

1. **Database Connection Errors**

    ```bash
    # Check MySQL service status
    systemctl status mysql

    # Check connection
    mysql -h 127.0.0.1 -u u875310796_admin -p -e "SELECT 1"
    ```

2. **Permission Errors**

    ```bash
    # Check file permissions
    ls -la /home/u875310796/uploads

    # Fix permissions
    chmod 755 /home/u875310796/uploads
    ```

3. **API Key Issues**

    ```bash
    # Verify Gemini API key
    curl -H "Authorization: Bearer YOUR_GEMINI_API_KEY" \
         -H "Content-Type: application/json" \
         -d '{"contents":"test"}' \
         https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
    ```

4. **SSL Certificate Issues**
    ```bash
    # Check certificate validity
    openssl x509 -in /path/to/certificate.pem -text -noout
    ```

---

## 📞 **Support**

For issues with production deployment:

1. Check application logs: `tail -f /var/log/cortexbuild/app.log`
2. Verify environment: `env | grep -E "(NODE_ENV|JWT_SECRET)"`
3. Test database: `mysql -h $DB_HOST -u $DB_USER -p -e "SELECT 1"`
4. Check deployment status: `curl -I https://cortexbuildpro.com/health`

---

**🎯 All major security and production readiness improvements have been implemented! The platform is now production-grade with proper session management, quota enforcement, database optimization, and comprehensive environment configuration.**
