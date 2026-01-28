#!/bin/bash
# CortexBuild Pro - Complete VPS Setup & Configuration
# This script configures a fresh VPS for CortexBuild Pro deployment
set -e

DOMAIN="www.cortexbuildpro.com"
IP="72.62.132.43"

echo "=========================================="
echo "CortexBuild Pro - VPS Setup"
echo "=========================================="
echo "Domain: $DOMAIN"
echo "IP Address: $IP"
echo "=========================================="

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   echo "✓ Running with root privileges"
else
   echo "⚠ This script requires sudo privileges"
fi

# System Update
echo ""
echo "Step 1: Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Essential Dependencies
echo ""
echo "Step 2: Installing essential packages..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    wget \
    unzip \
    htop \
    ufw \
    fail2ban \
    openssl

# Install Docker
echo ""
echo "Step 3: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "✓ Docker installed successfully"
else
    echo "✓ Docker already installed"
fi

# Install Docker Compose
echo ""
echo "Step 4: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
    echo "✓ Docker Compose installed successfully"
else
    echo "✓ Docker Compose already installed"
fi

# Configure Firewall (UFW)
echo ""
echo "Step 5: Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (critical - do this first!)
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Allow application port (for development/direct access)
sudo ufw allow 3000/tcp comment 'Application'

# Enable firewall
sudo ufw --force enable
echo "✓ Firewall configured and enabled"

# Configure Fail2Ban for SSH protection
echo ""
echo "Step 6: Configuring Fail2Ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create jail for SSH
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

sudo systemctl restart fail2ban
echo "✓ Fail2Ban configured for SSH protection"

# System Performance Tuning
echo ""
echo "Step 7: Optimizing system performance..."

# Increase file descriptors limit
sudo tee -a /etc/security/limits.conf > /dev/null <<EOF
# CortexBuild Pro - Increased limits
* soft nofile 65535
* hard nofile 65535
* soft nproc 65535
* hard nproc 65535
EOF

# Optimize kernel parameters for web server
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF
# CortexBuild Pro - Network optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10000 65000
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15
EOF

sudo sysctl -p
echo "✓ System performance optimized"

# Create deployment directory
echo ""
echo "Step 8: Creating deployment directory..."
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
echo "✓ Deployment directory created at /var/www"

# Configure swap if not exists (for VPS with limited RAM)
echo ""
echo "Step 9: Checking swap configuration..."
if [ $(swapon --show | wc -l) -eq 0 ]; then
    echo "Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✓ Swap file created"
else
    echo "✓ Swap already configured"
fi

# Display system information
echo ""
echo "=========================================="
echo "VPS Setup Complete!"
echo "=========================================="
echo ""
echo "System Information:"
echo "  OS: $(lsb_release -d | cut -f2)"
echo "  Kernel: $(uname -r)"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker compose version)"
echo ""
echo "Firewall Status:"
sudo ufw status numbered
echo ""
echo "Next Steps:"
echo "1. Clone repository: git clone https://github.com/adrianstanca1/cortexbuild-pro.git /var/www/cortexbuild-pro"
echo "2. Configure environment: cd /var/www/cortexbuild-pro/deployment && cp .env.example .env"
echo "3. Edit .env file: nano .env"
echo "4. Deploy application: ./deploy-from-github.sh"
echo ""
echo "=========================================="
