#!/bin/bash

# ============================================
# CortexBuild Pro - System Health Check
# ============================================
# Comprehensive health monitoring script

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
    local value=$3
    
    if [ "$status" = "ok" ]; then
        echo -e "  ${GREEN}✅ $name${NC}: $value"
    elif [ "$status" = "warn" ]; then
        echo -e "  ${YELLOW}⚠️  $name${NC}: $value"
    elif [ "$status" = "error" ]; then
        echo -e "  ${RED}❌ $name${NC}: $value"
    else
        echo -e "  ${BLUE}ℹ️  $name${NC}: $value"
    fi
}

# Check system resources
check_system() {
    print_header "System Resources"
    
    # CPU
    if command -v mpstat &> /dev/null; then
        CPU_USAGE=$(mpstat 1 1 | awk '/Average/ {print 100 - $NF}')
        if (( $(echo "$CPU_USAGE < 80" | bc -l) )); then
            print_check "CPU Usage" "ok" "${CPU_USAGE}%"
        else
            print_check "CPU Usage" "warn" "${CPU_USAGE}% (high)"
        fi
    else
        print_check "CPU Usage" "info" "mpstat not available"
    fi
    
    # Memory
    MEMORY_INFO=$(free -m | awk 'NR==2{printf "Used: %sMB / Total: %sMB (%.2f%%)", $3, $2, $3*100/$2 }')
    MEMORY_PERCENT=$(free | awk 'NR==2{printf "%.0f", $3*100/$2 }')
    
    if [ $MEMORY_PERCENT -lt 80 ]; then
        print_check "Memory" "ok" "$MEMORY_INFO"
    elif [ $MEMORY_PERCENT -lt 90 ]; then
        print_check "Memory" "warn" "$MEMORY_INFO"
    else
        print_check "Memory" "error" "$MEMORY_INFO (critical)"
    fi
    
    # Disk
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    DISK_INFO=$(df -h / | awk 'NR==2{printf "Used: %s / Total: %s (%s)", $3, $2, $5}')
    
    if [ $DISK_USAGE -lt 80 ]; then
        print_check "Disk Space" "ok" "$DISK_INFO"
    elif [ $DISK_USAGE -lt 90 ]; then
        print_check "Disk Space" "warn" "$DISK_INFO"
    else
        print_check "Disk Space" "error" "$DISK_INFO (critical)"
    fi
    
    # Load average
    LOAD=$(uptime | awk -F'load average:' '{print $2}' | xargs)
    print_check "Load Average" "info" "$LOAD"
    
    # Uptime
    UPTIME=$(uptime -p)
    print_check "System Uptime" "ok" "$UPTIME"
}

# Check application
check_application() {
    print_header "Application Status"
    
    # PM2 processes
    if command -v pm2 &> /dev/null; then
        PM2_STATUS=$(pm2 jlist 2>/dev/null || echo "[]")
        PM2_COUNT=$(echo "$PM2_STATUS" | grep -c '"status":"online"' || echo "0")
        
        if [ "$PM2_COUNT" -gt 0 ]; then
            print_check "PM2 Processes" "ok" "$PM2_COUNT running"
            
            # Check each process
            echo "$PM2_STATUS" | grep -o '"name":"[^"]*".*"status":"[^"]*"' | while read line; do
                APP_NAME=$(echo "$line" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
                APP_STATUS=$(echo "$line" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
                
                if [ "$APP_STATUS" = "online" ]; then
                    print_check "  $APP_NAME" "ok" "online"
                else
                    print_check "  $APP_NAME" "error" "$APP_STATUS"
                fi
            done
        else
            print_check "PM2 Processes" "error" "No processes running"
        fi
    else
        print_check "PM2" "error" "Not installed"
    fi
    
    # API health check
    if command -v curl &> /dev/null; then
        if curl -f -s http://localhost:3000/api/auth/providers > /dev/null 2>&1; then
            print_check "API Health" "ok" "Responding"
        else
            print_check "API Health" "error" "Not responding"
        fi
    fi
}

# Check database
check_database() {
    print_header "Database Status"
    
    # Load environment
    if [ -f ".env" ]; then
        source .env 2>/dev/null || true
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        print_check "Database Config" "error" "DATABASE_URL not set"
        return
    fi
    
    # PostgreSQL status
    if command -v systemctl &> /dev/null; then
        if systemctl is-active --quiet postgresql; then
            print_check "PostgreSQL Service" "ok" "Running"
        else
            print_check "PostgreSQL Service" "error" "Not running"
            return
        fi
    fi
    
    # Database connectivity
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            print_check "Database Connection" "ok" "Connected"
            
            # Connection count
            CONN_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
            print_check "Active Connections" "info" "$CONN_COUNT"
            
            # Database size
            DB_SIZE=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | tr -d ' ')
            print_check "Database Size" "info" "$DB_SIZE"
            
            # Table count
            TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
            print_check "Tables" "info" "$TABLE_COUNT"
            
        else
            print_check "Database Connection" "error" "Cannot connect"
        fi
    else
        print_check "Database Connection" "warn" "psql not available"
    fi
}

# Check web server
check_webserver() {
    print_header "Web Server Status"
    
    # Nginx status
    if command -v systemctl &> /dev/null && systemctl list-units --type=service | grep -q nginx; then
        if systemctl is-active --quiet nginx; then
            print_check "Nginx Service" "ok" "Running"
            
            # Check configuration
            if nginx -t > /dev/null 2>&1; then
                print_check "Nginx Config" "ok" "Valid"
            else
                print_check "Nginx Config" "error" "Invalid"
            fi
        else
            print_check "Nginx Service" "error" "Not running"
        fi
    else
        print_check "Nginx" "info" "Not installed or managed differently"
    fi
    
    # Check ports
    if command -v netstat &> /dev/null; then
        if netstat -tuln | grep -q ":80 "; then
            print_check "HTTP Port (80)" "ok" "Listening"
        else
            print_check "HTTP Port (80)" "warn" "Not listening"
        fi
        
        if netstat -tuln | grep -q ":443 "; then
            print_check "HTTPS Port (443)" "ok" "Listening"
        else
            print_check "HTTPS Port (443)" "warn" "Not listening"
        fi
    fi
}

# Check SSL certificates
check_ssl() {
    print_header "SSL/TLS Certificates"
    
    if [ -d "/etc/letsencrypt/live" ]; then
        CERT_COUNT=$(sudo find /etc/letsencrypt/live -type d -mindepth 1 2>/dev/null | wc -l)
        print_check "Certificates Found" "info" "$CERT_COUNT"
        
        # Check each certificate
        for cert_dir in $(sudo find /etc/letsencrypt/live -type d -mindepth 1 2>/dev/null); do
            DOMAIN=$(basename "$cert_dir")
            CERT_FILE="$cert_dir/fullchain.pem"
            
            if [ -f "$CERT_FILE" ]; then
                EXPIRY=$(sudo openssl x509 -in "$CERT_FILE" -noout -enddate 2>/dev/null | cut -d= -f2)
                EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY" +%s 2>/dev/null)
                NOW_EPOCH=$(date +%s)
                DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
                
                if [ $DAYS_LEFT -gt 30 ]; then
                    print_check "$DOMAIN" "ok" "$DAYS_LEFT days until expiry"
                elif [ $DAYS_LEFT -gt 14 ]; then
                    print_check "$DOMAIN" "warn" "$DAYS_LEFT days until expiry"
                elif [ $DAYS_LEFT -gt 0 ]; then
                    print_check "$DOMAIN" "error" "$DAYS_LEFT days until expiry (renew now!)"
                else
                    print_check "$DOMAIN" "error" "EXPIRED"
                fi
            fi
        done
    else
        print_check "SSL Certificates" "info" "Let's Encrypt not found"
    fi
}

# Check backups
check_backups() {
    print_header "Backup Status"
    
    # Find backups
    BACKUP_DIRS=("$HOME/backups" "./backups" "../backups" "../../backups")
    FOUND_BACKUPS=false
    
    for dir in "${BACKUP_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            # Daily backups
            DAILY_COUNT=$(find "$dir/daily" -name "*.sql.gz" -type f 2>/dev/null | wc -l)
            if [ $DAILY_COUNT -gt 0 ]; then
                print_check "Daily Backups" "ok" "$DAILY_COUNT found in $dir/daily"
                FOUND_BACKUPS=true
                
                # Check most recent
                LATEST=$(find "$dir/daily" -name "*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
                if [ -n "$LATEST" ]; then
                    AGE=$((($(date +%s) - $(stat -c %Y "$LATEST" 2>/dev/null || stat -f %m "$LATEST" 2>/dev/null)) / 3600))
                    if [ $AGE -lt 24 ]; then
                        print_check "Latest Backup" "ok" "$AGE hours ago"
                    elif [ $AGE -lt 48 ]; then
                        print_check "Latest Backup" "warn" "$AGE hours ago"
                    else
                        print_check "Latest Backup" "error" "$AGE hours ago (too old)"
                    fi
                fi
                break
            fi
        fi
    done
    
    if [ "$FOUND_BACKUPS" = false ]; then
        print_check "Backups" "error" "No backups found"
    fi
}

# Check security
check_security() {
    print_header "Security Status"
    
    # Firewall
    if command -v ufw &> /dev/null; then
        if sudo ufw status | grep -q "Status: active"; then
            print_check "Firewall (UFW)" "ok" "Active"
        else
            print_check "Firewall (UFW)" "error" "Inactive"
        fi
    fi
    
    # Fail2ban
    if command -v fail2ban-client &> /dev/null; then
        if sudo systemctl is-active --quiet fail2ban; then
            print_check "Fail2ban" "ok" "Active"
            BANNED=$(sudo fail2ban-client status sshd 2>/dev/null | grep "Currently banned" | awk '{print $NF}')
            [ -n "$BANNED" ] && [ "$BANNED" != "0" ] && print_check "Banned IPs" "info" "$BANNED"
        else
            print_check "Fail2ban" "warn" "Not running"
        fi
    fi
    
    # SSH
    if sudo grep -q "^PasswordAuthentication no" /etc/ssh/sshd_config 2>/dev/null; then
        print_check "SSH Password Auth" "ok" "Disabled"
    else
        print_check "SSH Password Auth" "warn" "Enabled"
    fi
}

# Check logs for errors
check_logs() {
    print_header "Recent Errors"
    
    # Application errors (last hour)
    if [ -d "logs" ]; then
        ERROR_COUNT=$(find logs -name "*.log" -type f -mmin -60 -exec grep -i "error\|critical\|fatal" {} \; 2>/dev/null | wc -l)
        
        if [ $ERROR_COUNT -eq 0 ]; then
            print_check "Application Errors" "ok" "None in last hour"
        elif [ $ERROR_COUNT -lt 10 ]; then
            print_check "Application Errors" "warn" "$ERROR_COUNT in last hour"
        else
            print_check "Application Errors" "error" "$ERROR_COUNT in last hour"
        fi
    fi
    
    # System errors (last hour)
    if command -v journalctl &> /dev/null; then
        SYSTEM_ERRORS=$(sudo journalctl --since "1 hour ago" --priority=err --no-pager 2>/dev/null | grep -c "error" || echo "0")
        
        if [ $SYSTEM_ERRORS -eq 0 ]; then
            print_check "System Errors" "ok" "None in last hour"
        elif [ $SYSTEM_ERRORS -lt 10 ]; then
            print_check "System Errors" "warn" "$SYSTEM_ERRORS in last hour"
        else
            print_check "System Errors" "error" "$SYSTEM_ERRORS in last hour"
        fi
    fi
}

# Generate summary
generate_summary() {
    print_header "Summary"
    
    echo ""
    echo "Health Check completed at $(date)"
    echo ""
    echo "For detailed diagnostics, run:"
    echo "  ./scripts/security-audit.sh"
    echo ""
    echo "To view application logs:"
    echo "  pm2 logs"
    echo ""
    echo "To monitor resources:"
    echo "  htop"
    echo ""
}

# Main execution
main() {
    clear
    echo ""
    echo "╔═══════════════════════════════════════════════╗"
    echo "║    CortexBuild Pro - System Health Check     ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo ""
    
    check_system
    check_application
    check_database
    check_webserver
    check_ssl
    check_backups
    check_security
    check_logs
    generate_summary
}

# Run main function
main "$@"
