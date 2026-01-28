#!/bin/bash
# CortexBuild Pro - VPS Lockdown & Setup
set -e

DOMAIN="www.cortexbuildpro.com"
IP="72.62.132.43"

echo "Locking down VPS for $DOMAIN ($IP)..."

# Ensure prerequisites
sudo apt-get update && sudo apt-get install -y docker.io docker-compose ufw

# Firewall configuration
echo "Configuring UFW..."
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

echo "VPS Environment Ready for Domain: $DOMAIN"
