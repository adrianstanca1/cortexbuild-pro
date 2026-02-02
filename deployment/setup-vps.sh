#!/bin/bash
set -e

echo "=== CortexBuild Pro VPS Setup ==="
echo "Setting up Docker and dependencies on fresh VPS..."

# Update system
apt-get update
apt-get upgrade -y

# Install required packages
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    wget

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"

# Create app directory
mkdir -p /root/cortexbuild
mkdir -p /root/cortexbuild/backups

echo "=== VPS Setup Complete ==="
echo "Next: Upload deployment package and run deploy.sh"
