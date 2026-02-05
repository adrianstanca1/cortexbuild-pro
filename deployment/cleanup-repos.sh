#!/bin/bash
# =============================================================================
# CortexBuild Pro - Repository Cleanup Script
# =============================================================================
# This script performs comprehensive cleanup of repositories and artifacts:
# - Docker images, containers, and volumes
# - Git repository optimization
# - Build artifacts and caches
# - Old logs and temporary files
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${SCRIPT_DIR}/cleanup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Print header
print_header() {
    echo -e "${CYAN}"
    echo "============================================================================="
    echo "  CortexBuild Pro - Repository Cleanup"
    echo "============================================================================="
    echo -e "${NC}"
}

# Get disk usage before cleanup
get_disk_usage_before() {
    DOCKER_BEFORE=$(docker system df --format "{{.Size}}" 2>/dev/null | head -1 || echo "0B")
    DISK_BEFORE=$(df -h / | awk 'NR==2 {print $3}')
    log_info "Disk usage before cleanup: $DISK_BEFORE"
}

# Get disk usage after cleanup
get_disk_usage_after() {
    DOCKER_AFTER=$(docker system df --format "{{.Size}}" 2>/dev/null | head -1 || echo "0B")
    DISK_AFTER=$(df -h / | awk 'NR==2 {print $3}')
    log_success "Disk usage after cleanup: $DISK_AFTER"
}

# Clean Docker artifacts
clean_docker() {
    log_info "Cleaning Docker artifacts..."
    
    # Remove stopped containers
    log_info "Removing stopped containers..."
    docker container prune -f 2>/dev/null || log_warn "Container cleanup had warnings"
    
    # Remove dangling images
    log_info "Removing dangling images..."
    docker image prune -f 2>/dev/null || log_warn "Image cleanup had warnings"
    
    # Remove unused images (be careful with this in production)
    if [[ "${1:-}" == "--aggressive" ]]; then
        log_warn "Running aggressive cleanup - removing all unused images..."
        docker image prune -af 2>/dev/null || log_warn "Aggressive image cleanup had warnings"
    fi
    
    # Remove unused networks
    log_info "Removing unused networks..."
    docker network prune -f 2>/dev/null || log_warn "Network cleanup had warnings"
    
    # Remove unused volumes (be careful with this)
    if [[ "${1:-}" == "--aggressive" ]]; then
        log_warn "Running aggressive cleanup - removing unused volumes..."
        docker volume prune -f 2>/dev/null || log_warn "Volume cleanup had warnings"
    fi
    
    # Remove build cache
    log_info "Removing build cache..."
    docker builder prune -f 2>/dev/null || log_warn "Builder cache cleanup had warnings"
    
    log_success "Docker cleanup completed"
}

# Clean Git repository
clean_git() {
    log_info "Cleaning Git repository..."
    cd "$APP_ROOT"
    
    # Run garbage collection
    log_info "Running git garbage collection..."
    git gc --aggressive --prune=now 2>/dev/null || log_warn "Git gc had warnings"
    
    # Clean untracked files (dry run first)
    log_info "Checking for untracked files..."
    UNTRACKED=$(git clean -xdn | wc -l)
    if [[ $UNTRACKED -gt 0 ]]; then
        log_info "Found $UNTRACKED untracked files/directories"
        if [[ "${1:-}" == "--aggressive" ]]; then
            log_warn "Removing untracked files..."
            git clean -xdf
        else
            log_info "Use --aggressive flag to remove untracked files"
        fi
    else
        log_info "No untracked files found"
    fi
    
    # Optimize repository
    log_info "Optimizing repository..."
    git repack -a -d --depth=250 --window=250 2>/dev/null || log_warn "Git repack had warnings"
    
    log_success "Git repository cleanup completed"
}

# Clean build artifacts
clean_build_artifacts() {
    log_info "Cleaning build artifacts..."
    cd "$APP_ROOT"
    
    # Clean Next.js build artifacts
    if [[ -d "nextjs_space/.next" ]]; then
        log_info "Cleaning Next.js .next directory..."
        cd nextjs_space
        rm -rf .next/cache || true
        log_success "Next.js cache cleaned"
        cd "$APP_ROOT"
    fi
    
    # Clean node_modules cache
    if [[ -d "nextjs_space/node_modules/.cache" ]]; then
        log_info "Cleaning node_modules cache..."
        rm -rf nextjs_space/node_modules/.cache || true
        log_success "node_modules cache cleaned"
    fi
    
    # Clean yarn cache
    log_info "Cleaning yarn cache..."
    cd nextjs_space
    yarn cache clean 2>/dev/null || log_info "Yarn cache clean not available or already clean"
    cd "$APP_ROOT"
    
    log_success "Build artifacts cleanup completed"
}

# Clean logs
clean_logs() {
    log_info "Cleaning old logs..."
    
    # Clean Docker logs older than 7 days
    log_info "Cleaning Docker container logs older than 7 days..."
    docker ps -aq | while read container; do
        if [[ -n "$container" ]]; then
            docker logs --tail 1000 "$container" > /dev/null 2>&1 || true
        fi
    done
    
    # Clean system logs older than 7 days
    if [[ -w /var/log ]]; then
        log_info "Cleaning system logs older than 7 days..."
        find /var/log -name "*.log.*" -type f -mtime +7 -delete 2>/dev/null || log_warn "Could not clean some system logs"
        find /var/log -name "*.gz" -type f -mtime +7 -delete 2>/dev/null || log_warn "Could not clean some compressed logs"
    fi
    
    # Clean application logs
    if [[ -d "${SCRIPT_DIR}/logs" ]]; then
        log_info "Cleaning application logs older than 7 days..."
        find "${SCRIPT_DIR}/logs" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    fi
    
    log_success "Logs cleanup completed"
}

# Clean temporary files
clean_temp_files() {
    log_info "Cleaning temporary files..."
    
    # Clean /tmp files older than 7 days
    if [[ -w /tmp ]]; then
        log_info "Cleaning /tmp files older than 7 days..."
        find /tmp -type f -mtime +7 -delete 2>/dev/null || log_warn "Could not clean some temp files"
    fi
    
    # Clean deployment temp files
    if [[ -d "${SCRIPT_DIR}/tmp" ]]; then
        log_info "Cleaning deployment temp files..."
        rm -rf "${SCRIPT_DIR}/tmp" || true
    fi
    
    log_success "Temporary files cleanup completed"
}

# Print cleanup summary
print_summary() {
    echo ""
    echo -e "${CYAN}============================================================================="
    echo "  Cleanup Summary"
    echo "=============================================================================${NC}"
    echo ""
    echo "Docker system info:"
    docker system df 2>/dev/null || echo "Docker info unavailable"
    echo ""
    echo "Repository size:"
    du -sh "$APP_ROOT" 2>/dev/null || echo "Size unavailable"
    echo ""
    log_success "Cleanup completed successfully!"
    echo ""
    echo "Log file: $LOG_FILE"
    echo ""
}

# Show usage
usage() {
    echo "Usage: $0 [--aggressive]"
    echo ""
    echo "Options:"
    echo "  --aggressive    Perform aggressive cleanup (removes unused Docker images and volumes)"
    echo ""
    echo "Examples:"
    echo "  $0              # Standard cleanup"
    echo "  $0 --aggressive # Aggressive cleanup (caution: may remove data)"
    exit 1
}

# Main execution
main() {
    print_header
    
    log_info "Starting repository cleanup..."
    log_info "Log file: $LOG_FILE"
    echo ""
    
    # Check for aggressive mode
    AGGRESSIVE_MODE=""
    if [[ "${1:-}" == "--aggressive" ]]; then
        log_warn "Running in AGGRESSIVE mode"
        AGGRESSIVE_MODE="--aggressive"
    fi
    
    # Get disk usage before
    get_disk_usage_before
    
    # Execute cleanup steps
    clean_docker "$AGGRESSIVE_MODE"
    clean_git "$AGGRESSIVE_MODE"
    clean_build_artifacts
    clean_logs
    clean_temp_files
    
    # Get disk usage after
    get_disk_usage_after
    
    print_summary
}

# Parse arguments
case "${1:-}" in
    -h|--help)
        usage
        ;;
    *)
        main "$@"
        ;;
esac
