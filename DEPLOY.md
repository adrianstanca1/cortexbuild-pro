# Deploying CortexBuild Pro

**One command on a fresh Ubuntu/Debian VPS:**

```bash
ssh root@72.62.132.43 'git clone https://github.com/adrianstanca1/cortexbuild-pro cortexx 2>/dev/null; cd cortexx && git pull && sh deploy-vps.sh cortexbuildpro.com adrian.stanca1@gmail.com'
```

This installs Docker, generates secrets, and brings up the full stack
(`db + api + ollama + web`) with automatic HTTPS via Caddy / Let's Encrypt.

**Prerequisites**
- DNS A-record: `cortexbuildpro.com → 72.62.132.43`
- Ports `80` + `443` open on the VPS firewall

**URLs once live**

| | URL |
|---|---|
| Mobile app (PWA) | `https://cortexbuildpro.com` |
| Admin console | `https://cortexbuildpro.com/admin` |
| API health | `https://cortexbuildpro.com/api/health` |

---

📖 **Full operations runbook** — auto-start on reboot, nightly backups, restore,
model swapping, day-to-day commands — lives in **[`deploy/README.md`](deploy/README.md)**.

🍏 **iOS / App Store** — see **[`IOS_BUILD.md`](IOS_BUILD.md)** and **[`SHIP_TO_APP_STORE.md`](SHIP_TO_APP_STORE.md)**.
