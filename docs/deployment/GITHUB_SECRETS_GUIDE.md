# GitHub Actions Secrets Configuration Guide

This guide explains how to configure GitHub repository secrets for automated deployments to Hostinger and VPS.

## Overview

GitHub Actions secrets allow you to store sensitive information (API keys, credentials, etc.) securely and use them in your CI/CD workflows without exposing them in code.

## Access GitHub Secrets

1. Go to your repository: https://github.com/adrianstanca1/cortexbuildapp.com
2. Click **Settings** tab
3. Navigate to **Secrets and variables** → **Actions**
4. Click **New repository secret** to add each secret

## Required Secrets

### 1. Production (Vercel) Deployment

These secrets are needed for deploying to Vercel:

#### VERCEL_TOKEN
- **Description**: Authentication token for Vercel deployments
- **How to get**:
  1. Go to https://vercel.com/account/tokens
  2. Create a new token
  3. Copy the token value
- **Value format**: `v1_xyz...abc`

#### SUPABASE_URL
- **Description**: Your Supabase project URL
- **How to get**:
  1. Go to https://app.supabase.com/project/_/settings/api
  2. Copy the "Project URL"
- **Value format**: `https://xyz.supabase.co`

#### SUPABASE_ANON_KEY
- **Description**: Supabase anonymous/public key
- **How to get**:
  1. Go to https://app.supabase.com/project/_/settings/api
  2. Copy the "anon public" key
- **Value format**: `eyJhb...xyz`

#### SUPABASE_SERVICE_ROLE_KEY
- **Description**: Supabase service role key (admin access)
- **How to get**:
  1. Go to https://app.supabase.com/project/_/settings/api
  2. Copy the "service_role" key (⚠️ keep secret!)
- **Value format**: `eyJhb...xyz`

#### DATABASE_URL
- **Description**: PostgreSQL connection string for Supabase
- **How to get**:
  1. Go to https://app.supabase.com/project/_/settings/database
  2. Copy the connection string
  3. Replace `[YOUR-PASSWORD]` with your actual password
- **Value format**: `postgresql://postgres:[PASSWORD]@db.xyz.supabase.co:5432/postgres`

### 2. VPS Deployment

These secrets are needed for deploying to your VPS server:

#### VPS_SSH_KEY
- **Description**: SSH private key for accessing the VPS
- **How to generate**:
  ```bash
  # On your local machine
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_vps
  
  # Copy the private key (entire content including headers)
  cat ~/.ssh/github_actions_vps
  
  # Add the public key to VPS
  ssh-copy-id -i ~/.ssh/github_actions_vps.pub deploy@72.62.132.43
  ```
- **Value format**: Entire private key content including:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  ...key content...
  -----END OPENSSH PRIVATE KEY-----
  ```

### 3. API Keys & Credentials (Optional but Recommended)

Store these if you want to use them in GitHub Actions workflows:

#### GEMINI_API_KEY
- **Description**: Google Gemini AI API key
- **How to get**:
  1. Go to https://aistudio.google.com/app/apikey
  2. Create a new API key
- **Value format**: `AIzaSy...xyz`

#### SENDGRID_API_KEY
- **Description**: SendGrid email service API key
- **How to get**:
  1. Go to https://app.sendgrid.com/settings/api_keys
  2. Create a new API key with appropriate permissions
- **Value format**: `SG.xyz...abc`

#### VPS_DB_PASSWORD
- **Description**: Database password for VPS MySQL
- **Value format**: Your secure database password

#### JWT_SECRET
- **Description**: Secret for signing JWT tokens
- **How to generate**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Value format**: 64-character hexadecimal string

## Environment-Specific Secrets

You can also create environment-specific secrets:

1. Go to **Settings** → **Environments**
2. Create environments: `production`, `staging`, `vps`
3. Add environment-specific secrets

Example environments:

### Environment: `production` (Vercel)
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID
- DATABASE_URL

### Environment: `vps`
- VPS_DB_PASSWORD
- VPS_GEMINI_API_KEY
- VPS_SENDGRID_API_KEY

## Using Secrets in Workflows

Secrets are accessed in workflow files using:

```yaml
steps:
  - name: Deploy to Vercel
    env:
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    run: |
      vercel deploy --token=$VERCEL_TOKEN
```

## Security Best Practices

### ✅ DO:
- Use secrets for all sensitive data
- Rotate secrets regularly
- Use environment-specific secrets when possible
- Limit secret access to necessary workflows
- Use separate credentials for different environments
- Enable required reviewers for production deployments

### ❌ DON'T:
- Print secrets in logs (`echo ${{ secrets.SECRET }}`)
- Commit secrets to code
- Share secrets between unrelated projects
- Use the same credentials for dev/staging/production
- Store secrets in workflow files

## Verification

After adding secrets, verify they're available:

1. Go to **Actions** tab
2. Run a workflow manually
3. Check workflow logs (secrets will show as `***`)
4. Verify deployment succeeds

## Troubleshooting

### Secret not found error
- Ensure secret name matches exactly (case-sensitive)
- Check secret is added to correct environment
- Verify workflow has access to the environment

### Deployment fails with authentication error
- Verify secret value is correct (no extra spaces/newlines)
- For SSH keys, ensure entire key including headers is copied
- For tokens, check they haven't expired

### Secret not masking in logs
- GitHub automatically masks registered secrets
- If visible, the value might not match the registered secret
- Re-check the secret value

## Rotating Secrets

When compromised or expired:

1. Generate new credentials
2. Update the secret in GitHub Settings
3. Update corresponding values in:
   - Hostinger environment variables
   - VPS `.env` file
   - Any other deployment locations
4. Re-run deployments to apply changes

## Example: Complete Secret Setup

```bash
# 1. Generate SSH key for VPS
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_vps

# 2. Add public key to VPS
ssh-copy-id -i ~/.ssh/github_vps.pub deploy@72.62.132.43

# 3. Copy private key for GitHub secret
cat ~/.ssh/github_vps
# Copy entire output and save as VPS_SSH_KEY

# 4. Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Save output as JWT_SECRET

# 5. Get Vercel token
# Visit https://vercel.com/account/tokens
# Save as VERCEL_TOKEN

# 6. Get Supabase credentials
# Visit https://app.supabase.com/project/_/settings/api
# Save URL, anon key, and service role key

# 7. Add all secrets in GitHub Settings
```

## Additional Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Tokens](https://vercel.com/docs/rest-api#creating-an-access-token)
- [Supabase API Settings](https://supabase.com/docs/guides/api)
- [SSH Key Generation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
