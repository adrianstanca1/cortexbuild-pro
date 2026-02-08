#!/bin/bash
# =================================================================
# GitHub Actions VPS Deployment - Setup Helper Script
# =================================================================
# This script helps you generate SSH keys and provides instructions
# for configuring GitHub secrets for automated deployment.
# =================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print banner
print_banner() {
    echo ""
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}  GitHub Actions Deployment Setup${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo ""
}

# Print step header
print_step() {
    echo ""
    echo -e "${YELLOW}>>> $1${NC}"
    echo ""
}

# Print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Print info message
print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Confirm action
confirm() {
    read -p "$1 [y/N]: " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

print_banner

echo "This script will help you set up automated VPS deployment via GitHub Actions."
echo ""
print_info "What this script does:"
echo "  1. Generate SSH key pair for GitHub Actions"
echo "  2. Provide instructions for adding public key to VPS"
echo "  3. Provide instructions for configuring GitHub secrets"
echo "  4. Test SSH connection to VPS"
echo ""

if ! confirm "Continue with setup?"; then
    echo "Setup cancelled."
    exit 0
fi

# Step 1: Collect VPS information
print_step "Step 1: VPS Information"

read -p "Enter your VPS IP address or domain: " VPS_HOST
read -p "Enter SSH user (usually 'root'): " VPS_USER
VPS_USER=${VPS_USER:-root}
read -p "Enter SSH port (default: 22): " VPS_PORT
VPS_PORT=${VPS_PORT:-22}

echo ""
print_success "VPS Information collected:"
echo "  Host: $VPS_HOST"
echo "  User: $VPS_USER"
echo "  Port: $VPS_PORT"

# Step 2: Generate SSH key
print_step "Step 2: Generate SSH Key Pair"

SSH_KEY_PATH="$HOME/.ssh/cortexbuild_github_deploy"

if [ -f "$SSH_KEY_PATH" ]; then
    print_error "SSH key already exists at: $SSH_KEY_PATH"
    if confirm "Overwrite existing key?"; then
        rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
    else
        echo "Using existing key."
    fi
fi

if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "Generating new SSH key pair..."
    ssh-keygen -t ed25519 -C "github-actions-cortexbuild" -f "$SSH_KEY_PATH" -N ""
    print_success "SSH key pair generated"
else
    print_success "Using existing SSH key pair"
fi

echo ""
echo "Key files:"
echo "  Private key: $SSH_KEY_PATH"
echo "  Public key:  $SSH_KEY_PATH.pub"

# Step 3: Display public key and instructions
print_step "Step 3: Add Public Key to VPS"

echo "Copy the following public key:"
echo ""
echo -e "${GREEN}─────────────────────────────────────────${NC}"
cat "$SSH_KEY_PATH.pub"
echo -e "${GREEN}─────────────────────────────────────────${NC}"
echo ""
echo "Add this key to your VPS by running these commands on your VPS:"
echo ""
echo -e "${CYAN}ssh $VPS_USER@$VPS_HOST${NC}"
echo -e "${CYAN}mkdir -p ~/.ssh${NC}"
echo -e "${CYAN}chmod 700 ~/.ssh${NC}"
echo -e "${CYAN}# Edit with your preferred editor (nano/vim/vi):${NC}"
echo -e "${CYAN}nano ~/.ssh/authorized_keys${NC}"
echo -e "${CYAN}# OR: vim ~/.ssh/authorized_keys${NC}"
echo ""
echo "  → Paste the public key on a new line"
echo "  → Save and exit (Ctrl+X, Y, Enter)"
echo ""
echo -e "${CYAN}chmod 600 ~/.ssh/authorized_keys${NC}"
echo -e "${CYAN}exit${NC}"
echo ""

if ! confirm "Have you added the public key to your VPS?"; then
    print_error "Please add the public key to your VPS before continuing."
    echo ""
    echo "To resume setup later, run: $0"
    exit 1
fi

# Step 4: Test SSH connection
print_step "Step 4: Test SSH Connection"

echo "Testing SSH connection to VPS..."
if ssh -i "$SSH_KEY_PATH" -p "$VPS_PORT" -o BatchMode=yes -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "echo 'Connection successful'" 2>/dev/null; then
    print_success "SSH connection successful!"
else
    print_error "SSH connection failed"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verify public key is in VPS ~/.ssh/authorized_keys"
    echo "  2. Check VPS SSH service: sudo systemctl status sshd"
    echo "  3. Verify firewall allows SSH: sudo ufw status"
    echo "  4. Test manually: ssh -i $SSH_KEY_PATH -p $VPS_PORT $VPS_USER@$VPS_HOST"
    echo ""
    if ! confirm "Continue anyway?"; then
        exit 1
    fi
fi

# Step 5: Display GitHub secrets configuration
print_step "Step 5: Configure GitHub Secrets"

echo "Add the following secrets to your GitHub repository:"
echo ""
echo "Navigate to: GitHub Repository → Settings → Secrets and variables → Actions"
echo ""

echo -e "${YELLOW}Secret 1: VPS_SSH_KEY${NC}"
echo "  → Click 'New repository secret'"
echo "  → Name: VPS_SSH_KEY"
echo "  → Value: Copy the ENTIRE private key below:"
echo ""
echo -e "${GREEN}─────────────────────────────────────────${NC}"
cat "$SSH_KEY_PATH"
echo -e "${GREEN}─────────────────────────────────────────${NC}"
echo ""

echo -e "${YELLOW}Secret 2: VPS_HOST${NC}"
echo "  → Click 'New repository secret'"
echo "  → Name: VPS_HOST"
echo "  → Value: $VPS_HOST"
echo ""

echo -e "${YELLOW}Secret 3: VPS_USER${NC}"
echo "  → Click 'New repository secret'"
echo "  → Name: VPS_USER"
echo "  → Value: $VPS_USER"
echo ""

if [ "$VPS_PORT" != "22" ]; then
    echo -e "${YELLOW}Secret 4: VPS_PORT${NC}"
    echo "  → Click 'New repository secret'"
    echo "  → Name: VPS_PORT"
    echo "  → Value: $VPS_PORT"
    echo ""
fi

# Step 6: Next steps
print_step "Step 6: Next Steps"

echo "After configuring GitHub secrets:"
echo ""
echo "1. Ensure your VPS is set up with CortexBuild Pro:"
echo "   ${CYAN}ssh $VPS_USER@$VPS_HOST${NC}"
echo "   ${CYAN}cd /root/cortexbuild-pro/deployment${NC}"
echo "   ${CYAN}sudo bash quick-start.sh${NC}"
echo ""
echo "2. Deploy from GitHub Actions:"
echo "   → Go to GitHub: Actions → Deploy to VPS"
echo "   → Click 'Run workflow'"
echo "   → Select environment and options"
echo "   → Click 'Run workflow' button"
echo "   → Watch the deployment progress"
echo ""
echo "3. Monitor deployment:"
echo "   → View logs in real-time on GitHub Actions"
echo "   → Check VPS health after deployment"
echo ""

# Step 7: Save configuration
print_step "Saving Configuration"

CONFIG_FILE="$HOME/.cortexbuild-deploy-config"
cat > "$CONFIG_FILE" << EOF
# CortexBuild Pro - Deployment Configuration
# Generated: $(date)

VPS_HOST=$VPS_HOST
VPS_USER=$VPS_USER
VPS_PORT=$VPS_PORT
SSH_KEY_PATH=$SSH_KEY_PATH

# Quick test command:
# ssh -i $SSH_KEY_PATH -p $VPS_PORT $VPS_USER@$VPS_HOST
EOF

chmod 600 "$CONFIG_FILE"
print_success "Configuration saved to: $CONFIG_FILE"

# Final summary
print_step "Setup Complete!"

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Setup Summary${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "✓ SSH key pair generated"
echo "✓ Public key ready for VPS"
echo "✓ Private key ready for GitHub"
echo "✓ Configuration saved"
echo ""
echo -e "${CYAN}VPS Connection:${NC}"
echo "  ssh -i $SSH_KEY_PATH -p $VPS_PORT $VPS_USER@$VPS_HOST"
echo ""
echo -e "${CYAN}Documentation:${NC}"
echo "  Full guide: deployment/AUTOMATED-DEPLOYMENT.md"
echo "  Quick start: deployment/QUICKSTART.md"
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Ready to deploy! 🚀${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
