#!/bin/bash

# ============================================
# CortexBuild Pro - Security Audit Script
# ============================================
# Comprehensive security audit and hardening recommendations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
}

print_check() {
    local name=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "pass" ]; then
        echo -e "  ${GREEN}✅ $name${NC}"
        [ -n "$message" ] && echo -e "     ${message}"
    elif [ "$status" = "fail" ]; then
        echo -e "  ${RED}❌ $name${NC}"
        [ -n "$message" ] && echo -e "     ${RED}$message${NC}"
    elif [ "$status" = "warn" ]; then
        echo -e "  ${YELLOW}⚠️  $name${NC}"
        [ -n "$message" ] && echo -e "     ${YELLOW}$message${NC}"
    else
        echo -e "  ${BLUE}ℹ️  $name${NC}"
        [ -n "$message" ] && echo -e "     ${message}"
    fi
}

# Counter for issues
CRITICAL_ISSUES=0
WARNINGS=0
PASSES=0

# Check environment variables
check_environment() {
    print_header "Environment Configuration"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_check "Environment File" "fail" ".env file not found"
        ((CRITICAL_ISSUES++))
        return
    fi
    
    print_check "Environment File" "pass" ".env file exists"
    ((PASSES++))
    
    # Load environment
    source .env 2>/dev/null || true
    
    # Check critical secrets
    if [ -z "$NEXTAUTH_SECRET" ]; then
        print_check "NextAuth Secret" "fail" "NEXTAUTH_SECRET not set"
        ((CRITICAL_ISSUES++))
    elif [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
        print_check "NextAuth Secret" "fail" "NEXTAUTH_SECRET too short (minimum 32 characters)"
        ((CRITICAL_ISSUES++))
    else
        print_check "NextAuth Secret" "pass" "Configured (${#NEXTAUTH_SECRET} chars)"
        ((PASSES++))
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        print_check "Database URL" "fail" "DATABASE_URL not set"
        ((CRITICAL_ISSUES++))
    else
        print_check "Database URL" "pass" "Configured"
        ((PASSES++))
        
        # Check if password is in URL
        if [[ "$DATABASE_URL" == *"password"* ]] || [[ "$DATABASE_URL" == *"Password123"* ]] || [[ "$DATABASE_URL" == *"admin"* ]]; then
            print_check "Database Password" "warn" "Potentially weak password detected in DATABASE_URL"
            ((WARNINGS++))
        fi
    fi
    
    if [ -z "$NEXTAUTH_URL" ]; then
        print_check "NextAuth URL" "fail" "NEXTAUTH_URL not set"
        ((CRITICAL_ISSUES++))
    elif [ "$NODE_ENV" = "production" ] && [[ "$NEXTAUTH_URL" != https://* ]]; then
        print_check "NextAuth URL" "fail" "Production must use HTTPS"
        ((CRITICAL_ISSUES++))
    else
        print_check "NextAuth URL" "pass" "$NEXTAUTH_URL"
        ((PASSES++))
    fi
    
    # Check NODE_ENV
    if [ "$NODE_ENV" = "production" ]; then
        print_check "Environment Mode" "info" "Production mode"
    elif [ "$NODE_ENV" = "staging" ]; then
        print_check "Environment Mode" "info" "Staging mode"
    else
        print_check "Environment Mode" "info" "Development mode"
    fi
}

# Check file permissions
check_permissions() {
    print_header "File Permissions"
    
    # Check .env permissions
    if [ -f ".env" ]; then
        local perms=$(stat -c "%a" .env 2>/dev/null || stat -f "%OLp" .env 2>/dev/null)
        if [ "$perms" = "600" ] || [ "$perms" = "400" ]; then
            print_check ".env Permissions" "pass" "Secure ($perms)"
            ((PASSES++))
        else
            print_check ".env Permissions" "fail" "Insecure ($perms), should be 600"
            ((CRITICAL_ISSUES++))
            echo "     Run: chmod 600 .env"
        fi
    fi
    
    # Check sensitive files
    for file in prisma/schema.prisma package.json; do
        if [ -f "$file" ]; then
            local perms=$(stat -c "%a" "$file" 2>/dev/null || stat -f "%OLp" "$file" 2>/dev/null)
            if [ "$perms" = "644" ] || [ "$perms" = "444" ] || [ "$perms" = "600" ]; then
                print_check "$(basename $file) Permissions" "pass" "Acceptable ($perms)"
                ((PASSES++))
            else
                print_check "$(basename $file) Permissions" "warn" "Unusual ($perms)"
                ((WARNINGS++))
            fi
        fi
    done
}

# Check database security
check_database() {
    print_header "Database Security"
    
    if [ -z "$DATABASE_URL" ]; then
        print_check "Database Connection" "fail" "DATABASE_URL not configured"
        ((CRITICAL_ISSUES++))
        return
    fi
    
    # Check if database is accessible
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            print_check "Database Connection" "pass" "Database accessible"
            ((PASSES++))
            
            # Check for database encryption
            local encryption=$(psql "$DATABASE_URL" -t -c "SHOW ssl;" 2>/dev/null | tr -d ' ')
            if [ "$encryption" = "on" ]; then
                print_check "Database SSL" "pass" "SSL enabled"
                ((PASSES++))
            else
                print_check "Database SSL" "warn" "SSL not enabled - consider enabling for production"
                ((WARNINGS++))
            fi
            
            # Check connection count
            local connections=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
            print_check "Database Connections" "info" "$connections active connection(s)"
            
        else
            print_check "Database Connection" "fail" "Cannot connect to database"
            ((CRITICAL_ISSUES++))
        fi
    else
        print_check "Database Connection" "warn" "psql not available, cannot verify"
        ((WARNINGS++))
    fi
}

# Check firewall
check_firewall() {
    print_header "Firewall Configuration"
    
    if command -v ufw &> /dev/null; then
        if sudo ufw status | grep -q "Status: active"; then
            print_check "UFW Firewall" "pass" "Firewall is active"
            ((PASSES++))
            
            # Check SSH
            if sudo ufw status | grep -q "22.*ALLOW"; then
                print_check "SSH Access" "pass" "SSH allowed"
                ((PASSES++))
            else
                print_check "SSH Access" "warn" "SSH not explicitly allowed"
                ((WARNINGS++))
            fi
            
            # Check HTTP/HTTPS
            if sudo ufw status | grep -q "80.*ALLOW\|443.*ALLOW"; then
                print_check "HTTP/HTTPS Access" "pass" "Web ports allowed"
                ((PASSES++))
            else
                print_check "HTTP/HTTPS Access" "warn" "HTTP/HTTPS not allowed"
                ((WARNINGS++))
            fi
        else
            print_check "UFW Firewall" "fail" "Firewall is inactive"
            ((CRITICAL_ISSUES++))
            echo "     Run: sudo ufw enable"
        fi
    else
        print_check "UFW Firewall" "warn" "UFW not installed"
        ((WARNINGS++))
    fi
}

# Check fail2ban
check_fail2ban() {
    print_header "Intrusion Prevention"
    
    if command -v fail2ban-client &> /dev/null; then
        if sudo systemctl is-active --quiet fail2ban; then
            print_check "Fail2ban" "pass" "Running"
            ((PASSES++))
            
            # Check banned IPs
            local banned=$(sudo fail2ban-client status sshd 2>/dev/null | grep "Currently banned" | awk '{print $NF}')
            if [ -n "$banned" ] && [ "$banned" != "0" ]; then
                print_check "Banned IPs" "info" "$banned IP(s) currently banned"
            else
                print_check "Banned IPs" "info" "No banned IPs"
            fi
        else
            print_check "Fail2ban" "warn" "Not running"
            ((WARNINGS++))
            echo "     Run: sudo systemctl start fail2ban"
        fi
    else
        print_check "Fail2ban" "warn" "Not installed"
        ((WARNINGS++))
    fi
}

# Check SSH configuration
check_ssh() {
    print_header "SSH Security"
    
    if [ -f "/etc/ssh/sshd_config" ]; then
        # Check password authentication
        if sudo grep -q "^PasswordAuthentication no" /etc/ssh/sshd_config; then
            print_check "SSH Password Auth" "pass" "Disabled (using keys)"
            ((PASSES++))
        else
            print_check "SSH Password Auth" "warn" "Enabled (recommend key-only)"
            ((WARNINGS++))
        fi
        
        # Check root login
        if sudo grep -q "^PermitRootLogin no" /etc/ssh/sshd_config; then
            print_check "SSH Root Login" "pass" "Disabled"
            ((PASSES++))
        elif sudo grep -q "^PermitRootLogin prohibit-password" /etc/ssh/sshd_config; then
            print_check "SSH Root Login" "pass" "Key-only"
            ((PASSES++))
        else
            print_check "SSH Root Login" "warn" "Root login may be enabled"
            ((WARNINGS++))
        fi
    else
        print_check "SSH Config" "info" "SSH config not found or not accessible"
    fi
}

# Check SSL/TLS
check_ssl() {
    print_header "SSL/TLS Configuration"
    
    if [ "$NODE_ENV" = "production" ]; then
        if [ -d "/etc/letsencrypt/live" ]; then
            local cert_count=$(sudo find /etc/letsencrypt/live -type d -mindepth 1 | wc -l)
            if [ "$cert_count" -gt 0 ]; then
                print_check "SSL Certificates" "pass" "$cert_count certificate(s) found"
                ((PASSES++))
                
                # Check certificate expiry
                for cert_dir in $(sudo find /etc/letsencrypt/live -type d -mindepth 1); do
                    local domain=$(basename "$cert_dir")
                    local cert_file="$cert_dir/fullchain.pem"
                    if [ -f "$cert_file" ]; then
                        local expiry=$(sudo openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
                        local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry" +%s 2>/dev/null)
                        local now_epoch=$(date +%s)
                        local days_left=$(( ($expiry_epoch - $now_epoch) / 86400 ))
                        
                        if [ $days_left -gt 30 ]; then
                            print_check "$domain Certificate" "pass" "$days_left days until expiry"
                            ((PASSES++))
                        elif [ $days_left -gt 0 ]; then
                            print_check "$domain Certificate" "warn" "Expires in $days_left days"
                            ((WARNINGS++))
                        else
                            print_check "$domain Certificate" "fail" "EXPIRED"
                            ((CRITICAL_ISSUES++))
                        fi
                    fi
                done
            else
                print_check "SSL Certificates" "fail" "No certificates found"
                ((CRITICAL_ISSUES++))
            fi
        else
            print_check "SSL Certificates" "fail" "Let's Encrypt directory not found"
            ((CRITICAL_ISSUES++))
        fi
    else
        print_check "SSL Certificates" "info" "Not required in $NODE_ENV mode"
    fi
}

# Check application security
check_application() {
    print_header "Application Security"
    
    # Check if rate limiting is implemented
    if [ -f "lib/rate-limiter.ts" ]; then
        print_check "Rate Limiting" "pass" "Implemented"
        ((PASSES++))
    else
        print_check "Rate Limiting" "fail" "Not found"
        ((CRITICAL_ISSUES++))
    fi
    
    # Check CSRF protection
    if [ -f "lib/csrf.ts" ]; then
        print_check "CSRF Protection" "pass" "Implemented"
        ((PASSES++))
    else
        print_check "CSRF Protection" "fail" "Not found"
        ((CRITICAL_ISSUES++))
    fi
    
    # Check security headers
    if [ -f "lib/security.ts" ]; then
        print_check "Security Headers" "pass" "Implemented"
        ((PASSES++))
    else
        print_check "Security Headers" "warn" "Not found"
        ((WARNINGS++))
    fi
    
    # Check middleware
    if [ -f "middleware.ts" ]; then
        print_check "Auth Middleware" "pass" "Implemented"
        ((PASSES++))
    else
        print_check "Auth Middleware" "warn" "Not found"
        ((WARNINGS++))
    fi
}

# Check dependencies
check_dependencies() {
    print_header "Dependency Security"
    
    if [ -f "package.json" ]; then
        print_check "Package Configuration" "pass" "Found"
        ((PASSES++))
        
        # Run npm audit
        if command -v npm &> /dev/null; then
            echo -e "\n  Running npm audit..."
            local audit_output=$(npm audit --json 2>/dev/null || echo '{}')
            local vulnerabilities=$(echo "$audit_output" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
            
            if [ -n "$vulnerabilities" ] && [ "$vulnerabilities" -eq 0 ]; then
                print_check "NPM Vulnerabilities" "pass" "No known vulnerabilities"
                ((PASSES++))
            elif [ -n "$vulnerabilities" ]; then
                print_check "NPM Vulnerabilities" "warn" "$vulnerabilities vulnerability/vulnerabilities found"
                ((WARNINGS++))
                echo "     Run: npm audit fix"
            else
                print_check "NPM Vulnerabilities" "info" "Could not check"
            fi
        fi
    fi
}

# Check backups
check_backups() {
    print_header "Backup Configuration"
    
    local backup_script=""
    if [ -f "../../deployment/enterprise-backup.sh" ]; then
        backup_script="../../deployment/enterprise-backup.sh"
    elif [ -f "../deployment/enterprise-backup.sh" ]; then
        backup_script="../deployment/enterprise-backup.sh"
    fi
    
    if [ -n "$backup_script" ]; then
        print_check "Backup Script" "pass" "Found"
        ((PASSES++))
    else
        print_check "Backup Script" "warn" "Not found"
        ((WARNINGS++))
    fi
    
    # Check for backup cron job
    if crontab -l 2>/dev/null | grep -q "backup"; then
        print_check "Backup Schedule" "pass" "Cron job configured"
        ((PASSES++))
    else
        print_check "Backup Schedule" "warn" "No cron job found"
        ((WARNINGS++))
        echo "     Add to crontab: 0 2 * * * $backup_script"
    fi
    
    # Check for recent backups
    local backup_dirs=("$HOME/backups" "../../backups" "../backups" "./backups")
    local found_backups=false
    for dir in "${backup_dirs[@]}"; do
        if [ -d "$dir" ]; then
            local recent_backup=$(find "$dir" -name "*.sql.gz" -mtime -1 2>/dev/null | head -1)
            if [ -n "$recent_backup" ]; then
                print_check "Recent Backups" "pass" "Found in $dir"
                ((PASSES++))
                found_backups=true
                break
            fi
        fi
    done
    
    if [ "$found_backups" = false ]; then
        print_check "Recent Backups" "warn" "No recent backups found"
        ((WARNINGS++))
    fi
}

# Check logging
check_logging() {
    print_header "Logging & Monitoring"
    
    # Check if PM2 is installed (for production)
    if command -v pm2 &> /dev/null; then
        print_check "PM2 Process Manager" "pass" "Installed"
        ((PASSES++))
        
        # Check running processes
        local pm2_procs=$(pm2 list 2>/dev/null | grep -c "online" || echo "0")
        if [ "$pm2_procs" -gt 0 ]; then
            print_check "PM2 Processes" "pass" "$pm2_procs running"
            ((PASSES++))
        else
            print_check "PM2 Processes" "info" "No processes running"
        fi
    else
        print_check "PM2 Process Manager" "warn" "Not installed"
        ((WARNINGS++))
    fi
    
    # Check log directory
    if [ -d "logs" ]; then
        print_check "Log Directory" "pass" "Exists"
        ((PASSES++))
    else
        print_check "Log Directory" "warn" "Not found"
        ((WARNINGS++))
    fi
}

# Generate recommendations
generate_recommendations() {
    print_header "Security Recommendations"
    
    echo ""
    if [ $CRITICAL_ISSUES -eq 0 ]; then
        echo -e "${GREEN}✅ No critical security issues found!${NC}"
    else
        echo -e "${RED}❌ $CRITICAL_ISSUES critical issue(s) found that require immediate attention${NC}"
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found - recommended to address${NC}"
    fi
    
    echo -e "${GREEN}✅ $PASSES security checks passed${NC}"
    
    echo ""
    echo "Priority Actions:"
    echo ""
    
    if [ $CRITICAL_ISSUES -gt 0 ]; then
        echo "🔴 CRITICAL (Fix immediately):"
        [ -z "$NEXTAUTH_SECRET" ] && echo "  - Set NEXTAUTH_SECRET in .env (openssl rand -base64 32)"
        [ -z "$DATABASE_URL" ] && echo "  - Configure DATABASE_URL in .env"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo "🟡 WARNINGS (Recommended):"
        echo "  - Review all warnings above and address as appropriate"
        echo "  - Configure automated backups"
        echo "  - Enable fail2ban if not installed"
        echo "  - Use key-only SSH authentication"
        echo ""
    fi
    
    echo "✅ BEST PRACTICES:"
    echo "  - Regularly update dependencies (npm audit fix)"
    echo "  - Monitor logs for suspicious activity"
    echo "  - Test backup restore procedures regularly"
    echo "  - Keep SSL certificates renewed"
    echo "  - Review and update firewall rules"
    echo "  - Use strong, unique passwords"
    echo "  - Enable 2FA for admin accounts"
    echo "  - Regularly review access logs"
    echo ""
}

# Main execution
main() {
    clear
    echo ""
    echo "╔═══════════════════════════════════════════════╗"
    echo "║     CortexBuild Pro - Security Audit         ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo ""
    
    # Check if running from correct directory
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: Must run from nextjs_space directory${NC}"
        exit 1
    fi
    
    # Run all checks
    check_environment
    check_permissions
    check_database
    check_firewall
    check_fail2ban
    check_ssh
    check_ssl
    check_application
    check_dependencies
    check_backups
    check_logging
    
    # Generate recommendations
    generate_recommendations
    
    # Exit with appropriate code
    if [ $CRITICAL_ISSUES -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
