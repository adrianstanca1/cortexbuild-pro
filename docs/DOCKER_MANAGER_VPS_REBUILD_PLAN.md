# CortexBuild Pro: Rebuild, Deploy, and Setup Plan (Docker Manager + VPS)

## Scope and Goals
- Rebuild application images in a reproducible way.
- Deploy safely to a VPS managed by Docker Compose or Portainer (Docker Manager).
- Validate production health and rollback quickly when needed.
- Align GitHub Actions (`deploy-vps.yml`, `docker-publish.yml`) with operational runbooks.

## Current-State Review (What was checked)
1. Workflow files parse as valid YAML.
2. `deploy-vps.yml` includes build/deploy/health-check flow with secret validation.
3. `deployment/scripts/verify-build.sh` now degrades gracefully when Docker is unavailable.
4. Deployment docs referenced missing templates; this plan adds them:
   - `deployment/portainer-stack-env.txt`
   - `deployment/windmill-deploy-flow.yaml`

## Phase 1: Preflight (One-Time VPS Setup)
1. Provision VPS (Ubuntu/Debian), DNS, and firewall (22/80/443; 9000/9443 only if Portainer exposed).
2. Install Docker + Compose plugin:
   - `bash deployment/vps-setup.sh`
3. Clone repo and set path:
   - `/var/www/cortexbuild-pro`
4. Create deployment env:
   - `cp deployment/.env.example deployment/.env`
   - Fill secrets (`POSTGRES_PASSWORD`, `NEXTAUTH_SECRET`, `DATABASE_URL`, domains).
5. Install project dependencies:
   - `bash scripts/setup-dependencies.sh`
6. Validate build prerequisites:
   - `bash deployment/scripts/verify-build.sh`

## Phase 2: Build Strategy
### Option A (Preferred): CI-built images from GHCR
1. Push to `main`.
2. Let `.github/workflows/docker-publish.yml` build/push signed image.
3. On VPS, pull latest image via compose.

### Option B: Local VPS rebuild
1. `cd /var/www/cortexbuild-pro/deployment`
2. `docker compose build --no-cache app`
3. Tag and keep previous image as rollback checkpoint.

## Phase 3: Deployment Paths
### Path 1: Docker Compose (CLI)
1. `cd /var/www/cortexbuild-pro/deployment`
2. `docker compose pull app || true`
3. `docker compose up -d postgres app`
4. `docker compose exec -T app npx prisma migrate deploy`
5. Health check:
   - `curl -f http://localhost:3000/api/health`

### Path 2: Docker Manager (Portainer)
1. Open Portainer → Stacks → Add stack.
2. Use `deployment/docker-compose.yml` (or `docker-stack.yml` for Swarm).
3. Load env vars from `deployment/portainer-stack-env.txt`.
4. Deploy stack, then run migrations from container console.
5. Verify logs and health endpoint.

### Path 3: GitHub Actions VPS deployment
1. Configure secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, optional `VPS_PORT`.
2. Configure vars: `DEPLOYMENT_PATH`, `DEPLOYMENT_URL`.
3. Trigger `.github/workflows/deploy-vps.yml` (manual or push).
4. Confirm steps: SSH setup → pull/rebase → compose restart → health check → migration.

## Phase 4: Post-Deploy Validation Checklist
- `docker compose ps` shows healthy app + postgres.
- `curl -f http://localhost:3000/api/health` returns `200`.
- App login/API smoke tests pass.
- No critical errors in `docker compose logs --tail=200 app`.
- If first deployment: run seed only once (`npx prisma db seed`).

## Phase 5: Rollback and Recovery
1. Fast rollback:
   - `cd deployment && docker compose down && docker compose up -d`
   - or pin previous image tag in compose and redeploy.
2. DB rollback:
   - restore from latest backup (`deployment/enterprise-restore.sh`).
3. Incident handling:
   - capture logs + failing commit SHA + recent migration state.

## Suggested Operational Cadence
- Daily: health endpoint + error log scan.
- Weekly: dependency/security audit and backup restore drill.
- Per release: run `integration-check.yml` and staged deploy before production.

## Command Pack (copy/paste)
```bash
# Preflight
bash scripts/setup-dependencies.sh
bash deployment/scripts/verify-build.sh

# Deploy (compose)
cd deployment
docker compose pull app || true
docker compose up -d postgres app
docker compose exec -T app npx prisma migrate deploy
curl -f http://localhost:3000/api/health

# Observability
docker compose ps
docker compose logs --tail=200 app
```
