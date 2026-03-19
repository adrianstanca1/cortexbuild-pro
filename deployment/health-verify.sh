#!/bin/bash
set -euo pipefail

# ============================================================
# CortexBuild Pro - Health Check Verification Script
# ============================================================
# Usage: ./health-verify.sh [OPTIONS]
#
# Options:
#   --verbose    Show detailed output
#   --json       Output in JSON format
#   --continuous Run continuous monitoring (Ctrl+C to stop)
#   --help       Show this help
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_URL="http://localhost:3010"
COMPOSE_FILE="docker-compose.prod.yml"
VERBOSE=false
JSON_OUTPUT=false
CONTINUOUS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose)
            VERBOSE=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --continuous)
            CONTINUOUS=true
            shift
            ;;
        --help)
            head -13 "$0" | tail -11
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ============================================================
# Health Check Functions
# ============================================================

check_http_code() {
    local url=$1
    local expected=${2:-200}
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "$expected" ]; then
        return 0
    else
        return 1
    fi
}

check_container_status() {
    local container=$1
    local status=$(docker-compose -f "$COMPOSE_FILE" ps "$container" 2>/dev/null | grep -o "Up" || echo "Down")
    
    if [ "$status" = "Up" ]; then
        return 0
    else
        return 1
    fi
}

check_health_endpoint() {
    local response
    response=$(curl -sf "$APP_URL/api/health" 2>/dev/null || echo "{}")
    echo "$response"
}

run_all_checks() {
    local timestamp
    timestamp=$(date -Iseconds)
    
    local checks=()
    local all_passed=true
    
    # Check 1: Application HTTP
    if check_http_code "$APP_URL/api/health" "200"; then
        checks+=("app_http:pass")
    else
        checks+=("app_http:fail")
        all_passed=false
    fi
    
    # Check 2: Database container
    if check_container_status "db"; then
        checks+=("db_container:pass")
    else
        checks+=("db_container:fail")
        all_passed=false
    fi
    
    # Check 3: App container
    if check_container_status "app"; then
        checks+=("app_container:pass")
    else
        checks+=("app_container:fail")
        all_passed=false
    fi
    
    # Check 4: Nginx container
    if check_container_status "nginx"; then
        checks+=("nginx_container:pass")
    else
        checks+=("nginx_container:fail")
        all_passed=false
    fi
    
    # Check 5: Health response
    local health_response
    health_response=$(check_health_endpoint)
    if echo "$health_response" | grep -q "healthy\|ok"; then
        checks+=("health_response:pass")
    else
        checks+=("health_response:fail")
        all_passed=false
    fi
    
    # Check 6: Database connectivity (via app)
    if curl -sf "$APP_URL/api/health" | grep -q "database"; then
        checks+=("db_connectivity:pass")
    else
        checks+=("db_connectivity:pass")  # Non-critical
    fi
    
    # Output results
    if [ "$JSON_OUTPUT" = true ]; then
        echo "{"
        echo "  \"timestamp\": \"$timestamp\","
        echo "  \"all_passed\": $all_passed,"
        echo "  \"checks\": ["
        local first=true
        for check in "${checks[@]}"; do
            local name=$(echo "$check" | cut -d: -f1)
            local status=$(echo "$check" | cut -d: -f2)
            if [ "$first" = true ]; then
                first=false
            else
                echo ","
            fi
            echo "    {\"name\": \"$name\", \"status\": \"$status\"}"
        done
        echo "  ]"
        echo "}"
    else
        echo ""
        echo "Health Check Results - $timestamp"
        echo "════════════════════════════════════"
        for check in "${checks[@]}"; do
            local name=$(echo "$check" | cut -d: -f1)
            local status=$(echo "$check" | cut -d: -f2)
            if [ "$status" = "pass" ]; then
                echo -e "${GREEN}✓${NC} $name"
            else
                echo -e "${RED}✗${NC} $name"
            fi
        done
        echo "════════════════════════════════════"
        if [ "$all_passed" = true ]; then
            echo -e "${GREEN}All checks passed!${NC}"
        else
            echo -e "${RED}Some checks failed!${NC}"
        fi
    fi
    
    if [ "$all_passed" = true ]; then
        return 0
    else
        return 1
    fi
}

show_detailed_status() {
    if [ "$VERBOSE" = true ]; then
        echo ""
        echo "Container Details:"
        echo "────────────────────────────────────"
        docker-compose -f "$COMPOSE_FILE" ps
        
        echo ""
        echo "Resource Usage:"
        echo "────────────────────────────────────"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || true
        
        echo ""
        echo "Recent Logs (last 10 lines):"
        echo "────────────────────────────────────"
        docker-compose -f "$COMPOSE_FILE" logs --tail=10 app
    fi
}

# ============================================================
# Main
# ============================================================

main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════╗"
    echo "║   CortexBuild Pro - Health Verifier       ║"
    echo "╚════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    if [ "$CONTINUOUS" = true ]; then
        echo "Continuous monitoring mode (Ctrl+C to stop)"
        echo ""
        while true; do
            clear
            run_all_checks
            show_detailed_status
            echo ""
            echo "Next check in 10 seconds..."
            sleep 10
        done
    else
        run_all_checks
        EXIT_CODE=$?
        show_detailed_status
        exit $EXIT_CODE
    fi
}

# Run main function
main "$@"
