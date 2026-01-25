# CortexBuild Pro - CloudPanel Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying CortexBuild Pro on a VPS using CloudPanel. The deployment includes a PostgreSQL database, Next.js frontend, and Nginx reverse proxy with SSL.

## Prerequisites

1. A VPS with CloudPanel installed
2. Domain name pointing to your VPS IP
3. SSH access to the VPS
4. Docker and Docker Compose installed

## Deployment Steps

### 1. Clone the Repository

```bash
cd /var/www
git clone https://github.com/your-repo/cortexbuild-pro.git
cd cortexbuild-pro
```

### 2. Configure Environment Variables

Copy the example environment file and update the values:

```bash
cp .env.example .env
nano .env
```

Update the following variables:

- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name
- `NEXTAUTH_URL`: Your domain URL
- `NEXTAUTH_SECRET`: Generate a secure secret
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_REGION`: AWS S3 configuration (optional)

### 3. Set Up SSL

Run the SSL setup script:

```bash
chmod +x deployment/setup-ssl.sh
./deployment/setup-ssl.sh yourdomain.com admin@yourdomain.com
```

### 4. Start the Services

```bash
docker-compose -f deployment/docker-compose.yml up -d
```

### 5. Run Database Migrations and Seeding

```bash
docker-compose -f deployment/docker-compose.yml exec app sh -c "cd /app && yarn prisma migrate deploy"
docker-compose -f deployment/docker-compose.yml exec app sh -c "cd /app && yarn prisma db seed"
```

### 6. Configure CloudPanel

1. Log in to CloudPanel
2. Add a new site with your domain
3. Configure the web root to point to the appropriate directory
4. Set up the reverse proxy to forward requests to the Docker container

### 7. Set Up Automated Backups

Configure a cron job for daily backups:

```bash
crontab -e
```

Add the following line to run backups daily at 2 AM:

```bash
0 2 * * * /var/www/cortexbuild-pro/deployment/backup.sh
```

## Database Management

### Migrations

Database migrations are now **automatic** on every deployment via the `entrypoint.sh` script. However, you can manually trigger them if needed:

```bash
docker-compose -f deployment/docker-compose.yml exec app /app/entrypoint.sh --migrate-only
```

### Seeding

To seed the database with initial data:

```bash
docker-compose -f deployment/docker-compose.yml exec app sh -c "cd /app && yarn prisma db seed"
```

### Backups

To manually create a backup:

```bash
./deployment/backup.sh
```

### Restore

To restore from a backup:

```bash
./deployment/restore.sh backups/backup_file.sql.gz
```

## Monitoring and Maintenance

### View Logs

```bash
docker-compose -f deployment/docker-compose.yml logs -f
```

### Restart Services

```bash
docker-compose -f deployment/docker-compose.yml restart
```

### Update the Application

```bash
git pull
./deployment/deploy.sh
```

## Security Checklist

1. **Firewall**: Ensure only necessary ports (80, 443, SSH) are open
2. **SSH**: Use key-based authentication and disable password login
3. **Database**: Use strong credentials and limit access
4. **Secrets**: Store sensitive information in environment variables
5. **Backups**: Regularly test backup and restore procedures

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Verify PostgreSQL credentials and container connectivity
2. **SSL Issues**: Ensure domain DNS is properly configured and Let's Encrypt can verify ownership
3. **Permission Issues**: Check file permissions for the web root and Docker volumes

### Debugging

- Check container logs: `docker-compose -f deployment/docker-compose.yml logs`
- Test database connection: `docker-compose -f deployment/docker-compose.yml exec postgres psql -U username -d database`
- Verify Nginx configuration: `docker-compose -f deployment/docker-compose.yml exec nginx nginx -t`

## Support

For additional support, refer to the [CortexBuild Pro Documentation](https://docs.cortexbuildpro.com) or contact <support@cortexbuildpro.com>.
