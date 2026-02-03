#!/bin/bash
# =============================================================================
# CortexBuild Pro - Health Check & Monitoring Script
# =============================================================================
# This script checks the health of the CortexBuild Pro deployment
# and provides detailed status information
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Status tracking
ERRORS=0
WARNINGS=0

print_header() {
    echo -e "${CYAN}"
    echo "============================================================================="
    echo "  CortexBuild Pro - Health Check"
    echo "  $(date +'%Y-%m-%d %H:%M:%S')"
    echo "============================================================================="
    echo -e "${NC}"
    echo ""
}

check_section() {
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

status_ok() {
    echo -e "  ${GREEN}✓${NC} $1"
}

status_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

status_error() {
    echo -e "  ${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

status_info() {
    echo -e "  ${BLUE}ℹ${NC} $1"
}

# Check Docker daemon
check_docker() {
    check_section "Docker Status"
    
    if command -v docker &> /dev/null; then
        status_ok "Docker installed: $(docker --version | cut -d' ' -f3 | tr -d ',')"
        
        if systemctl is-active --quiet docker; then
            status_ok "Docker daemon running"
        else
            status_error "Docker daemon not running"
        fi
        
        if docker compose version &> /dev/null; then
            status_ok "Docker Compose available: $(docker compose version --short)"
        else
            status_error "Docker Compose not available"
        fi
    else
        status_error "Docker not installed"
    fi
    
    echo ""
}

# Check containers
check_containers() {
    check_section "Container Status"
    
    cd "$SCRIPT_DIR"
    
    if ! docker compose ps &>/dev/null; then
        status_error "Unable to check container status"
        echo ""
        return
    fi
    
    # Get container status
    local containers=($(docker compose ps --format '{{.Service}}'))
    
    if [[ ${#containers[@]} -eq 0 ]]; then
        status_error "No containers running"
        echo ""
        return
    fi
    
    for service in "${containers[@]}"; do
        local state=$(docker compose ps "$service" --format '{{.State}}')
        local status=$(docker compose ps "$service" --format '{{.Status}}')
        
        if [[ "$state" == "running" ]]; then
            # Check if healthy
            local health=$(docker compose ps "$service" --format '{{.Health}}')
            if [[ "$health" == "healthy" ]] || [[ -z "$health" ]]; then
                status_ok "$service: $state"
            else
                status_warn "$service: $state ($health)"
            fi
        else
            status_error "$service: $state"
        fi
    done
    
    echo ""
}

# Check database connectivity
check_database() {
    check_section "Database Status"
    
    cd "$SCRIPT_DIR"
    
    if docker compose ps db --format '{{.State}}' | grep -q "running"; then
        # Test connection
        if docker compose exec -T db pg_isready -U cortexbuild &>/dev/null; then
            status_ok "Database accepting connections"
            
            # Get database size
            local db_size=$(docker compose exec -T db psql -U cortexbuild -d cortexbuild -tAc \
                "SELECT pg_size_pretty(pg_database_size('cortexbuild'));" 2>/dev/null | tr -d '\r')
            
            if [[ -n "$db_size" ]]; then
                status_info "Database size: $db_size"
            fi
            
            # Count tables
            local table_count=$(docker compose exec -T db psql -U cortexbuild -d cortexbuild -tAc \
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d '\r')
            
            if [[ -n "$table_count" ]]; then
                status_info "Tables: $table_count"
            fi
        else
            status_error "Database not accepting connections"
        fi
    else
        status_error "Database container not running"
    fi
    
    echo ""
}

# Check application endpoints
check_application() {
    check_section "Application Health"
    
    # Check if port 3000 is listening
    if netstat -tuln 2>/dev/null | grep -q ":3000 "; then
        status_ok "Application listening on port 3000"
    else
        if ss -tuln 2>/dev/null | grep -q ":3000 "; then
            status_ok "Application listening on port 3000"
        else
            status_error "Application not listening on port 3000"
        fi
    fi
    
    # Test HTTP endpoint
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/providers 2>/dev/null || echo "000")
    
    if [[ "$response" == "200" ]]; then
        status_ok "API endpoint responding (HTTP $response)"
    elif [[ "$response" == "000" ]]; then
        status_error "Cannot connect to application"
    else
        status_warn "API endpoint returned HTTP $response"
    fi
    
    # Check response time
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000/api/auth/providers 2>/dev/null || echo "0")
    
    if [[ -n "$response_time" ]] && [[ "$response_time" != "0" ]]; then
        local response_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "$response_time")
        
        if (( $(echo "$response_time < 1.0" | bc -l 2>/dev/null || echo 0) )); then
            status_ok "Response time: ${response_ms}ms"
        elif (( $(echo "$response_time < 3.0" | bc -l 2>/dev/null || echo 0) )); then
            status_warn "Response time: ${response_ms}ms (slow)"
        else
            status_error "Response time: ${response_ms}ms (very slow)"
        fi
    fi
    
    echo ""
}

# Check system resources
check_resources() {
    check_section "System Resources"
    
    # Memory usage
    local mem_total=$(free -m | awk '/^Mem:/{print $2}')
    local mem_used=$(free -m | awk '/^Mem:/{print $3}')
    local mem_percent=$(echo "scale=1; $mem_used * 100 / $mem_total" | bc)
    
    if (( $(echo "$mem_percent < 80" | bc -l) )); then
        status_ok "Memory: ${mem_used}MB / ${mem_total}MB (${mem_percent}%)"
    elif (( $(echo "$mem_percent < 90" | bc -l) )); then
        status_warn "Memory: ${mem_used}MB / ${mem_total}MB (${mem_percent}%) - High usage"
    else
        status_error "Memory: ${mem_used}MB / ${mem_total}MB (${mem_percent}%) - Critical"
    fi
    
    # Disk usage
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
    local disk_avail=$(df -h / | awk 'NR==2 {print $4}')
    
    if (( disk_usage < 80 )); then
        status_ok "Disk: ${disk_usage}% used (${disk_avail} available)"
    elif (( disk_usage < 90 )); then
        status_warn "Disk: ${disk_usage}% used (${disk_avail} available) - High usage"
    else
        status_error "Disk: ${disk_usage}% used (${disk_avail} available) - Critical"
    fi
    
    # CPU load
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
    local cpu_cores=$(nproc)
    
    status_info "CPU Load: $load_avg (${cpu_cores} cores)"
    
    echo ""
}

# Check Docker resource usage
check_docker_resources() {
    check_section "Container Resources"
    
    if docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | tail -n +2 | while read -r line; do
        echo "  $line"
    done; then
        echo ""
    else
        status_warn "Unable to get container resource stats"
        echo ""
    fi
}

# Check logs for errors
check_logs() {
    check_section "Recent Log Analysis"
    
    cd "$SCRIPT_DIR"
    
    # Check app logs for errors
    local error_count=$(docker compose logs --tail=100 app 2>/dev/null | grep -i "error" | grep -v "warning" | wc -l)
    
    if [[ $error_count -eq 0 ]]; then
        status_ok "No errors in recent logs"
    elif [[ $error_count -lt 5 ]]; then
        status_warn "$error_count error(s) found in recent logs"
    else
        status_error "$error_count error(s) found in recent logs"
    fi
    
    # Check for common issues
    if docker compose logs --tail=100 app 2>/dev/null | grep -qi "econnrefused"; then
        status_warn "Connection refused errors detected"
    fi
    
    if docker compose logs --tail=100 app 2>/dev/null | grep -qi "out of memory"; then
        status_error "Out of memory errors detected"
    fi
    
    echo ""
}

# Check backups
check_backups() {
    check_section "Backup Status"
    
    local backup_dir="/root/cortexbuild_backups"
    
    if [[ -d "$backup_dir" ]]; then
        local backup_count=$(find "$backup_dir" -name "*.sql.gz" -o -name "*.sql" 2>/dev/null | wc -l)
        
        if [[ $backup_count -gt 0 ]]; then
            status_ok "Found $backup_count backup(s)"
            
            # Find most recent backup
            local latest_backup=$(find "$backup_dir" -type f \( -name "*.sql.gz" -o -name "*.sql" \) -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
            
            if [[ -n "$latest_backup" ]]; then
                local backup_age=$(( ($(date +%s) - $(stat -c %Y "$latest_backup")) / 86400 ))
                status_info "Latest backup: $(basename "$latest_backup") (${backup_age} days ago)"
                
                if [[ $backup_age -gt 7 ]]; then
                    status_warn "Latest backup is more than 7 days old"
                fi
            fi
        else
            status_warn "No backups found"
        fi
    else
        status_warn "Backup directory not found: $backup_dir"
    fi
    
    echo ""
}

# Print summary
print_summary() {
    echo -e "${CYAN}"
    echo "============================================================================="
    echo "  Summary"
    echo "============================================================================="
    echo -e "${NC}"
    
    if [[ $ERRORS -eq 0 ]] && [[ $WARNINGS -eq 0 ]]; then
        echo -e "${GREEN}✓ All checks passed!${NC}"
        echo -e "${GREEN}  System is healthy${NC}"
    elif [[ $ERRORS -eq 0 ]]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
        echo -e "${YELLOW}  System is functional but needs attention${NC}"
    else
        echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
        echo -e "${RED}  System requires immediate attention${NC}"
    fi
    
    echo ""
    echo -e "View detailed logs with: ${CYAN}docker compose -f $SCRIPT_DIR/docker-compose.yml logs -f${NC}"
    echo ""
}

# Main execution
main() {
    print_header
    check_docker
    check_containers
    check_database
    check_application
    check_resources
    check_docker_resources
    check_logs
    check_backups
    print_summary
}

main "$@"
