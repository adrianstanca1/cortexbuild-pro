#!/bin/bash
# =============================================================================
# CortexBuild Pro - Integration Check Script
# =============================================================================
# This script performs comprehensive checks on all committed and uncommitted
# changes before deployment or merging:
# 1. Checks for uncommitted changes
# 2. Validates TypeScript compilation
# 3. Runs linting checks
# 4. Validates Prisma schema
# 5. Runs build validation
# 6. Checks Docker configuration
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"
NEXTJS_DIR="${APP_ROOT}/nextjs_space"
DEPLOYMENT_DIR="${APP_ROOT}/deployment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0
CHECKS_TOTAL=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
}

log_warn() {
    echo -e "${YELLOW}[⚠]${NC} $1"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
}

log_section() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Print header
print_header() {
    clear
    echo -e "${CYAN}"
    echo "============================================================================="
    echo "  CortexBuild Pro - Integration Check"
    echo "  Validating all changes before integration"
    echo "============================================================================="
    echo -e "${NC}"
}

# Check 1: Git status and uncommitted changes
check_git_status() {
    log_section "1. Git Status Check"
    
    cd "$APP_ROOT"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        return 1
    fi
    
    log_info "Current branch: $(git rev-parse --abbrev-ref HEAD)"
    log_info "Latest commit: $(git log -1 --oneline)"
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        log_warn "Found uncommitted changes:"
        git status --short
        echo ""
        log_warn "Consider committing these changes before proceeding"
    else
        log_success "No uncommitted changes - working tree is clean"
    fi
    
    # Check for unpushed commits
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
    
    if [ -z "$REMOTE" ]; then
        log_warn "No upstream branch configured"
    elif [ "$LOCAL" != "$REMOTE" ]; then
        log_warn "Local branch has unpushed commits"
        git log --oneline @{u}..HEAD
    else
        log_success "Branch is up to date with remote"
    fi
}

# Check 2: Node.js dependencies
check_dependencies() {
    log_section "2. Dependencies Check"
    
    cd "$NEXTJS_DIR"
    
    if [ ! -d "node_modules" ]; then
        log_warn "node_modules not found - installing dependencies..."
        npm ci
        log_success "Dependencies installed"
    else
        log_info "Checking if dependencies are up to date..."
        if npm ci --dry-run 2>&1 | grep -q "up to date"; then
            log_success "Dependencies are up to date"
        else
            log_warn "Dependencies may need updating - consider running 'npm ci'"
        fi
    fi
}

# Check 3: TypeScript type checking
check_typescript() {
    log_section "3. TypeScript Type Check"
    
    cd "$NEXTJS_DIR"
    
    # Set a dummy DATABASE_URL for Prisma generation
    export DATABASE_URL="${DATABASE_URL:-postgresql://test:test@localhost:5432/test}"
    
    log_info "Running TypeScript compiler..."
    
    # Generate Prisma client first
    log_info "Generating Prisma client..."
    npx prisma generate > /dev/null 2>&1 || {
        log_error "Failed to generate Prisma client"
        return 1
    }
    
    if npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt; then
        log_success "TypeScript type check passed"
    else
        log_error "TypeScript type check failed"
        echo ""
        cat /tmp/tsc-output.txt
        return 1
    fi
}

# Check 4: ESLint
check_linting() {
    log_section "4. Linting Check"
    
    cd "$NEXTJS_DIR"
    
    log_info "Running ESLint..."
    
    if npm run lint 2>&1 | tee /tmp/eslint-output.txt; then
        log_success "Linting check passed"
    else
        log_error "Linting check failed"
        echo ""
        cat /tmp/eslint-output.txt
        return 1
    fi
}

# Check 5: Prisma schema validation
check_prisma_schema() {
    log_section "5. Prisma Schema Validation"
    
    cd "$NEXTJS_DIR"
    
    # Set a dummy DATABASE_URL for validation
    export DATABASE_URL="${DATABASE_URL:-postgresql://test:test@localhost:5432/test}"
    
    log_info "Validating Prisma schema..."
    
    if npx prisma validate 2>&1 | tee /tmp/prisma-validate.txt; then
        log_success "Prisma schema is valid"
    else
        log_error "Prisma schema validation failed"
        echo ""
        cat /tmp/prisma-validate.txt
        return 1
    fi
    
    log_info "Checking schema formatting..."
    if npx prisma format --check 2>&1 | tee /tmp/prisma-format.txt; then
        log_success "Prisma schema is properly formatted"
    else
        log_warn "Prisma schema formatting issues detected"
        log_info "Run 'npx prisma format' to fix"
    fi
}

# Check 6: Next.js build
check_build() {
    log_section "6. Next.js Build Check"
    
    cd "$NEXTJS_DIR"
    
    log_info "Building Next.js application..."
    log_info "This may take a few minutes..."
    
    # Set required environment variables for build
    export SKIP_ENV_VALIDATION=true
    export DATABASE_URL="${DATABASE_URL:-postgresql://test:test@localhost:5432/test}"
    
    if npm run build 2>&1 | tee /tmp/build-output.txt; then
        log_success "Next.js build completed successfully"
    else
        log_error "Next.js build failed"
        echo ""
        tail -50 /tmp/build-output.txt
        return 1
    fi
}

# Check 7: Docker configuration
check_docker_config() {
    log_section "7. Docker Configuration Check"
    
    cd "$DEPLOYMENT_DIR"
    
    log_info "Checking Docker Compose configuration..."
    
    # Capture docker compose config output (disable exit on error temporarily)
    set +e
    DOCKER_CONFIG_OUTPUT=$(docker compose config 2>&1)
    DOCKER_CONFIG_EXIT=$?
    set -e
    
    # Check if docker compose config works (with or without .env)
    if [ $DOCKER_CONFIG_EXIT -eq 0 ]; then
        log_success "Docker Compose configuration is valid"
    else
        # Check if it's just a missing .env file
        if echo "$DOCKER_CONFIG_OUTPUT" | grep -q "env file.*not found"; then
            log_warn "Docker Compose config requires .env file (will be provided at deployment)"
            log_info "This is expected for integration checks"
        else
            log_error "Docker Compose configuration has errors"
            echo "$DOCKER_CONFIG_OUTPUT" | tail -10
            return 1
        fi
    fi
    
    log_info "Checking if Dockerfile exists..."
    if [ -f "Dockerfile" ]; then
        log_success "Dockerfile found"
    else
        log_error "Dockerfile not found"
        return 1
    fi
    
    log_info "Validating Dockerfile syntax..."
    # Just check if the file has basic structure
    if grep -q "FROM" Dockerfile && grep -q "WORKDIR" Dockerfile; then
        log_success "Dockerfile has valid structure"
    else
        log_warn "Dockerfile may be missing required directives"
    fi
}

# Check 8: Environment configuration
check_environment() {
    log_section "8. Environment Configuration Check"
    
    cd "$APP_ROOT"
    
    log_info "Checking environment template..."
    if [ -f ".env.template" ]; then
        log_success ".env.template file exists"
    else
        log_warn ".env.template file not found"
    fi
    
    cd "$NEXTJS_DIR"
    if [ -f ".env.example" ]; then
        log_success ".env.example file exists"
    else
        log_warn ".env.example file not found"
    fi
    
    if [ -f ".env" ]; then
        log_warn ".env file exists (ensure it's not committed)"
        if git ls-files --error-unmatch .env > /dev/null 2>&1; then
            log_error ".env file is tracked by git - SECURITY RISK!"
        else
            log_success ".env file is not tracked by git"
        fi
    else
        log_info ".env file not present (will use environment variables)"
    fi
}

# Check 9: Security check
check_security() {
    log_section "9. Security Check"
    
    cd "$APP_ROOT"
    
    log_info "Checking for sensitive files in git..."
    
    # Check for actual .env files (not .env.example or .env.template)
    FOUND_SENSITIVE=false
    
    # Check for .env files (excluding examples and templates)
    if git ls-files | grep -E '^\.env$|/\.env$' > /dev/null 2>&1; then
        log_error "Found .env file in git - SECURITY RISK!"
        git ls-files | grep -E '^\.env$|/\.env$'
        FOUND_SENSITIVE=true
    fi
    
    # Check for private keys
    if git ls-files | grep -E '\.pem$|\.key$|_rsa$|\.p12$|\.pfx$' > /dev/null 2>&1; then
        log_error "Found private key files in git - SECURITY RISK!"
        git ls-files | grep -E '\.pem$|\.key$|_rsa$|\.p12$|\.pfx$'
        FOUND_SENSITIVE=true
    fi
    
    # Check for files with 'secret' in the name (excluding common false positives)
    if git ls-files | grep -iE 'secret[^/]*\.(json|txt|yml|yaml|conf|config)$' > /dev/null 2>&1; then
        log_warn "Found files with 'secret' in the name:"
        git ls-files | grep -iE 'secret[^/]*\.(json|txt|yml|yaml|conf|config)$'
        FOUND_SENSITIVE=true
    fi
    
    if [ "$FOUND_SENSITIVE" = false ]; then
        log_success "No sensitive files found in git"
    fi
    
    log_info "Checking .gitignore configuration..."
    if [ -f ".gitignore" ]; then
        if grep -q ".env" .gitignore && grep -q "node_modules" .gitignore; then
            log_success ".gitignore properly configured"
        else
            log_warn ".gitignore may be missing important entries"
        fi
    else
        log_error ".gitignore file not found"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Integration Check Summary${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Total Checks: ${CHECKS_TOTAL}"
    echo -e "${GREEN}Passed: ${CHECKS_PASSED}${NC}"
    echo -e "${YELLOW}Warnings: ${CHECKS_WARNING}${NC}"
    echo -e "${RED}Failed: ${CHECKS_FAILED}${NC}"
    echo ""
    
    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All critical checks passed!${NC}"
        echo -e "${GREEN}✓ Changes are ready for integration${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ Some checks failed${NC}"
        echo -e "${RED}✗ Please fix the issues before integrating${NC}"
        echo ""
        return 1
    fi
}

# Main execution
main() {
    print_header
    
    # Allow running specific checks
    if [ $# -gt 0 ]; then
        case "$1" in
            git) check_git_status ;;
            deps) check_dependencies ;;
            types) check_typescript ;;
            lint) check_linting ;;
            prisma) check_prisma_schema ;;
            build) check_build ;;
            docker) check_docker_config ;;
            env) check_environment ;;
            security) check_security ;;
            *)
                echo "Unknown check: $1"
                echo "Available checks: git, deps, types, lint, prisma, build, docker, env, security"
                exit 1
                ;;
        esac
        exit $?
    fi
    
    # Run all checks
    check_git_status || true
    check_dependencies || true
    check_typescript || true
    check_linting || true
    check_prisma_schema || true
    check_build || true
    check_docker_config || true
    check_environment || true
    check_security || true
    
    print_summary
    exit $?
}

# Run main function
main "$@"
