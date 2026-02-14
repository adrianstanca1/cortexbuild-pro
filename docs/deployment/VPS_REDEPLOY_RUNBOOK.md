# VPS Docker Redeploy Runbook (www.cortexbuildpro.com)

Use this runbook to audit, rebuild, and redeploy the production Docker stack.

## 1) Local audit before touching production

```bash
./scripts/audit-repo-state.sh --skip-build
```

Before deployment, ensure the working tree is clean and all local branches are merged into your deploy branch:

```bash
git status --short
git checkout work
git fetch --all --prune
git merge --ff-only origin/work
```

Use strict mode when you want warnings (like missing Docker) to fail CI checks:

```bash
./scripts/audit-repo-state.sh --strict
```

Run a full production build locally to catch regressions early:

```bash
npm install
npm run build:prod
```

## 2) One-command remote redeploy (recommended)

From your local machine with SSH access to the VPS:

```bash
./scripts/redeploy-vps-docker.sh \
  --host <vps-host> \
  --user <vps-user> \
  --ssh-key ~/.ssh/id_ed25519 \
  --branch work \
  --env-file deployment/.env \
  --domain www.cortexbuildpro.com
```

What it does:

1. uploads `.env` (if provided)
2. checks out and fast-forwards the branch
3. validates Docker compose config remotely
4. rebuilds and restarts containers
5. applies `docker-compose.prod.yml` SSL override
6. retries public health checks on `https://<domain>` and `/api/health`

## 3) Check-only mode (safe dry-run)

```bash
./scripts/redeploy-vps-docker.sh --host <vps-host> --user <vps-user> --check-only
```

This verifies git sync + compose config without restarting containers.

## 4) Manual fallback commands on VPS

```bash
cd /root/cortexbuild_pro
git fetch --all --prune
git checkout work
git pull --ff-only

cd deployment
docker compose down
docker compose build --no-cache app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

docker compose ps
curl -I https://www.cortexbuildpro.com
curl -s https://www.cortexbuildpro.com/api/health
```

## 5) Rollback

If needed, redeploy a previous image tag by pinning the image in `deployment/docker-compose.yml`, then:

```bash
cd /root/cortexbuild_pro/deployment
docker compose down
docker compose up -d
```
