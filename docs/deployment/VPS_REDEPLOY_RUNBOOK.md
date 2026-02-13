# VPS Docker Redeploy Runbook (www.cortexbuildpro.com)

This runbook provides a deterministic redeploy flow for the production stack on a VPS.

## 1) Pre-deploy audit

Run from repository root:

```bash
./scripts/audit-repo-state.sh
```

Optional validation:

```bash
npm run build:frontend
docker compose -f deployment/docker-compose.yml config
```

## 2) Connect to VPS

```bash
ssh <deploy-user>@<vps-host>
```

## 3) Pull latest code

```bash
cd /root/cortexbuild_pro
git fetch --all
git checkout work
git pull --ff-only
```

## 4) Configure runtime secrets

Create or update `deployment/.env` with at least:

- `POSTGRES_PASSWORD`
- `NEXTAUTH_SECRET`
- `ENCRYPTION_KEY`
- `GEMINI_API_KEY` (if Gemini features are enabled)
- Any OAuth, SMTP, or storage variables used in production.

## 5) Rebuild and restart stack

```bash
cd /root/cortexbuild_pro/deployment
docker compose down
docker compose build --no-cache app
docker compose up -d
```

## 6) Enable SSL/public endpoint

After certificates exist, use prod override:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 7) Verify health and public URL

```bash
docker compose ps
docker compose logs --tail=100 app
curl -I https://www.cortexbuildpro.com
curl -s https://www.cortexbuildpro.com/api/health
```

Expected: HTTP 200 responses and healthy containers.

## 8) Rollback (if required)

```bash
docker compose down
docker image ls | head
docker compose up -d
```

If you use tagged images (`cortexbuild-app:<timestamp>`), pin the previous tag in compose and redeploy.
